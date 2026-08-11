const {
  persistScrapedNotices,
  synchronizeNotices,
} = require('../services/noticeSyncService');

function scrapedNotice(overrides = {}) {
  return {
    title: 'Production notice',
    content: 'Production content',
    language: 'Korean',
    posted_date: '2026-07-24T00:00:00.000Z',
    source: 'international',
    source_url: 'https://example.edu/notice/1',
    external_id: '1',
    scraped_at: '2026-07-25T00:00:00.000Z',
    ...overrides,
  };
}

function createMemorySupabase(initialRows = [], options = {}) {
  let nextId = 1;
  const rows = new Map();

  for (const row of initialRows) {
    const stored = { notice_id: nextId++, ...row };
    rows.set(stored.source_url, stored);
  }

  const from = jest.fn((tableName) => {
    expect(tableName).toBe('notice');
    return {
      select: jest.fn(() => ({
        eq: jest.fn((_column, sourceUrl) => ({
          maybeSingle: jest.fn(async () => {
            if (options.lookupError) {
              return { data: null, error: options.lookupError };
            }
            return {
              data: rows.has(sourceUrl)
                ? { ...rows.get(sourceUrl) }
                : null,
              error: null,
            };
          }),
        })),
      })),
      update: jest.fn((values) => ({
        eq: jest.fn(async (_column, noticeId) => {
          const entry = [...rows.entries()].find(
            ([, row]) => row.notice_id === noticeId,
          );
          if (!entry) {
            return { error: { code: 'PGRST116', message: 'not found' } };
          }
          rows.set(entry[0], { ...entry[1], ...values });
          return { error: options.updateError || null };
        }),
      })),
      insert: jest.fn(async (values) => {
        if (options.conflictWithoutRow) {
          return {
            error: { code: '23505', message: 'duplicate source_url' },
          };
        }
        if (options.conflictOnFirstInsert && !options.conflictTriggered) {
          options.conflictTriggered = true;
          rows.set(values.source_url, {
            notice_id: nextId++,
            ...values,
          });
          return {
            error: { code: '23505', message: 'duplicate source_url' },
          };
        }
        if (rows.has(values.source_url)) {
          return {
            error: { code: '23505', message: 'duplicate source_url' },
          };
        }
        if (options.insertError) {
          return { error: options.insertError };
        }
        rows.set(values.source_url, {
          notice_id: nextId++,
          ...values,
        });
        return { error: null };
      }),
    };
  });

  return { client: { from }, rows, from };
}

