/**
 * The login OTP is only useful if it reaches the student. Before Resend was
 * wired in, every code was written to stdout and never sent, so the demo
 * account was the only one that could complete a login.
 *
 * These pin which of the two paths runs, because getting it wrong is silent:
 * an offline code for a real student looks fine in the API response and simply
 * never arrives, and a real send for the demo account breaks the presentation
 * the moment the network or the provider is unavailable.
 *
 * otpEmailService is mocked throughout — services/otpEmailService also refuses
 * to send under NODE_ENV=test as a second line of defence.
 */
const mockSendOtpEmail = jest.fn();

jest.mock('../services/otpEmailService', () => ({
  isResendConfigured: () => true,
  sendOtpEmail: (...args) => mockSendOtpEmail(...args),
  buildOtpEmail: jest.requireActual('../services/otpEmailService').buildOtpEmail,
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
  mockSendOtpEmail.mockResolvedValue({ id: 'msg_test' });
});

describe('login OTP delivery', () => {
  test('a real student is emailed a code that is not the demo code', async () => {
    const challenge = await createLoginChallenge({
      studentId: '202455474',
      email: '202455474@pusan.ac.kr',
    });

    expect(mockSendOtpEmail).toHaveBeenCalledTimes(1);
    const [{ to, code }] = mockSendOtpEmail.mock.calls[0];
    expect(to).toBe('202455474@pusan.ac.kr');
    expect(code).toMatch(/^\d{6}$/);
    expect(code).not.toBe(DEMO_OTP);

    expect(challenge.delivery).toBe('emailed');
    // The plaintext must never come back in the API payload for a real send.
    expect(challenge.debugCode).toBeNull();
  });

  test('the emailed code is the one that verifies', async () => {
    const challenge = await createLoginChallenge({
      studentId: '202455474',
      email: '202455474@pusan.ac.kr',
    });
    const [{ code }] = mockSendOtpEmail.mock.calls[0];

    // Verification stays synchronous: we generated the code, so checking it is
    // a local hash compare with no call back out to the provider.
    expect(consumeLoginChallenge({ challengeId: challenge.challengeId, code }))
      .toMatchObject({ ok: true, studentId: '202455474' });
  });

  test('a wrong code is rejected', async () => {
    const challenge = await createLoginChallenge({
      studentId: '202455474',
      email: '202455474@pusan.ac.kr',
    });

    expect(consumeLoginChallenge({ challengeId: challenge.challengeId, code: '000000' }))
      .toEqual({ ok: false, reason: 'invalid_code' });
  });

  test('a send failure raises instead of issuing a challenge for a code nobody received', async () => {
    const failure = Object.assign(new Error('Resend rejected the message: 403'), {
      code: 'OTP_DELIVERY_FAILED',
    });
    mockSendOtpEmail.mockRejectedValue(failure);

    await expect(
      createLoginChallenge({ studentId: '1', email: 'someone@pusan.ac.kr' }),
    ).rejects.toMatchObject({ code: 'OTP_DELIVERY_FAILED' });
  });

  test('the demo account stays offline — fixed code, nothing sent', async () => {
    const challenge = await createLoginChallenge({
      studentId: '202612345',
      email: DEMO_EMAIL,
    });

    expect(mockSendOtpEmail).not.toHaveBeenCalled();
    expect(challenge.delivery).toBe('offline');
    expect(challenge.debugCode).toBe(DEMO_OTP);

    expect(consumeLoginChallenge({ challengeId: challenge.challengeId, code: DEMO_OTP }))
      .toMatchObject({ ok: true });
  });

  test('LOGIN_OTP_FIXED keeps every account offline for local development', async () => {
    process.env.LOGIN_OTP_FIXED = '1';

    const challenge = await createLoginChallenge({
      studentId: '202455474',
      email: '202455474@pusan.ac.kr',
    });

    expect(mockSendOtpEmail).not.toHaveBeenCalled();
    expect(challenge.delivery).toBe('offline');
  });

  test('the demo address is matched case-insensitively', async () => {
    const challenge = await createLoginChallenge({
      studentId: '202612345',
      email: DEMO_EMAIL.toUpperCase(),
    });

    expect(mockSendOtpEmail).not.toHaveBeenCalled();
    expect(challenge.delivery).toBe('offline');
  });
});

describe('the email itself', () => {
  const { buildOtpEmail } = jest.requireActual('../services/otpEmailService');

  test('leads with the code in the subject, since previews are read more than bodies', () => {
    const { subject } = buildOtpEmail('482913', 10);
    expect(subject.startsWith('482913')).toBe(true);
  });

  test('carries the code and expiry in both html and plain text', () => {
    const { html, text } = buildOtpEmail('482913', 10);
    for (const body of [html, text]) {
      expect(body).toContain('482913');
      expect(body).toContain('10');
    }
  });
});
