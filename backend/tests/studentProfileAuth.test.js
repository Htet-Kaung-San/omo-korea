const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockSupabase = { from: jest.fn() };

jest.mock('../supabaseClient', () => mockSupabase);
jest.mock('../ai/supabaseDataRepository', () => ({
  fetchAllCourses: jest.fn(),
  fetchAllNotices: jest.fn(),
  fetchDashboardCatalogs: jest.fn(),
}));
jest.mock('../services/pnuNoticeScraperService', () => ({
  scrapeRecentNotices: jest.fn(),
}));
jest.mock('../services/noticeSyncService', () => ({
  synchronizeNotices: jest.fn(),
}));

const studentRoutes = require('../routes/studentRoutes');
const { JWT_SECRET } = require('../jwtConfig');

// Production student_ids are integers. Signing string ids here would let an
// id-coercion bug pass unnoticed, so these fixtures mirror real rows.
const OWNER_ID = 202455474;
const OTHER_ID = 202455393;

function tokenFor(studentId) {
  return jwt.sign({ student_id: studentId }, JWT_SECRET, { expiresIn: '5m' });
}

function createApp() {
  const app = express();
  app.use('/api/students', studentRoutes);
  return app;
}

function studentRow(id) {
  return {
    student_id: id,
    name: 'Test Student',
    email: 'test@pusan.ac.kr',
    password: '$2b$10$abcdefghijklmnopqrstuv', // bcrypt hash — must never be served
    phone: '010-0000-0000',
    visa_status: 'D-2',
    is_admin: false,
    major_id: 7,
    major: { major_name: 'Artificial Intelligence', department: 'Engineering' },
  };
}

function mockStudentSelect(row) {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    single: jest.fn(() => Promise.resolve({ data: row, error: null })),
  };
  mockSupabase.from.mockImplementation(() => query);
  return query;
}

function mockEnrollmentSelect(rows) {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => Promise.resolve({ data: rows, error: null })),
  };
  mockSupabase.from.mockImplementation(() => query);
  return query;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/students/:student_id', () => {
  test('rejects an unauthenticated request', async () => {
    const res = await request(createApp()).get(`/api/students/${OWNER_ID}`);

    expect(res.status).toBe(401);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  test('rejects reading another student profile', async () => {
    const res = await request(createApp())
      .get(`/api/students/${OTHER_ID}`)
      .set('Authorization', `Bearer ${tokenFor(OWNER_ID)}`);

    expect(res.status).toBe(403);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  test('allows a self-read and never returns the password column', async () => {
    mockStudentSelect(studentRow(OWNER_ID));

    const res = await request(createApp())
      .get(`/api/students/${OWNER_ID}`)
      .set('Authorization', `Bearer ${tokenFor(OWNER_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.student_id).toBe(OWNER_ID);
    expect(res.body.data.major_name).toBe('Artificial Intelligence');
    expect(res.body.data).not.toHaveProperty('password');
    expect(JSON.stringify(res.body)).not.toContain('$2b$');
  });

  test('treats a numeric token id and a string route param as the same owner', async () => {
    mockStudentSelect(studentRow(OWNER_ID));

    // req.params is always a string; the token carries a number. Without
    // String() coercion on both sides this 403s the legitimate owner.
    const res = await request(createApp())
      .get(`/api/students/${String(OWNER_ID)}`)
      .set('Authorization', `Bearer ${tokenFor(OWNER_ID)}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /api/students/enrollments/:student_id', () => {
  test('rejects an unauthenticated request', async () => {
    const res = await request(createApp()).get(
      `/api/students/enrollments/${OWNER_ID}`,
    );

    expect(res.status).toBe(401);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  test('rejects reading another student enrollments', async () => {
    const res = await request(createApp())
      .get(`/api/students/enrollments/${OTHER_ID}`)
      .set('Authorization', `Bearer ${tokenFor(OWNER_ID)}`);

    expect(res.status).toBe(403);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  test('allows a self-read', async () => {
    mockEnrollmentSelect([
      {
        enrollment_id: 1,
        student_id: OWNER_ID,
        course_id: 101,
        course: { course_name: 'Data Structures', credit: 3 },
      },
    ]);

    const res = await request(createApp())
      .get(`/api/students/enrollments/${OWNER_ID}`)
      .set('Authorization', `Bearer ${tokenFor(OWNER_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].course_name).toBe('Data Structures');
  });
});
