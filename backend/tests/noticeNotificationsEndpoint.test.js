const express = require('express');
const request = require('supertest');

const mockSupabase = {
  from: jest.fn(),
};
const mockFetchAllNotices = jest.fn();
const mockRecommendNotices = jest.fn();

jest.mock('../supabaseClient', () => mockSupabase);
jest.mock('../ai/supabaseDataRepository', () => ({
  fetchAllNotices: mockFetchAllNotices,
  fetchDashboardCatalogs: jest.fn(),
}));
jest.mock('../ai/noticeRecommendationEngine', () => ({
  recommendNotices: mockRecommendNotices,
}));

const {
  getStudentNotifications,
} = require('../controllers/aiController');
const errorHandler = require('../middleware/errorHandler');

function createStudentQuery(result) {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    single: jest.fn(() => Promise.resolve(result)),
  };
  return query;
}

function createChecklistQuery(result) {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  return query;
}

function createApp(studentId = 'student-1') {
  const app = express();
  app.get(
    '/api/students/notifications',
    (req, res, next) => {
      req.user = { student_id: studentId };
      req.language = 'en';
      next();
    },
    getStudentNotifications,
  );
  app.use(errorHandler);
  return app;
}

function productionNotice() {
  return {
    id: '10',
    title: 'Production notice',
    body: 'Production notice content',
    postedDate: '2026-07-24',
    deadline: null,
    category: null,
    priority: null,
    targetMajors: [],
    targetNationalities: [],
    minYear: null,
    maxYear: null,
    tags: [],
    languages: ['Korean'],
    source: 'international',
    sourceUrl: 'https://example.edu/notices/10',
  };
}

describe('GET /api/students/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('maps current student fields and returns personalized recommendations', async () => {
    const studentQuery = createStudentQuery({
      data: {
        student_id: 'student-1',
        major_id: 7,
        major: {
          major_name: 'Computer Science & Engineering',
          department: 'Engineering',
        },
        nationality: 'Mongolia',
        grade: 3,
        interest_tags: ['AI'],
        language_pref: 'ko',
      },
      error: null,
    });
    const checklistQuery = createChecklistQuery({ data: [], error: null });
    mockSupabase.from.mockImplementation((tableName) => {
      if (tableName === 'student') return studentQuery;
      if (tableName === 'checklist_item') return checklistQuery;
      throw new Error(`Unexpected table: ${tableName}`);
    });
    mockFetchAllNotices.mockResolvedValue([productionNotice()]);
    mockRecommendNotices.mockImplementation((profile, notices) => [
      {
        ...notices[0],
        score: 26,
        matchHint: 'Available in your language: Korean; Recently posted',
      },
    ]);

    const response = await request(createApp())
      .get('/api/students/notifications')
      .expect(200);

    expect(studentQuery.eq).toHaveBeenCalledWith('student_id', 'student-1');
    expect(mockFetchAllNotices).toHaveBeenCalledWith(
      mockSupabase,
      { language: 'en' },
    );
    expect(mockRecommendNotices).toHaveBeenCalledWith(
      expect.objectContaining({
        major: 'Computer Science & Engineering',
        majorId: 7,
        nationality: 'Mongolia',
        year: 3,
        interests: ['AI'],
        languages: ['ko'],
      }),
      expect.any(Array),
      { limit: 10 },
    );
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.data[0]).toMatchObject({
      id: '10',
      date: '2026-07-24',
      score: 26,
    });
  });

  test('returns 5xx when the live notice query fails', async () => {
    mockSupabase.from.mockImplementation((tableName) => {
      if (tableName === 'student') {
        return createStudentQuery({
          data: {
            student_id: 'student-1',
            major_id: 7,
            major: {
              major_name: 'Computer Science & Engineering',
              department: 'Engineering',
            },
            nationality: 'Mongolia',
            grade: 3,
            interest_tags: [],
            language_pref: 'ko',
          },
          error: null,
        });
      }
      if (tableName === 'checklist_item') {
        return createChecklistQuery({ data: [], error: null });
      }
      throw new Error(`Unexpected table: ${tableName}`);
    });
    mockFetchAllNotices.mockRejectedValue(
      Object.assign(
        new Error('Failed to fetch notices from Supabase: database unavailable'),
        {
          statusCode: 502,
          code: 'SUPABASE_NOTICE_QUERY_FAILED',
        },
      ),
    );

    const response = await request(createApp())
      .get('/api/students/notifications')
      .expect(502);

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toMatchObject({
      success: false,
      error: {
        status: 502,
        code: 'SUPABASE_NOTICE_QUERY_FAILED',
      },
    });
    expect(mockRecommendNotices).not.toHaveBeenCalled();
  });
});
