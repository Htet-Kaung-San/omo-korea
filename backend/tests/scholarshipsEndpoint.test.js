const express = require('express');
const request = require('supertest');

const mockSupabase = { from: jest.fn() };

jest.mock('../supabaseClient', () => mockSupabase);
jest.mock('../ai/supabaseDataRepository', () => ({
  fetchAllCourses: jest.fn(),
  fetchAllNotices: jest.fn(),
  fetchDashboardCatalogs: jest.fn(),
}));
jest.mock('../services/pnuNoticeScraperService', () => ({
  scrapeRecentNotices: jest.fn(),
  noticeSourceLabel: jest.fn((source) => source || 'PNU'),
}));
jest.mock('../services/noticeSyncService', () => ({
  synchronizeNotices: jest.fn(),
}));

const studentRoutes = require('../routes/studentRoutes');

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use('/api/students', studentRoutes);
  return instance;
}

function scholarshipQuery(data, error = null) {
  return {
    select: jest.fn(() => ({
      order: jest.fn(() => Promise.resolve({ data, error })),
    })),
  };
}

function noticeQuery(data, error = null) {
  return {
    select: jest.fn(() => ({
      order: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ data, error })),
      })),
    })),
  };
}

describe('GET /api/students/scholarships', () => {
  beforeEach(() => jest.clearAllMocks());

  test('uses verified scholarship notices when the scholarship table is empty', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'scholarship') return scholarshipQuery([]);
      if (table === 'notice') {
        return noticeQuery([
          {
            notice_id: 91,
            title: '[장학] 국가장학금 신청 안내',
            content: 'Check the official eligibility and application instructions.',
            posted_date: '2026-08-16',
            source: 'pnu-main',
            source_url: 'https://www.pusan.ac.kr/scholarship/91',
          },
          {
            notice_id: 92,
            title: 'General campus notice',
            content: 'Campus maintenance information.',
            posted_date: '2026-08-15',
            source: 'pnu-main',
            source_url: 'https://www.pusan.ac.kr/notice/92',
          },
        ]);
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const response = await request(app())
      .get('/api/students/scholarships')
      .expect(200);

    expect(response.body.metadata).toEqual({ source: 'notice', verifiedOnly: true });
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toEqual(expect.objectContaining({
      id: 'notice-91',
      title: '[장학] 국가장학금 신청 안내',
      sourceUrl: 'https://www.pusan.ac.kr/scholarship/91',
    }));
  });

  test('keeps populated scholarship rows as the primary source', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'scholarship') {
        return scholarshipQuery([{
          scholarship_id: 12,
          scholarship_name: 'PNU Global Scholarship',
          description: 'Verified scholarship row.',
          deadline: '2026-09-30',
        }]);
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const response = await request(app())
      .get('/api/students/scholarships')
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe('12');
    expect(mockSupabase.from).toHaveBeenCalledTimes(1);
  });
});
