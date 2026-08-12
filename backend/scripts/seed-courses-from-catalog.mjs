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
 * Legacy rebuild utility. Before any delete it fails closed when reviewed
 * official identities or offering dependencies exist. There is intentionally
 * no force option: use a reviewed, identity-preserving migration instead.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

import seedSafety from './lib/courseSeedSafety.cjs';

const { seedCoursesByMajor } = seedSafety;
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
  const result = await seedCoursesByMajor({ supabase, byMajor });
  if (result.failedMajors) process.exitCode = 1;
  console.log(
    `\nDone. Inserted ${result.inserted} courses across ${result.successfulMajors} majors` +
      (result.failedMajors ? ` — ${result.failedMajors} major(s) FAILED.` : '.'),
  );
}

seed().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