describe('notice synchronization persistence', () => {
  test('inserts once, skips an unchanged repeat, then applies a real metadata update', async () => {
    const { client, rows } = createMemorySupabase();
    const first = scrapedNotice();

    await expect(
      persistScrapedNotices(client, [first]),
    ).resolves.toEqual({ inserted: 1, updated: 0, unchanged: 0 });
    expect(rows.get(first.source_url)).toMatchObject({
      external_id: '1',
    });

    await expect(
      persistScrapedNotices(client, [scrapedNotice()]),
    ).resolves.toEqual({ inserted: 0, updated: 0, unchanged: 1 });

    await expect(
      persistScrapedNotices(client, [
        scrapedNotice({
          title: 'Updated production notice',
          external_id: 'updated-1',
        }),
      ]),
    ).resolves.toEqual({ inserted: 0, updated: 1, unchanged: 0 });

    expect(rows.size).toBe(1);
    expect(rows.get(first.source_url)).toMatchObject({
      title: 'Updated production notice',
      external_id: 'updated-1',
    });
  });

  test('preserves a richer existing title and body instead of replacing them with a list summary', async () => {
    const existing = scrapedNotice({
      title: 'Complete official notice title',
      content: 'Complete official notice body with eligibility, dates, application steps, and contact details.',
      scraped_at: '2026-07-24T00:00:00.000Z',
    });
    const { client, rows } = createMemorySupabase([existing]);

    await expect(
      persistScrapedNotices(client, [
        scrapedNotice({
          title: 'Short title',
          content: 'Short title\nSource: PNU International',
          scraped_at: '2026-08-12T00:00:00.000Z',
        }),
      ]),
    ).resolves.toEqual({ inserted: 0, updated: 0, unchanged: 1 });

    expect(rows.get(existing.source_url)).toMatchObject({
      title: existing.title,
      content: existing.content,
      scraped_at: existing.scraped_at,
    });
  });

  test('preserves richer text while applying a genuine metadata correction', async () => {
    const existing = scrapedNotice({
      content: 'Full official body with considerably more useful detail than the list summary.',
      external_id: 'old-id',
    });
    const { client, rows } = createMemorySupabase([existing]);

    await expect(
      persistScrapedNotices(client, [
        scrapedNotice({
          content: 'Production notice\nSource: PNU International',
          external_id: 'corrected-id',
        }),
      ]),
    ).resolves.toEqual({ inserted: 0, updated: 1, unchanged: 0 });

    expect(rows.get(existing.source_url)).toMatchObject({
      content: existing.content,
      external_id: 'corrected-id',
    });
  });

  test('accepts incoming text when it is demonstrably richer', async () => {
    const existing = scrapedNotice({ content: 'Brief summary' });
    const richer = 'Brief summary with complete eligibility, schedule, application, and contact information.';
    const { client, rows } = createMemorySupabase([existing]);

    await expect(
      persistScrapedNotices(client, [scrapedNotice({ content: richer })]),
    ).resolves.toEqual({ inserted: 0, updated: 1, unchanged: 0 });
    expect(rows.get(existing.source_url).content).toBe(richer);
  });

  test('treats time-of-day differences on the same posted calendar date as unchanged', async () => {
    const existing = scrapedNotice({
      posted_date: '2026-07-24T00:00:00.000Z',
      scraped_at: '2026-07-24T01:00:00.000Z',
    });
    const { client, rows } = createMemorySupabase([existing]);

    await expect(
      persistScrapedNotices(client, [
        scrapedNotice({
          posted_date: '2026-07-24T03:00:00.000Z',
          scraped_at: '2026-08-12T00:00:00.000Z',
        }),
      ]),
    ).resolves.toEqual({ inserted: 0, updated: 0, unchanged: 1 });

    expect(rows.get(existing.source_url)).toMatchObject({
      posted_date: existing.posted_date,
      scraped_at: existing.scraped_at,
    });
  });

  test('recovers from a concurrent unique conflict without duplicating', async () => {
    const options = { conflictOnFirstInsert: true };
    const { client, rows } = createMemorySupabase([], options);

    await expect(
      persistScrapedNotices(client, [scrapedNotice()]),
    ).resolves.toEqual({ inserted: 0, updated: 0, unchanged: 1 });

    expect(rows.size).toBe(1);
  });

  test('propagates a non-conflict insert failure', async () => {
    const insertError = { code: '08006', message: 'insert unavailable' };
    const { client } = createMemorySupabase([], { insertError });

    await expect(
      persistScrapedNotices(client, [scrapedNotice()]),
    ).rejects.toBe(insertError);
  });

  test('propagates an update failure', async () => {
    const updateError = { code: '08006', message: 'update unavailable' };
    const existing = scrapedNotice();
    const { client } = createMemorySupabase([existing], { updateError });

    await expect(
      persistScrapedNotices(client, [
        scrapedNotice({ external_id: 'updated-1' }),
      ]),
    ).rejects.toBe(updateError);
  });

  test('fails safely when a unique conflict row cannot be refetched', async () => {
    const { client } = createMemorySupabase([], {
      conflictWithoutRow: true,
    });

    await expect(
      persistScrapedNotices(client, [scrapedNotice()]),
    ).rejects.toMatchObject({
      code: '23505',
      message: 'duplicate source_url',
    });
  });

  test('propagates database lookup failures', async () => {
    const lookupError = { code: '08006', message: 'database unavailable' };
    const { client } = createMemorySupabase([], { lookupError });

    await expect(
      persistScrapedNotices(client, [scrapedNotice()]),
    ).rejects.toBe(lookupError);
  });

  test('rejects overlapping synchronization requests', async () => {
    let releaseScrape;
    const scrapeNotices = jest.fn(
      () =>
        new Promise((resolve) => {
          releaseScrape = resolve;
        }),
    );
    const { client } = createMemorySupabase();

    const first = synchronizeNotices({
      supabaseClient: client,
      scrapeNotices,
    });
    await Promise.resolve();

    await expect(
      synchronizeNotices({
        supabaseClient: client,
        scrapeNotices,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'NOTICE_SYNC_IN_PROGRESS',
    });

    releaseScrape([scrapedNotice()]);
    await expect(first).resolves.toMatchObject({
      inserted: 1,
      updated: 0,
    });
  });
});
