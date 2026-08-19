/**
 * The embedding call, and the one mistake that silently ruins a knowledge base.
 *
 * Every stored vector and every query vector must come from the same model at
 * the same size. kb_chunk.embedding is vector(768); a vector of any other
 * length either fails the insert or, worse, gets compared against vectors from
 * a different model — cosine similarity between two unrelated spaces still
 * returns a number, so retrieval would confidently surface the wrong documents
 * rather than returning nothing.
 *
 * This is not hypothetical. On 2026-08-19 the Gemini project behind embeddings
 * was blocked account-wide, retrieval returned nothing for every question, and
 * the assistant told a student they could work "up to 20 hours per week" —
 * the guide this app ships says 10/25/30-35 depending on TOPIK level and year.
 */
process.env.OPENROUTER_API_KEY = 'test-key';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_KEY = 'test';

jest.mock('../supabaseClient', () => ({ from: jest.fn(), rpc: jest.fn() }));

const ragService = require('../services/ragService');

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

const vectorOf = (n) => Array.from({ length: n }, (_, i) => i / n);

function mockEmbedding(body, ok = true, status = 200) {
  const calls = [];
  global.fetch = jest.fn(async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body), headers: options.headers });
    return {
      ok,
      status,
      statusText: ok ? 'OK' : 'Forbidden',
      json: async () => body,
      text: async () => JSON.stringify(body),
    };
  });
  return calls;
}

describe('the embedding request', () => {
  test('asks OpenRouter for exactly 768 dimensions', async () => {
    const calls = mockEmbedding({ data: [{ embedding: vectorOf(768) }] });

    const vector = await ragService.generateEmbedding('part time work permit');

    expect(vector).toHaveLength(768);
    expect(calls[0].url).toBe('https://openrouter.ai/api/v1/embeddings');
    // Without `dimensions`, text-embedding-3-small returns 1536 and every
    // insert into vector(768) fails.
    expect(calls[0].body.dimensions).toBe(768);
    expect(calls[0].body.model).toMatch(/embedding/);
    expect(calls[0].headers.Authorization).toBe('Bearer test-key');
  });

  test('refuses a vector of the wrong size rather than storing it', async () => {
    // What text-embedding-3-small returns if `dimensions` is ever dropped.
    mockEmbedding({ data: [{ embedding: vectorOf(1536) }] });

    await expect(ragService.generateEmbedding('x')).rejects.toThrow(/768 dimensions, got 1536/);
  });

  test('refuses a malformed response rather than storing garbage', async () => {
    mockEmbedding({ data: [] });

    await expect(ragService.generateEmbedding('x')).rejects.toThrow(/expected 768 dimensions/);
  });

  test('surfaces a provider rejection with its status, not a bare failure', async () => {
    // The shape of the outage that started all this.
    mockEmbedding({ error: { code: 403, message: 'Your project has been denied access.' } }, false, 403);

    await expect(ragService.generateEmbedding('x')).rejects.toThrow(/HTTP 403/);
  });

  test('reports the embedding provider as configured from the OpenRouter key', () => {
    expect(ragService.isEmbeddingConfigured()).toBe(true);
  });
});
