const express = require('express');
const request = require('supertest');

const mockSupabase = { from: jest.fn() };
const mockVerify = jest.fn();

jest.mock('../supabaseClient', () => mockSupabase);
jest.mock('../services/studentAuthService', () => ({
  verifyStudentPassword: mockVerify,
  setStudentPassword: jest.fn(),
  SUPABASE_AUTH_MARKER: '[SUPABASE_AUTH]',
}));
jest.mock('../ai/supabaseDataRepository', () => ({
  fetchAllCourses: jest.fn(),
  fetchAllNotices: jest.fn(),
  fetchDashboardCatalogs: jest.fn(),
}));
jest.mock('../services/pnuNoticeScraperService', () => ({ scrapeRecentNotices: jest.fn() }));
jest.mock('../services/noticeSyncService', () => ({ synchronizeNotices: jest.fn() }));

const studentRoutes = require('../routes/studentRoutes');
// Imported rather than hardcoded so the fixture code tracks the service.
const { DEMO_OTP } = require('../services/loginChallengeService');

const STUDENT = {
  student_id: 202612345,
  name: 'Minh Nguyen',
  email: '202612345@pusan.ac.kr',
  password: '$2b$10$notarealhash',
  major_id: 8,
  major: { major_name: 'Computer Science and Engineering', department: 'Engineering' },
};

/** Records which column the lookup filtered on, so the test can assert the branch. */
function mockLookup(row) {
  const calls = { ilike: null, eq: null };
  const query = {
    select: jest.fn(() => query),
    ilike: jest.fn((col, value) => {
      calls.ilike = { col, value };
      return query;
    }),
    eq: jest.fn((col, value) => {
      calls.eq = { col, value };
      return query;
    }),
    maybeSingle: jest.fn(() => Promise.resolve({ data: row, error: null })),
  };
  mockSupabase.from.mockImplementation(() => query);
  return calls;
}

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/students', studentRoutes);
  return app;
}

const login = (body) => request(createApp()).post('/api/students/login').send(body);

beforeEach(() => {
  jest.clearAllMocks();
  mockVerify.mockResolvedValue({ ok: true });
});

describe('POST /api/students/login', () => {
  test('signs in with a school email, matched case-insensitively', async () => {
    const calls = mockLookup(STUDENT);

    const res = await login({ email: '202612345@PUSAN.AC.KR', password: 'password' });

    expect(res.status).toBe(200);
    // PR #27 normalises the address to lower case before the (still
    // case-insensitive) lookup, so an all-caps address reaches the same row.
    expect(calls.ilike).toEqual({ col: 'email', value: '202612345@pusan.ac.kr' });
    expect(calls.eq).toBeNull();
    // Login now only issues an OTP challenge; the token is minted by
    // /verify-login. Asserting the challenge keeps this test about routing.
    expect(res.body.requiresVerification).toBe(true);
    expect(res.body.challengeId).toBeTruthy();
  });

  test('still signs in with a student ID', async () => {
    const calls = mockLookup(STUDENT);

    const res = await login({ student_id: '202612345', password: 'password' });

    expect(res.status).toBe(200);
    expect(calls.eq).toEqual({ col: 'student_id', value: '202612345' });
    expect(calls.ilike).toBeNull();
  });

  test('routes a single identifier field by whether it contains @', async () => {
    const asEmail = mockLookup(STUDENT);
    await login({ identifier: '202612345@pusan.ac.kr', password: 'password' });
    expect(asEmail.ilike?.col).toBe('email');

    const asId = mockLookup(STUDENT);
    await login({ identifier: '202612345', password: 'password' });
    expect(asId.eq?.col).toBe('student_id');
  });

  test('never returns the password column', async () => {
    mockLookup(STUDENT);

    const challenge = await login({ email: STUDENT.email, password: 'password' });

    expect(challenge.status).toBe(200);
    expect(JSON.stringify(challenge.body)).not.toContain('$2b$');

    // The student payload moved to /verify-login with the OTP flow, so the hash
    // has to be absent there too — that is the response the client stores.
    mockLookup(STUDENT);
    const verified = await request(createApp())
      .post('/api/students/verify-login')
      .send({ challengeId: challenge.body.challengeId, code: DEMO_OTP });

    expect(verified.status).toBe(200);
    expect(verified.body.data ?? {}).not.toHaveProperty('password');
    expect(JSON.stringify(verified.body)).not.toContain('$2b$');
  });

  test('reports an unknown email distinctly from an unknown student ID', async () => {
    mockLookup(null);
    const byEmail = await login({ email: 'nobody@pusan.ac.kr', password: 'password' });
    expect(byEmail.status).toBe(404);
    expect(byEmail.body.message).toMatch(/email/i);

    mockLookup(null);
    const byId = await login({ student_id: '999999999', password: 'password' });
    expect(byId.status).toBe(404);
    expect(byId.body.message).toMatch(/student id/i);
  });

  test('rejects a wrong password without leaking whether the account exists', async () => {
    mockLookup(STUDENT);
    mockVerify.mockResolvedValue({ ok: false });

    const res = await login({ email: STUDENT.email, password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test('requires an identifier and a password', async () => {
    const missingId = await login({ password: 'password' });
    expect(missingId.status).toBe(400);

    mockLookup(STUDENT);
    const missingPw = await login({ email: STUDENT.email });
    expect(missingPw.status).toBe(400);
    // The password check must happen before any database lookup.
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});
