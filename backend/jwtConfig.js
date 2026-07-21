require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// Fail fast rather than silently falling back to a shared default. A hardcoded
// fallback secret is readable by anyone with the source, which lets them forge
// a token for any student.
if (!JWT_SECRET) {
  throw new Error(
    "Missing JWT_SECRET in backend/.env. Generate one with:\n" +
      "  node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
  );
}

module.exports = { JWT_SECRET };
