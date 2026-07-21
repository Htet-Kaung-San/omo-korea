/**
 * Seed real PNU major courses into the `course` table.
 *
 *   npm run seed:courses
 *
 * Source data: data/curriculum-courses-2026-1.json, derived from the official
 * "2026학년도 1학기 학부 개설강좌 일람표" (undergraduate course catalog) by
 * scripts/parse-catalog.py. Each record is { major_id, course_name, credit,
 * category } where category is REQUIRED (전공필수/전공기초) or ELECTIVE (전공선택).
 *
 * Idempotent and safe: a major that ALREADY has courses is skipped entirely,
 * so this never duplicates and never disturbs the hand-entered bilingual
 * AI/CSE/EE data. Re-running after a full load is a no-op.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
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

const here = dirname(fileURLToPath(import.meta.url));
const dataFile = join(here, "..", "data", "curriculum-courses-2026-1.json");
const courses = JSON.parse(readFileSync(dataFile, "utf8"));

const byMajor = new Map();
for (const c of courses) {
  if (!byMajor.has(c.major_id)) byMajor.set(c.major_id, []);
  byMajor.get(c.major_id).push(c);
}

async function seed() {
  let inserted = 0;
  let failedMajors = 0;

  // Delete-then-insert per target major so re-runs are deterministic. Only the
  // majors present in the JSON are ever touched — the hand-entered AI/CSE/EE
  // majors are excluded from the data file, so this never disturbs them.
  for (const [majorId, rows] of [...byMajor.entries()].sort((a, b) => a[0] - b[0])) {
    const { error: delError } = await supabase
      .from("course")
      .delete()
      .eq("major_id", majorId);
    if (delError) {
      console.error(`✗ major ${majorId}: delete failed — ${delError.message}`);
      failedMajors += 1;
      process.exitCode = 1;
      continue;
    }

    const payload = rows.map((c) => ({
      major_id: c.major_id,
      course_name: c.course_name,
      credit: c.credit,
      category: c.category,
    }));

    let majorInserted = 0;
    let majorFailed = false;
    for (let i = 0; i < payload.length; i += 500) {
      const batch = payload.slice(i, i + 500);
      const { error } = await supabase.from("course").insert(batch);
      if (error) {
        console.error(`✗ major ${majorId}: insert failed — ${error.message}`);
        majorFailed = true;
        process.exitCode = 1;
        break;
      }
      majorInserted += batch.length;
    }

    if (majorFailed) {
      failedMajors += 1;
    } else {
      inserted += majorInserted;
      console.log(`✓ major ${String(majorId).padStart(3)} — inserted ${majorInserted}`);
    }
  }

  console.log(
    `\nDone. Inserted ${inserted} courses across ${byMajor.size - failedMajors} majors` +
      (failedMajors ? ` — ${failedMajors} major(s) FAILED (see ✗ above).` : "."),
  );
}

seed().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
