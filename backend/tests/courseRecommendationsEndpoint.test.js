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

const originalOfferingEnvironment = {
  enabled: process.env.ENABLE_COURSE_OFFERINGS,
  year: process.env.COURSE_OFFERING_ACADEMIC_YEAR,
  semester: process.env.COURSE_OFFERING_SEMESTER,
};

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
    officialCourseNumber: null,
    academicYear: null,
    semester: null,
    section: null,
    professor: null,
    schedule: null,
    remoteCourseStatus: null,
    originalLanguageCode: null,
    teachingLanguage: null,
    isEnglishTaught: null,
    theoryHours: null,
    practicalHours: null,
    raw: {},
    ...overrides,
  };
}

describe('GET /api/students/course-recommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENABLE_COURSE_OFFERINGS = 'false';
    delete process.env.COURSE_OFFERING_ACADEMIC_YEAR;
    delete process.env.COURSE_OFFERING_SEMESTER;
  });

  afterAll(() => {
    for (const [name, value] of [
      ['ENABLE_COURSE_OFFERINGS', originalOfferingEnvironment.enabled],
      ['COURSE_OFFERING_ACADEMIC_YEAR', originalOfferingEnvironment.year],
      ['COURSE_OFFERING_SEMESTER', originalOfferingEnvironment.semester],
    ]) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
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
    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        officialCourseNumber: null,
        teachingLanguage: null,
        isEnglishTaught: null,
      }),
    );
    expect(response.body.metadata).toEqual({
      source: 'supabase',
      courses: 'loaded',
    });
  });

  test('authenticated recommendations request the reviewed 2026-2 offerings when enabled', async () => {
    process.env.ENABLE_COURSE_OFFERINGS = 'true';
    process.env.COURSE_OFFERING_ACADEMIC_YEAR = '2026';
    process.env.COURSE_OFFERING_SEMESTER = '2';
    const studentQuery = createStudentQuery({
      student_id: 'student-1',
      major_id: 10,
      major: { major_name: 'Computer Science' },
      completed_course_ids: [],
    });
    mockSupabase.from.mockImplementation((tableName) => {
      if (tableName === 'student') return studentQuery;
      throw new Error(`Unexpected table: ${tableName}`);
    });
    mockFetchAllCourses.mockResolvedValue([
      course({
        id: 'CS102',
        officialCourseNumber: 'CS2000001',
        academicYear: 2026,
        semester: '2',
        section: '001',
        originalLanguageCode: 'E',
        teachingLanguage: 'ENGLISH',
        isEnglishTaught: true,
      }),
    ]);

    const response = await request(createApp())
      .get('/api/students/course-recommendations')
      .set('Authorization', `Bearer ${tokenFor('student-1')}`)
      .expect(200);

    expect(mockFetchAllCourses).toHaveBeenCalledWith(mockSupabase, {
      language: 'en',
      includeOfferings: true,
      offeringAcademicYear: '2026',
      offeringSemester: '2',
      offeringSection: null,
    });
    expect(response.body.data[0]).toMatchObject({
      officialCourseNumber: 'CS2000001',
      academicYear: 2026,
      semester: '2',
      section: '001',
      isEnglishTaught: true,
    });
  });
});
