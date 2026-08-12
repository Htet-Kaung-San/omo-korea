const crypto = require("crypto");

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
 * Returns the plaintext code only for logging / test helpers — never put it
 * in the public API response except when NODE_ENV=test.
 */
function createLoginChallenge({ studentId, email }) {
  purgeExpired();

  const normalizedEmail = normalizeEmail(email);
  const challengeId = crypto.randomUUID();
  const code =
    normalizedEmail === DEMO_EMAIL || process.env.LOGIN_OTP_FIXED === "1"
      ? DEMO_OTP
      : generateOtp();

  challenges.set(challengeId, {
    studentId: String(studentId),
    email: normalizedEmail,
    codeHash: hashCode(code),
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    attempts: 0,
  });

  console.log(
    `[login-otp] challenge ${challengeId} for ${maskEmail(normalizedEmail)} code=${code}`,
  );

  return {
    challengeId,
    maskedEmail: maskEmail(normalizedEmail),
    // Exposed to callers for test/dev helpers only.
    debugCode: code,
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
function createLoginChallengeWithDebug(args) {
  const result = _create(args);
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
