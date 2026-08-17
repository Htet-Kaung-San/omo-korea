/**
 * The app keeps two user stores: public.student holds the profile, auth.users
 * holds the credential. Login and password reset both look up auth.users by the
 * PROFILE email, so the moment the two disagree the account can neither sign in
 * nor reset — silently, because the lookup just finds nothing.
 *
 * That is not hypothetical: one real account was fully locked out this way
 * after its profile email was edited while the Supabase Auth user stayed on the
 * address signup had invented from the student ID.
 *
 * These pin that changing a profile email moves the credential with it, and
 * that a failure to move it leaves both stores untouched rather than half
 * applied.
 */
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const mockListUsers = jest.fn();
const mockUpdateUserById = jest.fn();
const mockCreateUser = jest.fn();
const mockSupabase = { from: jest.fn() };

jest.mock('../supabaseClient', () => mockSupabase);
jest.mock('../supabaseAuthClient', () => ({
  auth: {
    admin: {
      listUsers: (...a) => mockListUsers(...a),
      updateUserById: (...a) => mockUpdateUserById(...a),
      createUser: (...a) => mockCreateUser(...a),
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
const { JWT_SECRET } = require('../jwtConfig');

const OLD_EMAIL = '202455474@pusan.ac.kr';
const NEW_EMAIL = 'htet_kaung_san@pusan.ac.kr';
const AUTH_ID = 'auth-uuid-1';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/students', studentRoutes);
  return app;
}

const token = jwt.sign({ student_id: '202455474' }, JWT_SECRET);

/** The student row read back before the update, then the update itself. */
function mockStudentTable(existingEmail) {
  const captured = { update: null };
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    maybeSingle: jest.fn(() => Promise.resolve({ data: { email: existingEmail }, error: null })),
    single: jest.fn(() => Promise.resolve({ data: { student_id: 202455474, email: existingEmail }, error: null })),
    update: jest.fn((payload) => {
      captured.update = payload;
      return query;
    }),
  };
  mockSupabase.from.mockImplementation(() => query);
  return captured;
}

// PATCH /:student_id, not PUT /profile. Both reach updateStudentProfile, but
// PUT is guarded by updateProfileSchema which forbids `email` outright — so
// PATCH, which has no body validation, is the only route that can change an
// address, and therefore the one that could put the two stores out of step.
const updateProfile = (body) =>
  request(createApp())
    .patch('/api/students/202455474')
    .set('Authorization', `Bearer ${token}`)
    .send(body);

beforeEach(() => {
  jest.clearAllMocks();
  mockListUsers.mockResolvedValue({
    data: { users: [{ id: AUTH_ID, email: OLD_EMAIL }] },
    error: null,
  });
  mockUpdateUserById.mockResolvedValue({ data: {}, error: null });
});

describe('changing a profile email moves the login credential with it', () => {
  test('the Supabase Auth user is updated to the new address', async () => {
    mockStudentTable(OLD_EMAIL);

    await updateProfile({ email: NEW_EMAIL });

    expect(mockUpdateUserById).toHaveBeenCalledWith(
      AUTH_ID,
      expect.objectContaining({ email: NEW_EMAIL }),
    );
  });

  test('an unchanged email does not touch the auth user', async () => {
    mockStudentTable(OLD_EMAIL);

    await updateProfile({ email: OLD_EMAIL, name: 'Same Email' });

    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  test('a profile update with no email at all leaves auth alone', async () => {
    mockStudentTable(OLD_EMAIL);

    await updateProfile({ name: 'Only A Name' });

    expect(mockListUsers).not.toHaveBeenCalled();
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });
});

describe('when the credential cannot be moved, nothing changes', () => {
  test('an address already used by another account is refused with 409', async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [{ id: AUTH_ID, email: OLD_EMAIL }, { id: 'other', email: NEW_EMAIL }] },
      error: null,
    });
    const captured = mockStudentTable(OLD_EMAIL);

    const res = await updateProfile({ email: NEW_EMAIL });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
    // The profile must not be written, or the stores diverge again.
    expect(captured.update).toBeNull();
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  test('a failed auth update answers 502 and does not write the profile', async () => {
    mockUpdateUserById.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const captured = mockStudentTable(OLD_EMAIL);

    const res = await updateProfile({ email: NEW_EMAIL });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AUTH_UPDATE_FAILED');
    expect(captured.update).toBeNull();
  });

  test('an unreachable auth service answers 502 and does not write the profile', async () => {
    mockListUsers.mockResolvedValue({ data: null, error: { message: 'network' } });
    const captured = mockStudentTable(OLD_EMAIL);

    const res = await updateProfile({ email: NEW_EMAIL });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AUTH_LOOKUP_FAILED');
    expect(captured.update).toBeNull();
  });
});

describe('no address is ever invented from a student ID', () => {
  test('signup without an email is refused rather than deriving one', async () => {
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    };
    mockSupabase.from.mockImplementation(() => query);

    const res = await request(createApp())
      .post('/api/students/signup')
      .send({ student_id: '202499999', name: 'No Email', password: 'password' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMAIL_REQUIRED');
    // Nothing may be created at <student_id>@pusan.ac.kr.
    expect(mockCreateUser).not.toHaveBeenCalled();
  });
});
