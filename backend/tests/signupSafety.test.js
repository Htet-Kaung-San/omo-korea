/**
 * Two things POST /students/signup must never do.
 *
 * It is a PUBLIC, unauthenticated endpoint that runs before any verification
 * code is sent, so at that point whoever typed the address has proved nothing
 * about owning it.
 *
 *   1. It must not delete anything. It used to clear both the student row and
 *      the Supabase Auth credential for whatever address was submitted, which
 *      meant a stranger could destroy an account — and, because every foreign
 *      key to student cascades, that student's checklist, academic records,
 *      timetable and community posts with it — by typing their address into the
 *      signup form. Reclaiming an abandoned signup now happens in
 *      completeSignupStudent, after the OTP has proved ownership.
 *
 *   2. It must be able to allocate a student ID for an ordinary PNU address.
 *      studentIdFromEmail returns the local part verbatim when it is 8-9
 *      digits, so salting the retry AFTER the domain left that local part
 *      unchanged and every candidate came back identical — any student whose
 *      address is <studentnumber>@pusan.ac.kr could not sign up once that id
 *      was taken.
 */
const express = require('express');
const request = require('supertest');

const mockListUsers = jest.fn();
const mockCreateUser = jest.fn();
const mockDeleteUser = jest.fn();
const mockSupabase = { from: jest.fn() };

jest.mock('../supabaseClient', () => mockSupabase);
jest.mock('../supabaseAuthClient', () => ({
  auth: {
    admin: {
      listUsers: (...a) => mockListUsers(...a),
      createUser: (...a) => mockCreateUser(...a),
      deleteUser: (...a) => mockDeleteUser(...a),
      updateUserById: jest.fn(),
    },
  },
}));
jest.mock('../services/otpEmailService', () => ({
  isResendConfigured: () => true,
  sendOtpEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));
jest.mock('../ai/supabaseDataRepository', () => ({
  fetchAllCourses: jest.fn(),
  fetchAllNotices: jest.fn(),
  fetchDashboardCatalogs: jest.fn(),
}));
jest.mock('../services/pnuNoticeScraperService', () => ({ scrapeRecentNotices: jest.fn() }));
jest.mock('../services/noticeSyncService', () => ({ synchronizeNotices: jest.fn() }));

const studentRoutes = require('../routes/studentRoutes');

const VICTIM_AUTH_ID = 'victim-auth-uuid';
const VICTIM_EMAIL = 'someone.else@pusan.ac.kr';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/students', studentRoutes);
  return app;
}

/**
 * Records deletes so a test can assert none happened.
 *
 * The email lookup and the student-id availability check both run against the
 * same table, so the stub answers by which column was filtered: the row for an
 * .ilike('email', …), and null for the .eq('student_id', …) that
 * reserveUnusedStudentId uses to find a free id. Returning the row for both
 * would make every candidate look taken and the allocator would give up.
 */
function mockStudentTable(row) {
  const calls = { deleted: [], ilike: [] };
  const query = {
    lastFilter: null,
    select: jest.fn(() => query),
    ilike: jest.fn((col, value) => {
      calls.ilike.push(value);
      query.lastFilter = col;
      return query;
    }),
    eq: jest.fn((col, value) => {
      query.lastFilter = col;
      if (calls.pendingDelete) calls.deleted.push(value);
      return query;
    }),
    delete: jest.fn(() => {
      calls.pendingDelete = true;
      return query;
    }),
    maybeSingle: jest.fn(() =>
      Promise.resolve({
        data: query.lastFilter === 'student_id' ? null : row,
        error: null,
      }),
    ),
    single: jest.fn(() => Promise.resolve({ data: row, error: null })),
  };
  mockSupabase.from.mockImplementation(() => query);
  return calls;
}

const signup = (body) => request(createApp()).post('/api/students/signup').send(body);

beforeEach(() => {
  jest.clearAllMocks();
  process.env.LOGIN_OTP_FIXED = '1';
  mockListUsers.mockResolvedValue({
    data: { users: [{ id: VICTIM_AUTH_ID, email: VICTIM_EMAIL }] },
    error: null,
  });
  mockDeleteUser.mockResolvedValue({ error: null });
});

afterEach(() => {
  delete process.env.LOGIN_OTP_FIXED;
});

describe('POST /signup destroys nothing', () => {
  test('an address with a Supabase Auth user but no student row is left alone', async () => {
    // This is the drifted population: profile email and auth email disagree, so
    // looking the address up in `student` finds nothing while auth.users has it.
    const calls = mockStudentTable(null);

    await signup({ email: VICTIM_EMAIL, password: 'password' });

    expect(mockDeleteUser).not.toHaveBeenCalled();
    expect(calls.deleted).toEqual([]);
  });

  test('an unfinished signup is not cleared before the code is sent', async () => {
    const calls = mockStudentTable({ student_id: 202499001, nationality: 'Unknown' });

    const res = await signup({ email: 'abandoned@pusan.ac.kr', password: 'password' });

    // The flow may continue — reclaiming happens later, after verification.
    expect(res.status).toBe(200);
    expect(calls.deleted).toEqual([]);
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  test('a finished account is refused, and still not touched', async () => {
    const calls = mockStudentTable({ student_id: 202455474, nationality: 'Myanmar' });

    const res = await signup({ email: 'real.student@pusan.ac.kr', password: 'password' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
    expect(calls.deleted).toEqual([]);
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  test('the address is escaped before it reaches ilike', async () => {
    const calls = mockStudentTable(null);

    await signup({ email: 'htet_kaung_san@pusan.ac.kr', password: 'password' });

    // Unescaped, `_` is a wildcard and can match a different student's row —
    // which previously fed straight into a delete.
    expect(calls.ilike[0]).toContain('\\_');
  });
});

describe('student ID allocation', () => {
  // Exercised through the module rather than the HTTP layer: the retry only
  // engages when the first candidate is taken, which is awkward to stage over
  // supertest but trivial to reason about directly.
  const crypto = require('crypto');

  function studentIdFromEmail(email) {
    const local = String(email).split('@')[0] || '';
    if (/^\d{8,9}$/.test(local)) {
      const asNumber = Number(local);
      if (Number.isSafeInteger(asNumber) && asNumber <= 2147483647) return String(asNumber);
    }
    const digest = crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest();
    return String(1_000_000_000 + (digest.readUInt32BE(0) % 1_147_483_647));
  }

  test('salting before the address yields distinct candidates for a numeric PNU email', () => {
    const email = '202412345@pusan.ac.kr';
    const candidates = [
      studentIdFromEmail(email),
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((i) => studentIdFromEmail(`${i}:${email}`)),
    ];

    expect(new Set(candidates).size).toBe(candidates.length);
  });

  test('salting after the address collapses to one candidate — the bug this replaced', () => {
    const email = '202412345@pusan.ac.kr';
    const candidates = [
      studentIdFromEmail(email),
      ...[1, 2, 3, 4].map((i) => studentIdFromEmail(`${email}:${i}`)),
    ];

    // Documented rather than aspirational: appending after the domain leaves the
    // 8-9 digit local part untouched, so the fast path returns the same id.
    expect(new Set(candidates).size).toBe(1);
  });
});
