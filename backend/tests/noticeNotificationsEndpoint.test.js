const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockSupabase = {
  from: jest.fn(),
};
const mockFetchAllCourses = jest.fn();
const mockFetchAllNotices = jest.fn();
const mockRecommendNotices = jest.fn();

jest.mock('../supabaseClient', () => mockSupabase);
jest.mock('../ai/supabaseDataRepository', () => ({
  fetchAllCourses: mockFetchAllCourses,
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
const { authenticateToken } = require('../middlewares/auth');
const { JWT_SECRET } = require('../jwtConfig');

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

function createApp() {
  const app = express();
  app.get(
    '/api/students/notifications',
    authenticateToken,
    (req, res, next) => {
      req.language = 'en';
      next();
    },
    getStudentNotifications,
  );
  app.use(errorHandler);
  return app;
}

function tokenFor(studentId = 'student-1', options = {}) {
  return jwt.sign({ student_id: studentId }, JWT_SECRET, options);
}

function authenticatedGet(app, token = tokenFor()) {
  return request(app)
    .get('/api/students/notifications')
    .set('Authorization', `Bearer ${token}`);
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

    const response = await authenticatedGet(createApp())
      .query({ student_id: 'student-other' })
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
      kind: 'NOTICE',
      date: '2026-07-24',
      languages: ['Korean'],
      score: 26,
      matchHint: 'Available in your language: Korean; Recently posted',
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

    const response = await authenticatedGet(createApp())
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

  test('rejects a missing token through the real authentication middleware', async () => {
    const response = await request(createApp())
      .get('/api/students/notifications')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  test('rejects an invalid token as unauthenticated', async () => {
    const response = await authenticatedGet(createApp(), 'invalid-token')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  test('rejects an expired token as unauthenticated', async () => {
    const expiredToken = tokenFor('student-1', { expiresIn: -1 });
    const response = await authenticatedGet(createApp(), expiredToken)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  test('returns checklist items after ranked notices with an explicit kind', async () => {
    const studentQuery = createStudentQuery({
      data: {
        student_id: 'student-1',
        major_id: 7,
        major: { major_name: 'Computer Science & Engineering' },
        grade: 3,
        interest_tags: [],
        language_pref: 'ko',
      },
      error: null,
    });
    const checklistQuery = createChecklistQuery({
      data: [{
        checklist_id: 4,
        title: 'Submit document',
        description: 'Upload the required document',
        due_date: '2026-08-01',
        updated_at: '2026-07-20',
        status: 'Not Started',
      }],
      error: null,
    });
    mockSupabase.from.mockImplementation((tableName) => {
      if (tableName === 'student') return studentQuery;
      if (tableName === 'checklist_item') return checklistQuery;
      throw new Error(`Unexpected table: ${tableName}`);
    });
    mockFetchAllNotices.mockResolvedValue([productionNotice()]);
    mockRecommendNotices.mockReturnValue([{
      ...productionNotice(),
      score: 20,
      matchHint: 'Recently posted',
    }]);

    const response = await authenticatedGet(createApp()).expect(200);

    expect(response.body.data.map((item) => item.kind)).toEqual([
      'NOTICE',
      'CHECKLIST',
    ]);
    expect(response.body.data[1]).toMatchObject({
      id: 'checklist-4',
      kind: 'CHECKLIST',
      dueDate: '2026-08-01',
      status: 'Not Started',
    });
    expect(response.body.data[1]).not.toHaveProperty('score');
  });

  test('propagates checklist database failures', async () => {
    mockSupabase.from.mockImplementation((tableName) => {
      if (tableName === 'student') {
        return createStudentQuery({
          data: {
            student_id: 'student-1',
            major_id: 7,
            major: { major_name: 'Computer Science & Engineering' },
          },
          error: null,
        });
      }
      if (tableName === 'checklist_item') {
        return createChecklistQuery({
          data: null,
          error: { message: 'checklist unavailable' },
        });
      }
      throw new Error(`Unexpected table: ${tableName}`);
    });

    const response = await authenticatedGet(createApp()).expect(502);

    expect(response.body.error.code).toBe(
      'SUPABASE_CHECKLIST_QUERY_FAILED',
    );
    expect(mockFetchAllNotices).not.toHaveBeenCalled();
  });
});
