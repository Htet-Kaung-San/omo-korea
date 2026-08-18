/**
 * Password reset used to go out through Supabase's built-in mailer while the
 * login OTP went through Resend, so the app had two email providers with
 * different rate limits and different failure modes.
 *
 * It now uses auth.admin.generateLink, which mints the recovery token WITHOUT
 * sending anything, and Resend delivers it. Supabase still owns the token and
 * the reset session — only delivery moved — and these pin that split, plus the
 * failure handling, because a reset that silently never arrives looks identical
 * to one the student ignored.
 */
const express = require('express');
const request = require('supertest');

const mockGenerateLink = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockSupabase = { from: jest.fn() };

jest.mock('../supabaseClient', () => mockSupabase);
jest.mock('../supabaseAuthClient', () => ({
  auth: {
    admin: { generateLink: (...a) => mockGenerateLink(...a) },
    // Present so a regression back to it would be caught rather than crash.
    resetPasswordForEmail: (...a) => mockResetPasswordForEmail(...a),
  },
}));
jest.mock('../services/otpEmailService', () => ({
  isResendConfigured: () => true,
  sendOtpEmail: jest.fn(),
  sendPasswordResetEmail: (...a) => mockSendPasswordResetEmail(...a),
}));
jest.mock('../ai/supabaseDataRepository', () => ({
  fetchAllCourses: jest.fn(),
  fetchAllNotices: jest.fn(),
  fetchDashboardCatalogs: jest.fn(),
}));
jest.mock('../services/pnuNoticeScraperService', () => ({ scrapeRecentNotices: jest.fn() }));
jest.mock('../services/noticeSyncService', () => ({ synchronizeNotices: jest.fn() }));

const studentRoutes = require('../routes/studentRoutes');

const ACTION_LINK =
  'https://proj.supabase.co/auth/v1/verify?type=recovery&token=abc123&redirect_to=http://localhost:5173/update-password';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/students', studentRoutes);
  return app;
}

const forgot = (body) =>
  request(createApp()).post('/api/students/forgot-password').send(body);

/** Records which column the lookup filtered on, so a test can assert the branch. */
function mockStudent(row) {
  const calls = { ilike: null, eq: null };
  const result = Promise.resolve({
    data: row,
    error: row ? null : { message: 'not found' },
  });
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
    maybeSingle: jest.fn(() => result),
    single: jest.fn(() => result),
  };
  mockSupabase.from.mockImplementation(() => query);
  return calls;
}

const STUDENT = { student_id: 202455474, email: '202455474@pusan.ac.kr' };

beforeEach(() => {
  jest.clearAllMocks();
  mockStudent(STUDENT);
  mockGenerateLink.mockResolvedValue({
    data: { properties: { action_link: ACTION_LINK } },
    error: null,
  });
  mockSendPasswordResetEmail.mockResolvedValue({ id: 'msg_reset' });
});

describe('POST /api/students/forgot-password', () => {
  test('generates a recovery link and delivers it through Resend', async () => {
    const res = await forgot({ student_id: '202455474' });

    expect(res.status).toBe(200);
    expect(mockGenerateLink).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'recovery', email: '202455474@pusan.ac.kr' }),
    );
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith({
      to: '202455474@pusan.ac.kr',
      actionLink: ACTION_LINK,
    });
  });

  test('Supabase no longer sends the email itself', async () => {
    await forgot({ student_id: '202455474' });
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  test('the redirect still points at the update-password screen', async () => {
    await forgot({ student_id: '202455474' });
    const [{ options }] = mockGenerateLink.mock.calls[0];
    expect(options.redirectTo).toMatch(/\/update-password$/);
  });

  test('the reply masks the address rather than echoing it back', async () => {
    const res = await forgot({ student_id: '202455474' });
    expect(res.body.maskedEmail).toContain('@pusan.ac.kr');
    expect(res.body.maskedEmail).not.toBe('202455474@pusan.ac.kr');
    expect(res.body.maskedEmail).toContain('*');
  });

  // Reporting success for mail that never went is the failure that leaves a
  // student waiting on an email that is not coming.
  test('a delivery failure answers 502 instead of claiming success', async () => {
    mockSendPasswordResetEmail.mockRejectedValue(
      Object.assign(new Error('Resend rejected the message: 403'), { code: 'OTP_DELIVERY_FAILED' }),
    );

    const res = await forgot({ student_id: '202455474' });

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('RESET_EMAIL_DELIVERY_FAILED');
  });

  test('a link-generation failure answers 500 and sends nothing', async () => {
    mockGenerateLink.mockResolvedValue({ data: null, error: { message: 'user not found' } });

    const res = await forgot({ student_id: '202455474' });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('RESET_LINK_FAILED');
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
  });

  test('an unknown student is rejected before any link is minted', async () => {
    mockStudent(null);

    const res = await forgot({ student_id: '999999999' });

    expect(res.status).toBe(404);
    expect(mockGenerateLink).not.toHaveBeenCalled();
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
  });

  test('a missing identifier is a 400', async () => {
    const res = await forgot({});
    expect(res.status).toBe(400);
    expect(mockGenerateLink).not.toHaveBeenCalled();
  });
});

// Students sign in with their school email, so the reset screen asks for the
// same thing. Student ID still works for anyone with the old habit.
describe('identifying the account', () => {
  test('accepts a school email and looks it up case-insensitively', async () => {
    const calls = mockStudent(STUDENT);

    const res = await forgot({ email: '202455474@PUSAN.AC.KR' });

    expect(res.status).toBe(200);
    expect(calls.ilike).toEqual({ col: 'email', value: '202455474@PUSAN.AC.KR' });
    expect(calls.eq).toBeNull();
  });

  test('still accepts a student ID', async () => {
    const calls = mockStudent(STUDENT);

    const res = await forgot({ student_id: '202455474' });

    expect(res.status).toBe(200);
    expect(calls.eq).toEqual({ col: 'student_id', value: '202455474' });
    expect(calls.ilike).toBeNull();
  });

  test('routes a single identifier field by whether it contains @', async () => {
    const asEmail = mockStudent(STUDENT);
    await forgot({ identifier: '202455474@pusan.ac.kr' });
    expect(asEmail.ilike?.col).toBe('email');

    const asId = mockStudent(STUDENT);
    await forgot({ identifier: '202455474' });
    expect(asId.eq?.col).toBe('student_id');
  });

  test('says which kind of identifier was not found', async () => {
    mockStudent(null);
    const byEmail = await forgot({ email: 'nobody@pusan.ac.kr' });
    expect(byEmail.status).toBe(404);
    expect(byEmail.body.message).toMatch(/email/i);

    mockStudent(null);
    const byId = await forgot({ student_id: '999999999' });
    expect(byId.status).toBe(404);
    expect(byId.body.message).toMatch(/student id/i);
  });
});
