/**
 * Delivers login verification codes through Resend.
 *
 * Uses the REST endpoint directly rather than the `resend` SDK. The call is a
 * single POST with four fields, Node has fetch built in, and this repository is
 * public — not adding a dependency keeps the install surface and the supply
 * chain unchanged, and teammates do not need to npm install anything to run the
 * backend.
 *
 * Configuration (backend/.env, which is gitignored):
 *   RESEND_API_KEY      the account API key
 *   RESEND_FROM_EMAIL   the sender. Until a domain is verified this must be
 *                       onboarding@resend.dev, Resend's shared testing sender.
 *
 * Test-mode limitation, worth knowing before debugging a failure: while the
 * sender is onboarding@resend.dev, Resend will ONLY deliver to the address the
 * Resend account was registered with. Every other recipient — including any
 * @pusan.ac.kr address — is rejected with 403. Lifting that needs a verified
 * domain, and the sender then has to be an address on that domain.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const REQUEST_TIMEOUT_MS = 10_000;

function isResendConfigured() {
  return Boolean(
    String(process.env.RESEND_API_KEY || "").trim() &&
      String(process.env.RESEND_FROM_EMAIL || "").trim(),
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildOtpEmail(code, expiresInMinutes) {
  const safeCode = escapeHtml(code);
  return {
    subject: `${code} is your Hey! PNU verification code`,
    // Deliberately plain. A code email is read in a notification preview more
    // often than it is opened, so the code leads the subject line too.
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h1 style="font-size:20px;color:#003D82;margin:0 0 8px">Hey! PNU</h1>
        <p style="font-size:15px;color:#334155;margin:0 0 20px">
          Enter this code to finish signing in.
        </p>
        <p style="font-size:34px;font-weight:700;letter-spacing:6px;color:#0F172A;margin:0 0 20px">
          ${safeCode}
        </p>
        <p style="font-size:13px;color:#64748B;margin:0">
          The code expires in ${expiresInMinutes} minutes. If you did not try to
          sign in, you can ignore this email.
        </p>
      </div>
    `.trim(),
    text: `Hey! PNU\n\nYour verification code is ${code}.\nIt expires in ${expiresInMinutes} minutes.\n\nIf you did not try to sign in, you can ignore this email.`,
  };
}

/**
 * @throws {Error} with code OTP_DELIVERY_FAILED when the message was not accepted.
 */
async function sendOtpEmail({ to, code, expiresInMinutes = 10 }) {
  // Fail closed under Jest. Today no test reaches this — every suite uses the
  // demo account or LOGIN_OTP_FIXED — but a future test written with an
  // ordinary address would otherwise send real mail from CI, against a
  // provider with a rate limit. Mock this module instead.
  if (process.env.NODE_ENV === "test" && process.env.ALLOW_REAL_OTP_EMAIL !== "1") {
    const error = new Error(
      "Refusing to send a real OTP email from the test environment. Mock services/otpEmailService instead.",
    );
    error.code = "OTP_DELIVERY_BLOCKED_IN_TEST";
    throw error;
  }

  if (!isResendConfigured()) {
    const error = new Error(
      "Email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL in backend/.env.",
    );
    error.code = "OTP_DELIVERY_FAILED";
    throw error;
  }

  const { subject, html, text } = buildOtpEmail(code, expiresInMinutes);

  let response;
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [to],
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (networkError) {
    // A hung request must not hold the login response open indefinitely.
    const error = new Error(`Could not reach the email provider: ${networkError.message}`);
    error.code = "OTP_DELIVERY_FAILED";
    throw error;
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (body?.message) detail = body.message;
    } catch {
      // Non-JSON error body; the status alone is enough to act on.
    }
    const error = new Error(`Resend rejected the message: ${detail}`);
    error.code = "OTP_DELIVERY_FAILED";
    error.status = response.status;
    throw error;
  }

  const body = await response.json().catch(() => ({}));
  return { id: body?.id || null };
}

module.exports = {
  isResendConfigured,
  sendOtpEmail,
  buildOtpEmail,
};
