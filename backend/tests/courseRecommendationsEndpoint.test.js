const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockSupabase = { from: jest.fn() };
const mockFetchAllCourses = jest.fn();
const mockFetchAllNotices = jest.fn();
const mockFetchDashboardCatalogs = jest.fn();

jest.mock('../supabaseClient', () => mockSupabase);
jest.mock('../ai/supabaseDataRepository', () => ({
  fetchAllCourses: mockFetchAllCourses,
  fetchAllNotices: mockFetchAllNotices,
  fetchDashboardCatalogs: mockFetchDashboardCatalogs,
}));

const studentRoutes = require('../routes/studentRoutes');
const errorHandler = require('../middleware/errorHandler');
const { JWT_SECRET } = require('../jwtConfig');

function createApp() {
  const app = express();
  app.use('/api/students', studentRoutes);
  app.use(errorHandler);
  return app;
}

function tokenFor(studentId) {
  return jwt.sign({ student_id: studentId }, JWT_SECRET, {
    expiresIn: '5m',
  });
}

function createStudentQuery(row) {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    single: jest.fn(() => Promise.resolve({ data: row, error: null })),
  };
  return query;
}

function course(overrides = {}) {
  return {
    id: 'CS101',
    title: 'Introduction to Programming',
    name: 'Introduction to Programming',
    nameEn: 'Introduction to Programming',
    nameKo: 'Introduction to Programming',
    majorId: '10',
    type: 'ELECTIVE',
    category: 'ELECTIVE',
    credits: 3,
    department: 'Computer Science',
    year: null,
    description: '',
    tags: [],
    raw: {},
    ...overrides,
  };
}

describe('GET /api/students/course-recommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads only courses and remains independent of notice availability', async () => {
    const studentQuery = createStudentQuery({
      student_id: 'student-1',
      major_id: 10,
      major: { major_name: 'Computer Science' },
      completed_course_ids: ['CS101'],
    });
    mockSupabase.from.mockImplementation((tableName) => {
      if (tableName === 'student') return studentQuery;
      throw new Error(`Unexpected table: ${tableName}`);
    });
    mockFetchAllCourses.mockResolvedValue([
      course(),
      course({
        id: 'CS102',
        title: 'Data Structures',
        name: 'Data Structures',
        nameEn: 'Data Structures',
        nameKo: 'Data Structures',
      }),
    ]);
    mockFetchAllNotices.mockRejectedValue(
      new Error('notice table unavailable'),
    );
    mockFetchDashboardCatalogs.mockRejectedValue(
      new Error('dashboard catalogs unavailable'),
    );

    const response = await request(createApp())
      .get('/api/students/course-recommendations')
      .set('Authorization', `Bearer ${tokenFor('student-1')}`)
      .expect(200);

    expect(studentQuery.eq).toHaveBeenCalledWith('student_id', 'student-1');
    expect(mockFetchAllCourses).toHaveBeenCalledWith(mockSupabase, {
      language: 'en',
    });
    expect(mockFetchAllNotices).not.toHaveBeenCalled();
    expect(mockFetchDashboardCatalogs).not.toHaveBeenCalled();
    expect(response.body.data.map((item) => item.id)).toEqual(['CS102']);
    expect(response.body.metadata).toEqual({
      source: 'supabase',
      courses: 'loaded',
    });
  });
});
