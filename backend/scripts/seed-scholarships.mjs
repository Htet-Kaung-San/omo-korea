/**
 * Seed the three real PNU international-student scholarships.
 *
 *   npm run seed:scholarships -- --dry-run
 *   npm run seed:scholarships
 *
 * Run backend/supabase/scholarship.sql first — this script only inserts rows.
 *
 * Source
 * ------
 * Every field below comes from the knowledge-base documents already ingested
 * under the "Scholarship" category (kb_document ids 28-30), which were taken
 * from the PNU International Scholarships page:
 * https://international.pusan.ac.kr/international/15218/subview.do
 *
 * Nothing here is invented. In particular `deadline` is left NULL on all three:
 * the source states no application deadline, and a made-up date in front of a
 * student deciding when to apply is worse than no date. The UI renders an empty
 * deadline as "Open".
 *
 * Upserting on `name` keeps re-runs idempotent.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
  console.error("Configure real SUPABASE_URL / SUPABASE_KEY in backend/.env");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SOURCE_URL =
  "https://international.pusan.ac.kr/international/15218/subview.do";

const SCHOLARSHIPS = [
  {
    name: "PNU Scholarship for Undergraduate New/Transfer International Students",
    description:
      "For undergraduate international new and transfer students admitted through PNU international admissions. No separate application is needed — you are evaluated using the documents you already submitted with your admission. Paid as a tuition deduction.",
    eligibility:
      "Undergraduate international students admitted through PNU international admissions. The award level follows your TOPIK grade.",
    amount: "TOPIK Lv.6: full tuition · Lv.5: full tuition II · Lv.4: full tuition I",
    category: "international",
    tag: "No application needed",
    deadline: null,
    source_url: SOURCE_URL,
  },
  {
    name: "PNU Scholarship for Enrolled Undergraduate International Students",
    description:
      "For enrolled undergraduate international students with an excellent GPA who meet the qualification standards. General standards are TOPIK Lv.4 or above; students in the Department of Global Studies may instead present a recognised English score.",
    eligibility:
      "TOPIK Lv.4 or above (or a recognised English score for Global Studies). Not available if your previous GPA is below 2.5/4.5, your full tuition is already covered by another scholarship, you are in extra-semester status, you earned fewer than 12 credits in a semester, or you are under disciplinary action.",
    amount: "Full tuition · full tuition II · half tuition II · full tuition I",
    category: "international",
    tag: "GPA based",
    deadline: null,
    source_url: SOURCE_URL,
  },
  {
    name: "PNU TOPIK Scholarship for Enrolled International Students",
    description:
      "For enrolled students who reach TOPIK Lv.4 or higher after admission and improve their TOPIK level. Payable up to three times. Submit a copy of your official TOPIK report card to the PNU International Office; payment goes to the bank account registered in E-onestop.",
    eligibility:
      "Enrolled international students who obtain TOPIK Lv.4 or higher after admission and raise their level, with a GPA of at least 2.5/4.5.",
    amount: "KRW 400,000",
    category: "international",
    tag: "TOPIK improvement",
    deadline: null,
    source_url: SOURCE_URL,
  },
];

async function main() {
  // A head:true probe is not enough — PostgREST answers it without error even
  // when the table is absent, returning a null count. Only a real select
  // reports "Could not find the table 'public.scholarship'".
  const { error: probeError } = await supabase
    .from("scholarship")
    .select("scholarship_id")
    .limit(1);

  if (probeError) {
    console.error(
      `The scholarship table is not reachable: ${probeError.message}\n` +
        "Run backend/supabase/scholarship.sql in the Supabase SQL editor first.",
    );
    process.exit(1);
  }

  console.log(
    `${DRY_RUN ? "Would upsert" : "Upserting"} ${SCHOLARSHIPS.length} scholarships:`,
  );
  for (const s of SCHOLARSHIPS) {
    console.log(`  - ${s.name}`);
    console.log(`      amount: ${s.amount}`);
  }

  if (DRY_RUN) {
    console.log("\nDry run — nothing written.");
    return;
  }

  const { data, error } = await supabase
    .from("scholarship")
    .upsert(SCHOLARSHIPS, { onConflict: "name" })
    .select("scholarship_id, name");

  if (error) {
    console.error("\nSeeding failed:", error.message);
    process.exit(1);
  }

  console.log(`\nDone. ${data?.length ?? 0} rows upserted.`);
}

main().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
