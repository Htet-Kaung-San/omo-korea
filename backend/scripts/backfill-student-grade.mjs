/**
 * Reconcile student.grade with the intake year encoded in student_id.
 *
 *   npm run backfill:student-grade -- --dry-run
 *   npm run backfill:student-grade
 *   npm run backfill:student-grade -- --fix-mismatched
 *
 * Why this exists
 * ---------------
 * PR #26/#27 gated the "New Student Checklist" on shouldShowChecklist(grade),
 * which passes only for grade 0 (exchange) or 1 (first year). Every seeded
 * student carries grade 2, 3 or null, so the checklist renders for nobody —
 * GET /students/notifications returns notices and zero CHECKLIST items.
 *
 * The grade column is written by the onboarding year choice
 * (gradeFromYearChoice), while the profile screen independently DERIVES a year
 * label from the student_id intake year. The two drifted apart: the seeded demo
 * account 202612345 is a 2026 intake, shows "1st Year" on screen, and has
 * grade 3 in the row.
 *
 * Safety
 * ------
 * grade is user-supplied data once someone completes onboarding, and an
 * exchange student legitimately has grade 0 that no student_id can imply. So by
 * default this only fills rows where grade IS NULL, and never overwrites a
 * value a student chose. Correcting rows that contradict their own student_id
 * — the seeded fixtures — requires the explicit --fix-mismatched flag.
 *
 * Rows whose student_id is not a PNU-format id (9 digits beginning with a
 * plausible 4-digit intake year) are always skipped: the OTP signup flow mints
 * random numeric ids, and there is no intake year to read from those.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");
const FIX_MISMATCHED = process.argv.includes("--fix-mismatched");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
  console.error("Configure real SUPABASE_URL / SUPABASE_KEY in backend/.env");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Mirrors yearLabelFromStudentId in frontend/src/pages/ProfilePage.tsx so the
 * stored grade and the displayed year label cannot disagree. The Korean
 * academic year starts in March, so Jan/Feb still belong to the previous one.
 */
function academicYearFor(date) {
  return date.getMonth() >= 2 ? date.getFullYear() : date.getFullYear() - 1;
}

/** @returns {number|null} 1-4, or null when the id carries no usable intake year */
function gradeFromStudentId(studentId, now) {
  const raw = String(studentId ?? "").trim();
  if (!/^\d{9}$/.test(raw)) return null;

  const intakeYear = Number(raw.slice(0, 4));
  const thisAcademicYear = academicYearFor(now);
  // Reject ids whose leading digits are not a plausible intake year, which is
  // how the random OTP-signup ids get filtered out.
  if (intakeYear < 1990 || intakeYear > thisAcademicYear + 1) return null;

  // Clamp into the 1-4 domain that gradeFromYearChoice and studentTypeFromGrade
  // already use. A long-enrolled student reads as 4 rather than 5+.
  return Math.max(1, Math.min(4, thisAcademicYear - intakeYear + 1));
}

async function main() {
  const now = new Date();
  console.log(
    `Academic year ${academicYearFor(now)}` +
      `${DRY_RUN ? "  [DRY RUN — no writes]" : ""}` +
      `${FIX_MISMATCHED ? "  [--fix-mismatched: will correct contradicting rows]" : ""}\n`,
  );

  const { data: students, error } = await supabase
    .from("student")
    .select("student_id, name, grade")
    .order("student_id", { ascending: true });

  if (error) {
    console.error("Failed to read students:", error.message);
    process.exit(1);
  }

  const planned = [];
  const skipped = [];

  for (const row of students) {
    const expected = gradeFromStudentId(row.student_id, now);
    const current = row.grade === null || row.grade === undefined ? null : Number(row.grade);

    if (expected === null) {
      skipped.push({ ...row, why: "no intake year in student_id" });
      continue;
    }
    if (current === expected) continue;
    if (current !== null && !FIX_MISMATCHED) {
      skipped.push({ ...row, why: `has grade ${current}, expected ${expected} — needs --fix-mismatched` });
      continue;
    }
    planned.push({ ...row, from: current, to: expected });
  }

  if (skipped.length) {
    console.log(`Skipped ${skipped.length}:`);
    for (const s of skipped) {
      console.log(`  ${s.student_id}  ${String(s.name ?? "").slice(0, 22).padEnd(22)}  ${s.why}`);
    }
    console.log("");
  }

  if (!planned.length) {
    console.log("Nothing to update — every readable student_id already matches its grade.");
    return;
  }

  console.log(`${DRY_RUN ? "Would update" : "Updating"} ${planned.length}:`);
  for (const p of planned) {
    console.log(
      `  ${p.student_id}  ${String(p.name ?? "").slice(0, 22).padEnd(22)}  ` +
        `grade ${p.from === null ? "null" : p.from} -> ${p.to}` +
        `${p.to === 1 || p.to === 0 ? "   (checklist becomes visible)" : ""}`,
    );
  }

  if (DRY_RUN) {
    console.log("\nDry run — nothing written. Re-run without --dry-run to apply.");
    return;
  }

  let updated = 0;
  let failed = 0;
  for (const p of planned) {
    const { error: updateError } = await supabase
      .from("student")
      .update({ grade: p.to })
      .eq("student_id", p.student_id);

    if (updateError) {
      failed += 1;
      console.error(`  FAILED ${p.student_id}: ${updateError.message}`);
    } else {
      updated += 1;
    }
  }

  console.log(`\nDone. ${updated} updated${failed ? `, ${failed} FAILED` : ""}.`);
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Backfill failed:", err.message);
  process.exit(1);
});
