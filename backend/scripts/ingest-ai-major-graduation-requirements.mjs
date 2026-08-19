/**
 * Records the Artificial Intelligence major's graduation requirements.
 *
 * Only 12 of 116 majors had any, all of them engineering, and AI was not one —
 * so "how many credits do I need to graduate?" answered generically for the
 * major most of this project's own accounts sit in.
 *
 * The figures come from two official documents, both committed under
 * backend/data/source/graduation-regulations/ so they can be checked:
 *
 *   - 2026학년도 교육과정표, 정보컴퓨터공학부 인공지능전공 — the credit table.
 *     The .txt extraction of that .hwp dropped every table into empty <표>
 *     placeholders, which is why the numbers were not picked up when the file
 *     was first added; the .xhtml conversion kept them.
 *   - 부산대학교 졸업논문 등에 관한 시행세칙 (2026-01-15), 별표 2 — the TOEIC
 *     score, and 별표 2-1 — the Korean requirement for international students.
 *
 * The seven credit components sum to 133, which is what the source declares as
 * 졸업기준 학점; the script refuses to write if that ever stops being true.
 *
 * Nothing here is inferred from the neighbouring Computer Engineering major.
 * That one carries a TOPCIT score and a 졸업과제 from its own departmental
 * rules, and assuming AI shares them would be inventing a graduation
 * requirement — the exact failure this data is meant to prevent.
 *
 *   node scripts/ingest-ai-major-graduation-requirements.mjs           # dry run
 *   node scripts/ingest-ai-major-graduation-requirements.mjs --apply
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;
if (!url || !key) {
  console.error("✗ SUPABASE_URL / SUPABASE_KEY missing in backend/.env");
  process.exit(1);
}
const supabase = createClient(url, key);
const apply = process.argv.includes("--apply");

const MAJOR_NAME_MATCH = "Artificial Intelligence";
const DECLARED_TOTAL = 133;

/** 2026학년도 교육과정표 — 정보컴퓨터공학부 인공지능전공, 영역별 졸업기준 학점. */
const REQUIREMENTS = [
  { requirement_code: "MAJOR_BASIC",      requirement_name: "전공기초",     requirement_type: "CREDIT", target_value: 14, unit: "credits", description: "Major foundation credits.",        display_order: 1 },
  { requirement_code: "MAJOR_REQUIRED",   requirement_name: "전공필수",     requirement_type: "CREDIT", target_value: 37, unit: "credits", description: "Major required credits.",          display_order: 2 },
  { requirement_code: "MAJOR_ELECTIVE",   requirement_name: "전공선택",     requirement_type: "CREDIT", target_value: 51, unit: "credits", description: "Major elective credits.",          display_order: 3 },
  { requirement_code: "HYOWON_CORE",      requirement_name: "효원핵심교양", requirement_type: "CREDIT", target_value: 10, unit: "credits", description: "Hyowon Core liberal arts credits.", display_order: 4 },
  // The source prints "9 (3)": nine credits in total, of which three must be
  // 기초교양. Only the total is stored, because that is what the Credits screen
  // and the assistant compare a transcript against.
  { requirement_code: "HYOWON_BALANCE",   requirement_name: "효원균형교양", requirement_type: "CREDIT", target_value: 9,  unit: "credits", description: "Hyowon Balanced liberal arts credits (3 of the 9 must be 기초교양).", display_order: 5 },
  { requirement_code: "HYOWON_CREATIVE",  requirement_name: "효원창의교양", requirement_type: "CREDIT", target_value: 6,  unit: "credits", description: "Hyowon Creative liberal arts credits.", display_order: 6 },
  { requirement_code: "GENERAL_ELECTIVE", requirement_name: "일반선택",     requirement_type: "CREDIT", target_value: 6,  unit: "credits", description: "General elective credits.",         display_order: 7 },

  // 시행세칙 별표 2 — 정보컴퓨터공학부 인공지능전공, identical for the 2023
  // through 2026 intake columns.
  { requirement_code: "TOEIC", requirement_name: "TOEIC 700", requirement_type: "SCORE", target_value: 700, unit: "points",
    description: "Standard foreign language requirement: TOEIC 700 or an equivalent score from the conversion table in 별표 3.", display_order: 8 },

  // 시행세칙 별표 2-1 — international students admitted from September 2015,
  // every department except 국제학부 and 경영학과.
  { requirement_code: "TOPIK", requirement_name: "TOPIK Level 4 or higher", requirement_type: "PASS_FAIL", target_value: 1, unit: null,
    description: "International students: TOPIK Level 4 or higher, or completion of PNU Language Education Institute Korean level 4 after admission.", display_order: 9 },
];

