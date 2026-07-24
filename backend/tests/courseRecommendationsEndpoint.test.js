const express = require('express');
const request = require('supertest');

const mockSupabase = {
  from: jest.fn(),
};

jest.mock('../supabaseClient', () => mockSupabase);

jest.mock('../ai/supabaseDataRepository', () => ({
  fetchAllCourses: jest.fn(),
  fetchDashboardCatalogs: jest.fn(),
}));

const {
  fetchAllCourses,
} = require('../ai/supabaseDataRepository');
const {
  getCourseRecommendations,
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

function createEnrollmentQuery(result) {
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
    '/api/students/course-recommendations',
    (req, res, next) => {
      req.user = { student_id: 'student-1' };
      req.language = 'en';
      next();
    },
    getCourseRecommendations,
  );
  app.use(errorHandler);
  return app;
}

function buildStudent(overrides = {}) {
  return {
    student_id: 'student-1',
    major_id: 1,
    major: {
      major_name: 'Computer Science & Engineering',
      department: 'Engineering',
    },
    interests: ['AI'],
    completed_courses: [],
    ...overrides,
  };
}

function buildCourse(id) {
  return {
    id: String(id),
    title: `Course ${id}`,
    name: `Course ${id}`,
    nameEn: `Course ${id}`,
    majorId: '1',
    type: 'REQUIRED',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['AI'],
    raw: {
      course_id: id,
      major_id: 1,
      category: 'REQUIRED',
    },
  };
}

describe('GET /api/students/course-recommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a 5xx response instead of an empty success when course loading fails', async () => {
    mockSupabase.from.mockImplementation((tableName) => {
      if (tableName === 'student') {
        return createStudentQuery({
          data: buildStudent(),
          error: null,
        });
      }

      if (tableName === 'enrollment') {
        return createEnrollmentQuery({ data: [], error: null });
      }

      throw new Error(`Unexpected table: ${tableName}`);
    });
    fetchAllCourses.mockRejectedValue(
      Object.assign(new Error('Failed to fetch courses from Supabase'), {
        statusCode: 502,
        code: 'SUPABASE_COURSE_QUERY_FAILED',
      }),
    );

    const response = await request(createApp())
      .get('/api/students/course-recommendations')
      .expect(502);

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toMatchObject({
      success: false,
      error: {
        status: 502,
        code: 'SUPABASE_COURSE_QUERY_FAILED',
      },
    });
  });

  it('excludes legacy completed courses and current Enrolled rows', async () => {
    const enrollmentQuery = createEnrollmentQuery({
      data: [{ course_id: 2, status: 'Enrolled' }],
      error: null,
    });
    mockSupabase.from.mockImplementation((tableName) => {
      if (tableName === 'student') {
        return createStudentQuery({
          data: buildStudent({ completed_courses: [1] }),
          error: null,
        });
      }

      if (tableName === 'enrollment') {
        return enrollmentQuery;
      }

      throw new Error(`Unexpected table: ${tableName}`);
    });
    fetchAllCourses.mockResolvedValue([
      buildCourse(1),
      buildCourse(2),
      buildCourse(3),
    ]);

    const response = await request(createApp())
      .get('/api/students/course-recommendations')
      .expect(200);

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.data.map((course) => course.id)).toEqual(['3']);
    expect(enrollmentQuery.eq).toHaveBeenNthCalledWith(
      1,
      'student_id',
      'student-1',
    );
    expect(enrollmentQuery.eq).toHaveBeenNthCalledWith(
      2,
      'status',
      'Enrolled',
    );
  });

  it('propagates student database failures instead of reporting a missing profile', async () => {
    mockSupabase.from.mockImplementation((tableName) => {
      if (tableName === 'student') {
        return createStudentQuery({
          data: null,
          error: { message: 'student database unavailable', code: '08006' },
        });
      }

      throw new Error(`Unexpected table: ${tableName}`);
    });

    const response = await request(createApp())
      .get('/api/students/course-recommendations')
      .expect(502);

    expect(fetchAllCourses).not.toHaveBeenCalled();
    expect(response.body).toMatchObject({
      success: false,
      error: {
        status: 502,
        code: 'SUPABASE_STUDENT_QUERY_FAILED',
      },
    });
  });

  it('returns 404 only when Supabase confirms the student row is missing', async () => {
    mockSupabase.from.mockImplementation((tableName) => {
      if (tableName === 'student') {
        return createStudentQuery({
          data: null,
          error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' },
        });
      }

      throw new Error(`Unexpected table: ${tableName}`);
    });

    const response = await request(createApp())
      .get('/api/students/course-recommendations')
      .expect(404);

    expect(fetchAllCourses).not.toHaveBeenCalled();
    expect(response.body).toMatchObject({
      success: false,
      message: 'Student profile not found',
      error: {
        status: 404,
      },
    });
  });
});
