const crypto = require("crypto");
const supabaseAuth = require("../supabaseAuthClient");

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
 * Delivery
 * --------
 * There are two paths, and which one runs decides who owns the code.
 *
 *   "local"    — the demo account, and anything under LOGIN_OTP_FIXED=1. We
 *                mint the code ourselves and only log it. Nothing is emailed,
 *                which is what makes the demo and the test suite work offline.
 *   "supabase" — everyone else. Supabase generates and EMAILS the code through
 *                its own auth mailer, and later verifies it. We cannot email a
 *                code we generated: Supabase's mailer only sends messages it
 *                composes, and the project has no SMTP provider of its own.
 *                So for real accounts Supabase owns the secret and this module
 *                just tracks who the challenge belongs to.
 *
 * Before this, every code was local and merely console.log'd, so no student
 * outside the demo account could ever complete a login — the code existed only
 * in the server's stdout.
 *
 * @returns {Promise<{challengeId: string, maskedEmail: string, delivery: string, debugCode: string|null}>}
 */
async function createLoginChallenge({ studentId, email }) {
  purgeExpired();

  const normalizedEmail = normalizeEmail(email);
  const challengeId = crypto.randomUUID();
  const useLocalCode =
    normalizedEmail === DEMO_EMAIL || process.env.LOGIN_OTP_FIXED === "1";

  if (useLocalCode) {
    const code = DEMO_OTP;
    challenges.set(challengeId, {
      studentId: String(studentId),
      email: normalizedEmail,
      delivery: "local",
      codeHash: hashCode(code),
      expiresAt: Date.now() + CHALLENGE_TTL_MS,
      attempts: 0,
    });

    console.log(
      `[login-otp] challenge ${challengeId} for ${maskEmail(normalizedEmail)} delivery=local code=${code}`,
    );

    return {
      challengeId,
      maskedEmail: maskEmail(normalizedEmail),
      delivery: "local",
      debugCode: code,
    };
  }

  // shouldCreateUser:false matters — without it a typo'd address would mint a
  // brand new auth user instead of failing, and signup is not an OTP flow.
  const { error } = await supabaseAuth.auth.signInWithOtp({
    email: normalizedEmail,
    options: { shouldCreateUser: false },
  });

  if (error) {
    const deliveryError = new Error(
      `Could not send the verification code: ${error.message}`,
    );
    deliveryError.code = "OTP_DELIVERY_FAILED";
    throw deliveryError;
  }

  challenges.set(challengeId, {
    studentId: String(studentId),
    email: normalizedEmail,
    delivery: "supabase",
    codeHash: null,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    attempts: 0,
  });

  console.log(
    `[login-otp] challenge ${challengeId} for ${maskEmail(normalizedEmail)} delivery=supabase`,
  );

  return {
    challengeId,
    maskedEmail: maskEmail(normalizedEmail),
    delivery: "supabase",
    debugCode: null,
  };
}

async function consumeLoginChallenge({ challengeId, code }) {
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

  if (challenge.delivery === "supabase") {
    // Supabase issued and emailed this code, so it is the only party that can
    // check it. A failure here is an ordinary wrong-code result, not an error:
    // the attempt counter above still applies.
    const { error } = await supabaseAuth.auth.verifyOtp({
      email: challenge.email,
      token: provided,
      type: "email",
    });
    if (error) {
      return { ok: false, reason: "invalid_code" };
    }
  } else if (hashCode(provided) !== challenge.codeHash) {
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
