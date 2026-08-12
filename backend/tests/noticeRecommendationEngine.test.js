const { mapNoticeRow } = require('../ai/supabaseDataRepository');
const {
  recommendNotices,
} = require('../ai/noticeRecommendationEngine');

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

describe('Notice recommendation engine with production-shaped rows', () => {
  test('does not expire a notice that has posted_date but no real deadline', () => {
    const notice = mapNoticeRow(productionNoticeRow(1));

    const recommendations = recommendNotices(
      { languages: ['ko'] },
      [notice],
      { asOfDate: '2026-07-25' },
    );

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0]).toMatchObject({
      id: '1',
      deadline: null,
      languages: ['Korean'],
      deadlineInfo: {
        status: 'unknown',
        daysRemaining: null,
      },
    });
    expect(recommendations[0].score).toBeGreaterThan(0);
  });

  test('ranks thin live-shaped rows using language and recency safely', () => {
    const older = mapNoticeRow(
      productionNoticeRow(1, {
        title: 'Older notice',
        posted_date: '2026-06-20',
      }),
    );
    const newer = mapNoticeRow(
      productionNoticeRow(2, {
        title: 'Newer notice',
        posted_date: '2026-07-24',
      }),
    );

    const recommendations = recommendNotices(
      {
        major: 'Computer Science & Engineering',
        nationality: 'Mongolia',
        year: 3,
        interests: ['AI'],
        languages: ['ko'],
      },
      [older, newer],
      { asOfDate: '2026-07-25' },
    );

    expect(recommendations.map((notice) => notice.id)).toEqual(['2', '1']);
    expect(recommendations[0].matchHint).toContain(
      'Available in your language: Korean',
    );
    expect(recommendations[0].matchHint).toContain('Recently posted');
  });

  test('uses stable title and id tie-breakers for deterministic ordering', () => {
    const notices = [
      mapNoticeRow(productionNoticeRow(3, { title: 'Beta' })),
      mapNoticeRow(productionNoticeRow(2, { title: 'Alpha' })),
      mapNoticeRow(productionNoticeRow(1, { title: 'Alpha' })),
    ];

    const firstRun = recommendNotices({}, notices, {
      asOfDate: '2026-07-25',
    });
    const secondRun = recommendNotices({}, [...notices].reverse(), {
      asOfDate: '2026-07-25',
    });

    expect(firstRun.map((notice) => notice.id)).toEqual(['1', '2', '3']);
    expect(secondRun.map((notice) => notice.id)).toEqual(['1', '2', '3']);
  });
});
