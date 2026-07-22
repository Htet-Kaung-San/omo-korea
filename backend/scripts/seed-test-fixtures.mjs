/**
 * Seed the two fixture accounts the integration suite authenticates as.
 *
 *   npm run seed:test-fixtures
 *
 * Safe to re-run: accounts are upserted and their passwords reset, so a
 * half-created fixture from an interrupted run converges to a good state.
 *
 * These are real rows in the shared Supabase project, not throwaway records.
 * The suite no longer deletes them — the destructive account-deletion tests
 * were removed precisely because they made the suite pass exactly once.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
  console.error("Configure real SUPABASE_URL / SUPABASE_KEY in backend/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const FIXTURE_PASSWORD = "password";
const SUPABASE_AUTH_MARKER = "[SUPABASE_AUTH]";

const fixtures = [
  {
    student_id: 202455393,
    name: "Test Admin Student",
    email: "202455393@pusan.ac.kr",
    is_admin: true,
    note: "admin fixture — exercises admin-only routes",
  },
  {
    student_id: 202612345,
    name: "Test Standard Student",
    email: "202612345@pusan.ac.kr",
    is_admin: false,
    note: "non-admin fixture — asserts 403 on admin-only routes",
  },
];

async function findAuthUserByEmail(email) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(`listUsers failed: ${error.message}`);

    const users = data?.users || [];
    const match = users.find((u) => (u.email || "").toLowerCase() === target);
    if (match) return match;
    if (users.length < 200) return null;
  }
  return null;
}

async function upsertAuthUser(email) {
  const existing = await findAuthUserByEmail(email);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: FIXTURE_PASSWORD,
    });
    if (error) throw new Error(`updateUserById failed: ${error.message}`);
    return "updated";
  }

  const { error } = await supabase.auth.admin.createUser({
    email,
    password: FIXTURE_PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser failed: ${error.message}`);
  return "created";
}

async function seed() {
  for (const fixture of fixtures) {
    const { student_id, name, email, is_admin, note } = fixture;

    const authAction = await upsertAuthUser(email);

    const { error } = await supabase.from("student").upsert(
      {
        student_id,
        name,
        email,
        is_admin,
        password: SUPABASE_AUTH_MARKER,
        nationality: "Myanmar",
        phone: "010-0000-0000",
        language_pref: "en",
        major_id: 1,
        grade: 3,
        student_type: "Current",
        visa_status: "D-2",
        is_in_korea: true,
        intake_term: "March",
        completed_courses: [],
        deletion_requested: false,
      },
      { onConflict: "student_id" },
    );

    if (error) {
      console.error(`✗ ${student_id}: ${error.message}`);
      process.exitCode = 1;
      continue;
    }

    console.log(`✓ ${student_id} (${note}) — auth user ${authAction}`);
  }

  console.log(`\nFixture password: "${FIXTURE_PASSWORD}"`);
}

seed().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
