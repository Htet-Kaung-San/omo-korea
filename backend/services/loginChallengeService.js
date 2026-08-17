const crypto = require("crypto");
const { sendOtpEmail } = require("./otpEmailService");

const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const DEMO_EMAIL = "202612345@pusan.ac.kr";
const DEMO_OTP = "123456";

/** @type {Map<string, { studentId: string, email: string, codeHash: string, expiresAt: number, attempts: number }>} */
const challenges = new Map();

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function maskEmail(email) {
  const [localPart, domain] = String(email).split("@");
  if (!domain) return "***";
  let maskedLocal = localPart;
  if (localPart.length > 2) {
    maskedLocal =
      localPart.substring(0, 2) +
      "*".repeat(Math.min(8, localPart.length - 2));
  } else {
    maskedLocal = localPart.substring(0, 1) + "*";
  }
  return `${maskedLocal}@${domain}`;
}

function hashCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function generateOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function purgeExpired() {
  const now = Date.now();
  for (const [id, challenge] of challenges.entries()) {
    if (challenge.expiresAt <= now) {
      challenges.delete(id);
    }
  }
}

/**
 * Create a login OTP challenge after password verification succeeded.
 *
 * Two paths, and which one runs decides whether an email is sent at all:
 *
 *   offline   the demo account, and everything under LOGIN_OTP_FIXED=1. The
 *             code is the fixed DEMO_OTP, it is logged, and nothing is emailed.
 *             This is what lets the presentation and the test suite run with no
 *             network and no email provider — do not remove it.
 *   emailed   everyone else. A random code is generated here, its hash stored,
 *             and the plaintext sent through Resend. We own the code either
 *             way; Resend only carries it.
 *
 * Before this, every code was written to stdout and never sent, so no student
 * outside the demo account could complete a login — the code existed only in
 * the server's log.
 *
 * @throws {Error} code OTP_DELIVERY_FAILED when the message could not be sent.
 * @returns {Promise<{challengeId: string, maskedEmail: string, delivery: string, debugCode: string|null}>}
 */
async function createLoginChallenge({ studentId, email }) {
  purgeExpired();

  const normalizedEmail = normalizeEmail(email);
  const challengeId = crypto.randomUUID();
  const offline =
    normalizedEmail === DEMO_EMAIL || process.env.LOGIN_OTP_FIXED === "1";
  const code = offline ? DEMO_OTP : generateOtp();

  if (!offline) {
    // Send before storing the challenge. If delivery fails there is no
    // half-open challenge left behind for a code that never arrived.
    await sendOtpEmail({
      to: normalizedEmail,
      code,
      expiresInMinutes: Math.round(CHALLENGE_TTL_MS / 60000),
    });
  }

  challenges.set(challengeId, {
    studentId: String(studentId),
    email: normalizedEmail,
    delivery: offline ? "offline" : "emailed",
    codeHash: hashCode(code),
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    attempts: 0,
  });

  // The code is only logged on the offline path. Printing a real student's
  // live code into the server log would put a working credential in anything
  // that scrapes stdout.
  console.log(
    `[login-otp] challenge ${challengeId} for ${maskEmail(normalizedEmail)} ` +
      (offline ? `delivery=offline code=${code}` : "delivery=emailed"),
  );

  return {
    challengeId,
    maskedEmail: maskEmail(normalizedEmail),
    delivery: offline ? "offline" : "emailed",
    // Exposed to callers for test/dev helpers only, and never for a real send.
    debugCode: offline ? code : null,
  };
}

function consumeLoginChallenge({ challengeId, code }) {
  purgeExpired();

  const challenge = challenges.get(String(challengeId || ""));
  if (!challenge) {
    return { ok: false, reason: "invalid_or_expired" };
  }

  if (challenge.expiresAt <= Date.now()) {
    challenges.delete(challengeId);
    return { ok: false, reason: "invalid_or_expired" };
  }

  challenge.attempts += 1;
  if (challenge.attempts > MAX_ATTEMPTS) {
    challenges.delete(challengeId);
    return { ok: false, reason: "too_many_attempts" };
  }

  const provided = String(code || "").trim();
  if (hashCode(provided) !== challenge.codeHash) {
    return { ok: false, reason: "invalid_code" };
  }

  challenges.delete(challengeId);
  return {
    ok: true,
    studentId: challenge.studentId,
    email: challenge.email,
  };
}

function getChallengeDebugCode(challengeId) {
  const challenge = challenges.get(String(challengeId || ""));
  if (!challenge) return null;
  // Only useful in tests: re-derive is impossible; store reverse for test env.
  return challenge._debugCode || null;
}

// Attach debug code on create for tests that need to read it back.
const _create = createLoginChallenge;
async function createLoginChallengeWithDebug(args) {
  const result = await _create(args);
  const entry = challenges.get(result.challengeId);
  if (entry) {
    entry._debugCode = result.debugCode;
  }
  return result;
}

module.exports = {
  normalizeEmail,
  maskEmail,
  createLoginChallenge: createLoginChallengeWithDebug,
  consumeLoginChallenge,
  getChallengeDebugCode,
  DEMO_EMAIL,
  DEMO_OTP,
};
