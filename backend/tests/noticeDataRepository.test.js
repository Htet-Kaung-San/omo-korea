const {
  fetchAllNotices,
  mapNoticeRow,
} = require('../ai/supabaseDataRepository');

function productionNoticeRow(id, overrides = {}) {
  return {
    notice_id: id,
    title: `Notice ${id}`,
    content: `Content ${id}`,
    posted_date: '2026-07-16',
    language: 'Korean',
    source: 'international',
    source_url: `https://example.edu/notices/${id}`,
    category: null,
    tags: null,
    ...overrides,
  };
}

function createPagedSupabase(pageResults) {
  let pageIndex = 0;
  const range = jest.fn(() => Promise.resolve(pageResults[pageIndex++]));
  const order = jest.fn(() => ({ range }));
  const select = jest.fn(() => ({ order }));
  const from = jest.fn(() => ({ select }));

  return {
    supabase: { from },
    spies: { from, select, order, range },
  };
}

describe('Notice Supabase data repository', () => {
  test('maps singular production language and keeps posting date separate from deadline', () => {
    const notice = mapNoticeRow(productionNoticeRow(1));

    expect(notice).toMatchObject({
      id: '1',
      title: 'Notice 1',
      body: 'Content 1',
      postedDate: '2026-07-16',
      deadline: null,
      category: null,
      priority: null,
      languages: ['Korean'],
      source: 'international',
      sourceUrl: 'https://example.edu/notices/1',
    });
  });

  test('paginates deterministically beyond 1,000 notices', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) =>
      productionNoticeRow(index + 1)
    );
    const secondPage = Array.from({ length: 5 }, (_, index) =>
      productionNoticeRow(index + 1001)
    );
    const { supabase, spies } = createPagedSupabase([
      { data: firstPage, error: null },
      { data: secondPage, error: null },
    ]);

    const notices = await fetchAllNotices(supabase);

    expect(notices).toHaveLength(1005);
    expect(notices[0].id).toBe('1');
    expect(notices[1004].id).toBe('1005');
    expect(spies.from).toHaveBeenCalledTimes(2);
    expect(spies.from).toHaveBeenNthCalledWith(1, 'notice');
    expect(spies.order).toHaveBeenCalledTimes(2);
    expect(spies.order).toHaveBeenNthCalledWith(
      1,
      'notice_id',
      { ascending: true },
    );
    expect(spies.range.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
  });

  test('propagates a later-page Supabase failure', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) =>
      productionNoticeRow(index + 1)
    );
    const { supabase } = createPagedSupabase([
      { data: firstPage, error: null },
      {
        data: null,
        error: { code: '08006', message: 'database unavailable' },
      },
    ]);

    await expect(fetchAllNotices(supabase)).rejects.toMatchObject({
      message: 'Failed to fetch notices from Supabase: database unavailable',
      statusCode: 502,
      code: 'SUPABASE_NOTICE_QUERY_FAILED',
    });
  });
});
