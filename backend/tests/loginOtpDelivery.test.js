/**
 * The login OTP is only useful if it actually reaches the student. Before this,
 * every code was generated locally and written to the server log, so the demo
 * account was the only one that could ever sign in.
 *
 * These tests pin which of the two delivery paths runs, because getting it
 * wrong is silent: a local code for a real student looks fine in the response
 * and simply never arrives.
 */
const mockSignInWithOtp = jest.fn();
const mockVerifyOtp = jest.fn();

jest.mock('../supabaseAuthClient', () => ({
  auth: {
    signInWithOtp: (...args) => mockSignInWithOtp(...args),
    verifyOtp: (...args) => mockVerifyOtp(...args),
  },
}));

const {
  createLoginChallenge,
  consumeLoginChallenge,
  DEMO_EMAIL,
  DEMO_OTP,
} = require('../services/loginChallengeService');

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.LOGIN_OTP_FIXED;
  mockSignInWithOtp.mockResolvedValue({ error: null });
  mockVerifyOtp.mockResolvedValue({ error: null });
});

describe('login OTP delivery', () => {
  test('a real student gets a code emailed by Supabase, not one minted locally', async () => {
    const challenge = await createLoginChallenge({
      studentId: '202455474',
      email: '202455474@pusan.ac.kr',
    });

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: '202455474@pusan.ac.kr',
      options: { shouldCreateUser: false },
    });
    expect(challenge.delivery).toBe('supabase');
    // No local secret exists for this path — Supabase owns the code.
    expect(challenge.debugCode).toBeNull();
    expect(challenge.maskedEmail).not.toContain('202455474@');
  });

  test('shouldCreateUser is false so a mistyped address cannot mint an account', async () => {
    await createLoginChallenge({ studentId: '1', email: 'typo@pusan.ac.kr' });

    const [[options]] = mockSignInWithOtp.mock.calls;
    expect(options.options.shouldCreateUser).toBe(false);
  });

  test('verification for a real student is delegated to Supabase', async () => {
    const challenge = await createLoginChallenge({
      studentId: '202455474',
      email: '202455474@pusan.ac.kr',
    });

    const result = await consumeLoginChallenge({
      challengeId: challenge.challengeId,
      code: '482913',
    });

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: '202455474@pusan.ac.kr',
      token: '482913',
      type: 'email',
    });
    expect(result).toMatchObject({ ok: true, studentId: '202455474' });
  });

  test('a code Supabase rejects is a wrong code, not a crash', async () => {
    mockVerifyOtp.mockResolvedValue({ error: { message: 'Token has expired' } });
    const challenge = await createLoginChallenge({
      studentId: '202455474',
      email: '202455474@pusan.ac.kr',
    });

    const result = await consumeLoginChallenge({
      challengeId: challenge.challengeId,
      code: '000000',
    });

    expect(result).toEqual({ ok: false, reason: 'invalid_code' });
  });

  test('a send failure is raised so the caller can say so, rather than issuing a dead challenge', async () => {
    mockSignInWithOtp.mockResolvedValue({
      error: { message: 'email rate limit exceeded' },
    });

    await expect(
      createLoginChallenge({ studentId: '1', email: 'someone@pusan.ac.kr' }),
    ).rejects.toMatchObject({ code: 'OTP_DELIVERY_FAILED' });
  });

  test('the demo account stays offline — fixed code, nothing emailed', async () => {
    const challenge = await createLoginChallenge({
      studentId: '202612345',
      email: DEMO_EMAIL,
    });

    expect(mockSignInWithOtp).not.toHaveBeenCalled();
    expect(challenge.delivery).toBe('local');

    const result = await consumeLoginChallenge({
      challengeId: challenge.challengeId,
      code: DEMO_OTP,
    });

    expect(result.ok).toBe(true);
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });

  test('LOGIN_OTP_FIXED keeps every account offline for local development', async () => {
    process.env.LOGIN_OTP_FIXED = '1';

    const challenge = await createLoginChallenge({
      studentId: '202455474',
      email: '202455474@pusan.ac.kr',
    });

    expect(mockSignInWithOtp).not.toHaveBeenCalled();
    expect(challenge.delivery).toBe('local');
    expect(challenge.debugCode).toBe(DEMO_OTP);
  });

  test('the wrong code on the local path is still rejected', async () => {
    const challenge = await createLoginChallenge({
      studentId: '202612345',
      email: DEMO_EMAIL,
    });

    const result = await consumeLoginChallenge({
      challengeId: challenge.challengeId,
      code: '999999',
    });

    expect(result).toEqual({ ok: false, reason: 'invalid_code' });
  });
});