async function main() {
  const creditTotal = REQUIREMENTS
    .filter((row) => row.requirement_type === "CREDIT")
    .reduce((sum, row) => sum + row.target_value, 0);

  if (creditTotal !== DECLARED_TOTAL) {
    console.error(
      `✗ Credit components sum to ${creditTotal}, but the source declares ${DECLARED_TOTAL}.\n` +
        "  Re-read 2026_artificial_intelligence_curriculum.xhtml before changing anything.",
    );
    process.exit(1);
  }
  console.log(`✓ Credit components sum to ${creditTotal}, matching the source.\n`);

  const { data: majors, error: majorError } = await supabase
    .from("major")
    .select("major_id, major_name")
    .ilike("major_name", `%${MAJOR_NAME_MATCH}%`);
  if (majorError) {
    console.error("✗ Could not read major:", majorError.message);
    process.exit(1);
  }
  if (!majors || majors.length !== 1) {
    console.error(`✗ Expected exactly one major matching "${MAJOR_NAME_MATCH}", found ${majors?.length ?? 0}.`);
    (majors || []).forEach((m) => console.error(`    ${m.major_id}  ${m.major_name}`));
    process.exit(1);
  }
  const major = majors[0];
  console.log(`  Target: ${major.major_name} (major_id ${major.major_id})\n`);

  const { data: existing, error: existingError } = await supabase
    .from("graduation_requirement")
    .select("req_id, requirement_code")
    .eq("major_id", major.major_id);
  if (existingError) {
    console.error("✗ Could not read graduation_requirement:", existingError.message);
    process.exit(1);
  }

  const byCode = new Map((existing || []).map((row) => [row.requirement_code, row]));

  // req_id is assigned explicitly. The existing 103 rows were seeded with
  // literal ids, which left the sequence behind them, so letting Postgres
  // allocate one fails with a primary-key collision on the first insert.
  // Reseeding the sequence needs SQL access this script does not have.
  const { data: highest, error: highestError } = await supabase
    .from("graduation_requirement")
    .select("req_id")
    .order("req_id", { ascending: false })
    .limit(1);
  if (highestError) {
    console.error("✗ Could not read the highest req_id:", highestError.message);
    process.exit(1);
  }
  let nextReqId = (highest?.[0]?.req_id ?? 0) + 1;

  let inserted = 0;
  let updated = 0;

  for (const row of REQUIREMENTS) {
    const payload = { major_id: major.major_id, ...row };
    const found = byCode.get(row.requirement_code);
    console.log(`  ${found ? "~" : "+"} ${row.requirement_code.padEnd(17)}${String(row.target_value).padStart(4)} ${row.unit || ""}`);
    if (!apply) {
      found ? updated++ : inserted++;
      continue;
    }
    if (found) {
      const { error } = await supabase.from("graduation_requirement").update(payload).eq("req_id", found.req_id);
      if (error) { console.error(`      ✗ ${error.message}`); process.exit(1); }
      updated++;
    } else {
      const { error } = await supabase
        .from("graduation_requirement")
        .insert({ req_id: nextReqId++, ...payload });
      if (error) { console.error(`      ✗ ${error.message}`); process.exit(1); }
      inserted++;
    }
  }

  console.log(
    `\n  ${inserted} new, ${updated} updated` + (apply ? "" : "  — DRY RUN, nothing written. Re-run with --apply."),
  );
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
