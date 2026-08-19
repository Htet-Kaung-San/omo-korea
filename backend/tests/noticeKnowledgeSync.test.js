/**
 * Publishing scraped notices into the knowledge base.
 *
 * The scraper had been collecting notices from five PNU boards every fifteen
 * minutes and none of it reached the assistant — "is there a notice about the
 * semiconductor camp?" was answered from general knowledge while the notice sat
 * in Postgres. These pin the three ways that sync can go quietly wrong on a
 * cron nobody watches.
 */
jest.mock('../services/ragService', () => ({
  isEmbeddingConfigured: jest.fn(() => true),
  syncDocument: jest.fn(async () => ({ success: true, chunksCount: 1 })),
}));

const ragService = require('../services/ragService');
const { syncNoticesToKnowledgeBase, CATEGORY } = require('../services/noticeKnowledgeService');

/** Minimal Supabase stub: notice reads, kb_document/kb_chunk reads and writes. */
function createSupabase({ notices = [], docs = [], chunks = [] } = {}) {
  const state = { notices, docs: [...docs], chunks: [...chunks], deletedDocIds: [], inserted: [], updated: [] };
  let nextId = 1000;

  const from = (table) => {
    if (table === 'notice') {
      const chain = {
        select: () => chain,
        gte: () => chain,
        order: () => Promise.resolve({ data: state.notices, error: null }),
      };
      return chain;
    }
    if (table === 'kb_chunk') {
      const chain = {
        select: () => Promise.resolve({ data: state.chunks, error: null }),
        delete: () => ({ eq: (_c, id) => { state.chunks = state.chunks.filter((r) => r.document_id !== id); return Promise.resolve({ error: null }); } }),
      };
      return chain;
    }
    // kb_document
    const chain = {
      select: () => chain,
      eq: () => Promise.resolve({ data: state.docs, error: null }),
      insert: (row) => ({
        select: () => ({
          single: () => {
            const doc = { id: nextId++, ...row };
            state.docs.push(doc);
            state.inserted.push(doc);
            return Promise.resolve({ data: doc, error: null });
          },
        }),
      }),
      update: (patch) => ({
        eq: (_c, id) => {
          const doc = state.docs.find((d) => d.id === id);
          if (doc) Object.assign(doc, patch);
          state.updated.push(id);
          return Promise.resolve({ error: null });
        },
      }),
      delete: () => ({ eq: (_c, id) => { state.deletedDocIds.push(id); state.docs = state.docs.filter((d) => d.id !== id); return Promise.resolve({ error: null }); } }),
    };
    return chain;
  };

  return { client: { from }, state };
}

const notice = (over = {}) => ({
  notice_id: 1,
  title: 'Semiconductor design camp',
  content: '',
  source: 'pnu-main',
  source_url: 'https://pusan.ac.kr/x',
  posted_date: '2026-08-14',
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  ragService.isEmbeddingConfigured.mockReturnValue(true);
});

describe('publishing notices to the knowledge base', () => {
  test('creates a document and embeds it', async () => {
    const { client, state } = createSupabase({ notices: [notice()] });

    const result = await syncNoticesToKnowledgeBase(client);

    expect(result.created).toBe(1);
    expect(result.embedded).toBe(1);
    expect(state.inserted[0].category).toBe(CATEGORY);
    // The date has to survive: without it the assistant cannot tell a student
    // whether a deadline has already passed.
    expect(state.inserted[0].content).toContain('2026-08-14');
    expect(state.inserted[0].content).toContain('https://pusan.ac.kr/x');
  });

  test('a re-posted announcement does not thrash one document forever', async () => {
    // Boards re-post under a later date. Both mapped to the same document, so
    // every run rewrote it as the other and re-embedded both — permanently, on
    // a fifteen-minute cron.
    const { client, state } = createSupabase({
      notices: [
        notice({ notice_id: 92, posted_date: '2026-08-10', source_url: 'https://x/old' }),
        notice({ notice_id: 291, posted_date: '2026-08-14', source_url: 'https://x/new' }),
      ],
    });

    const result = await syncNoticesToKnowledgeBase(client);

    expect(result.deduplicated).toBe(1);
    expect(state.inserted).toHaveLength(1);
    // The newer posting wins — it is the one whose deadline still stands.
    expect(state.inserted[0].content).toContain('https://x/new');
  });

  test('a document written without an embedding key is embedded on a later run', async () => {
    // The notice cron has Supabase credentials but no embedding key, so it
    // writes documents it cannot embed. Their content is then unchanged
    // forever, and a content-only comparison would never revisit them — the
    // notice would sit in the knowledge base permanently invisible.
    // The content must match EXACTLY what the sync would write. Giving it
    // different text would take the update path instead and the test would
    // pass without ever exercising the unembedded case.
    const currentContent = [
      'Semiconductor design camp',
      'Posted: 2026-08-14',
      'Board: pnu-main',
      'Source: https://pusan.ac.kr/x',
    ].join('\n');
    const existing = { id: 7, title: '[공지] Semiconductor design camp', content: currentContent };
    const { client } = createSupabase({ notices: [notice()], docs: [existing], chunks: [] });

    const result = await syncNoticesToKnowledgeBase(client);

    expect(result.embedded).toBe(1);
    expect(ragService.syncDocument).toHaveBeenCalledWith(7);
  });

  test('nothing is rewritten when the notice and its chunks are current', async () => {
    const { client } = createSupabase({ notices: [notice()], docs: [], chunks: [] });
    await syncNoticesToKnowledgeBase(client);
    jest.clearAllMocks();

    const seeded = createSupabase({ notices: [notice()], docs: [], chunks: [] });
    const first = await syncNoticesToKnowledgeBase(seeded.client);
    seeded.state.chunks.push({ document_id: seeded.state.inserted[0].id });
    const second = await syncNoticesToKnowledgeBase(seeded.client);

    expect(first.created).toBe(1);
    expect(second.created).toBe(0);
    expect(second.updated).toBe(0);
    expect(second.embedded).toBe(0);
    expect(second.unchanged).toBe(1);
  });

  test('notices that aged out of the window are removed from the knowledge base', async () => {
    // A closed application competing for a retrieval slot is worse than
    // nothing: a student told about a passed deadline is misinformed.
    const stale = { id: 42, title: '[공지] Last semester event', content: 'old' };
    const { client, state } = createSupabase({ notices: [notice()], docs: [stale] });

    const result = await syncNoticesToKnowledgeBase(client);

    expect(result.pruned).toBe(1);
    expect(state.deletedDocIds).toContain(42);
  });

  test('without an embedding key it still records the notices and says so', async () => {
    ragService.isEmbeddingConfigured.mockReturnValue(false);
    const { client } = createSupabase({ notices: [notice()] });

    const result = await syncNoticesToKnowledgeBase(client);

    expect(result.created).toBe(1);
    expect(result.embedded).toBe(0);
    expect(result.embeddingSkipped).toBe(true);
    expect(ragService.syncDocument).not.toHaveBeenCalled();
  });
});
