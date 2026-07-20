const bcrypt = require("bcryptjs");
const supabase = require("../supabaseClient");
const supabaseAuth = require("../supabaseAuthClient");

// Written into student.password once an account lives in Supabase Auth. The
// column is kept (rather than dropped) so a half-migrated table stays readable
// and so legacy bcrypt hashes can be recognised on sight.
const SUPABASE_AUTH_MARKER = "[SUPABASE_AUTH]";

// bcrypt hashes all begin with $2a$ / $2b$ / $2y$.
function isLegacyBcryptHash(storedPassword) {
  return typeof storedPassword === "string" && storedPassword.startsWith("$2");
}

// The admin API has no lookup-by-email, so page through users. The student body
// is small; the cap stops this from ever becoming an unbounded scan.
async function findAuthUserByEmail(email, { maxPages = 10, perPage = 200 } = {}) {
  const target = String(email || "").toLowerCase();
  if (!target) return null;

  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await supabaseAuth.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      console.warn("[auth] listUsers failed:", error.message);
      return null;
    }

    const users = data?.users || [];
    const match = users.find(
      (user) => String(user.email || "").toLowerCase() === target,
    );
    if (match) return match;

    if (users.length < perPage) return null;
  }

  return null;
}

/**
 * Move a student onto Supabase Auth using a password that has already been
 * verified against their legacy bcrypt hash.
 *
 * Best-effort by design: the caller has already authenticated the student, so a
 * migration failure must never block their login. If this fails the row keeps
 * its bcrypt hash and the next login simply retries.
 */
async function migrateStudentToSupabaseAuth({ studentId, email, password }) {
  try {
    const { error: createError } = await supabaseAuth.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    // An auth user may already exist from a partial signup. Bring its password
    // in line with the one we just verified so the account converges.
    if (createError) {
      const existing = await findAuthUserByEmail(email);
      if (!existing) {
        console.warn(
          `[auth] could not migrate ${studentId} to Supabase Auth:`,
          createError.message,
        );
        return false;
      }

      const { error: updateError } =
        await supabaseAuth.auth.admin.updateUserById(existing.id, { password });
      if (updateError) {
        console.warn(
          `[auth] could not sync password for ${studentId}:`,
          updateError.message,
        );
        return false;
      }
    }

    const { error: markError } = await supabase
      .from("student")
      .update({ password: SUPABASE_AUTH_MARKER })
      .eq("student_id", studentId);

    if (markError) {
      console.warn(
        `[auth] migrated ${studentId} but failed to mark the row:`,
        markError.message,
      );
      return false;
    }

    console.log(`[auth] migrated ${studentId} to Supabase Auth`);
    return true;
  } catch (err) {
    console.warn(`[auth] migration error for ${studentId}:`, err.message);
    return false;
  }
}

/**
 * Verify a student's password against Supabase Auth, falling back to the legacy
 * bcrypt hash and migrating them across on success.
 *
 * @returns {Promise<{ ok: boolean, migrated: boolean }>}
 */
async function verifyStudentPassword({ studentId, email, storedPassword, password }) {
  if (!email) {
    console.warn(`[auth] student ${studentId} has no email; cannot authenticate`);
    return { ok: false, migrated: false };
  }

  const { error: authError } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (!authError) {
    return { ok: true, migrated: false };
  }

  if (!isLegacyBcryptHash(storedPassword)) {
    return { ok: false, migrated: false };
  }

  const isMatch = await bcrypt.compare(password, storedPassword);
  if (!isMatch) {
    return { ok: false, migrated: false };
  }

  const migrated = await migrateStudentToSupabaseAuth({
    studentId,
    email,
    password,
  });

  return { ok: true, migrated };
}

/**
 * Set a new password for a student in Supabase Auth, creating the auth user if
 * this is their first time through.
 *
 * @returns {Promise<string>} the value to store in student.password
 */
async function setStudentPassword({ email, newPassword }) {
  const existing = await findAuthUserByEmail(email);

  if (existing) {
    const { error } = await supabaseAuth.auth.admin.updateUserById(existing.id, {
      password: newPassword,
    });
    if (error) {
      throw new Error(`Failed to update password in Supabase Auth: ${error.message}`);
    }
  } else {
    const { error } = await supabaseAuth.auth.admin.createUser({
      email,
      password: newPassword,
      email_confirm: true,
    });
    if (error) {
      throw new Error(`Failed to create Supabase Auth user: ${error.message}`);
    }
  }

  return SUPABASE_AUTH_MARKER;
}

module.exports = {
  SUPABASE_AUTH_MARKER,
  isLegacyBcryptHash,
  findAuthUserByEmail,
  verifyStudentPassword,
  setStudentPassword,
};
