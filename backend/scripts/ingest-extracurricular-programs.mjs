/**
 * Put PNU's 비교과 (extracurricular) programs into the knowledge base.
 *
 * The extracurricular_program table holds 7 rows, but only 2 of them existed as
 * kb_document rows, so the assistant answered "what programs can I join?" with
 * a single programme and no way for the student to know the list was partial.
 *
 * The summaries below are WRITTEN, not generated, and that is deliberate. The
 * source rows are Korean, and several are unusable as embedding input as they
 * stand: one is a raw HTML <table>, several are stepwise portal instructions
 * that describe how to upload a certificate rather than what the programme is,
 * and one has a description consisting only of its own title. Embedding them
 * verbatim would put Korean portal boilerplate into an index built from English
 * guides, and would ground answers in text that does not describe the thing
 * being asked about.
 *
 * Each entry keeps the Korean name so a student can find the programme on
 * my.pusan.ac.kr, and states eligibility explicitly — 수학교육과 Power Up is
 * open only to first-year Mathematics Education students, and an assistant that
 * did not say so would be recommending it to everyone.
 *
 * Dates come from the body text, not from the `deadline` column, which is not
 * trustworthy: the PNU Buddy row is dated 2027-01-08 while its own description
 * says applications closed on 2026-07-22. Every entry points at its source URL
 * so the student can check the live schedule, which is the same discipline
 * WorkPermitPage follows.
 *
 * If you change a summary, re-read the Korean source first. Telling a student
 * the wrong eligibility or the wrong deadline is a real problem, not a UI one.
 *
 *   node scripts/ingest-extracurricular-programs.mjs           # dry run
 *   node scripts/ingest-extracurricular-programs.mjs --apply   # write
 *
 * Then embed: node scripts/embed-kb-documents.js
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

const PORTAL = "PNU Student Competency Support System (학생역량지원시스템, my.pusan.ac.kr)";

/**
 * program_id 1 (PNU Buddy 프로그램) is deliberately absent: "PNU Buddy Program"
 * is already a kb_document, and a second copy would put two competing
 * descriptions of one programme into retrieval.
 */
const DOCS = [
  {
    programId: 2,
    title: "Writing Tutoring (글쓰기 튜터링)",
    content:
      "Writing Tutoring (글쓰기 튜터링) is a PNU academic-support programme. Tutors teach the basics of writing — planning, structure and method — and then guide students through a writing assignment of three to four A4 pages. Applications are made through the " +
      PORTAL +
      " under 비교과 프로그램. Check the portal listing for the current term's schedule and closing date. Source: https://my.pusan.ac.kr/ko/extracurricular/eco2/all",
  },
  {
    programId: 3,
    title: "Global Manners and Communication (글로벌 매너와 커뮤니케이션)",
    content:
      "Global Manners and Communication (글로벌 매너와 커뮤니케이션) is an online cultural-education programme at PNU. Students watch the course video, capture a screen showing the course name, their own name and their completion rate, and attach that capture to their application on the " +
      PORTAL +
      ". Staff confirm the capture before completion is recorded. A certificate is issued only after the programme period ends. Completion is not granted, and no 마일리지 (mileage points) are awarded, if the required evidence is missing. Source: https://my.pusan.ac.kr/ko/extracurricular/eco2/all",
  },
  {
    programId: 4,
    title: "Intensive Korean Program (집중 한국어 과정)",
    content:
      "The Intensive Korean Program (집중 한국어 과정) is a PNU extracurricular Korean-language course. The programme is listed on the " +
      PORTAL +
      ", but no schedule, eligibility or application detail is recorded in PNU's own listing beyond the title, so those must be checked on the programme page before applying. Source: https://my.pusan.ac.kr/ko/extracurricular/eco2/all/view/24214",
  },
  {
    programId: 5,
    title: "Student Portfolio Competition (학생포트폴리오 경진대회)",
    content:
      "The 2026 Student Portfolio Competition (2026학년도 학생포트폴리오 경진대회) is open to undergraduates enrolled in the second semester of 2026. There are two divisions: Junior for 1st and 2nd year students, and Senior for 3rd and 4th year students. Applications close 5 October 2026 at 23:59; judging is mid-October, results are announced in early November, and the award ceremony is held during November. Entrants submit a 15-20 slide presentation, a summary printed from the " +
      PORTAL +
      ", a one-page infographic summary, and the application, pledge and ethics forms. Prizes total 7.8 million won: one grand prize of 1,000,000 won, two awards of 700,000 won, six of 400,000 won and ten of 300,000 won. Participants receive 10 비교과 마일리지 points and winners 20. Awards may not be given if entries do not meet the judging standard. Apply through the portal under 비교과 - 대회. Source: https://my.pusan.ac.kr/ko/extracurricular/eco2/all/view/24241",
  },
  {
    programId: 6,
    title: "Suicide Prevention Gatekeeper Training (생명지킴이 양성교육)",
    content:
      "Gatekeeper Training (생명지킴이 양성교육) is a suicide-prevention education programme run by the PNU counselling centre (효원상담원). It teaches students to recognise warning signs in the people around them and to connect those people with professional help — it is training in how to support someone else, not a crisis or counselling service. It is open to undergraduate and graduate students, including those on leave of absence. The second 2026 round runs from 1 August to 6 December 2026. The course takes about 60 minutes in total and can be taken at any time within that window; completing at least 90 percent counts as completion. Register through the " +
      PORTAL +
      " or take it on PLATO as the self-paced course '2026년 생명지킴이 양성교육'. Completion requires finishing the seeing, listening and speaking modules at 90 percent or more and submitting the satisfaction survey, and awards 1 비교과 마일리지 point to undergraduates. Students who completed the March-July round cannot take it again for points. Enquiries: 051-510-8117 or 051-510-3705. Source: https://my.pusan.ac.kr/ko/extracurricular/eco2/all/view/24255",
  },
  {
    programId: 7,
    title: "Mathematics Education Freshman Power Up Study Groups (수학교육과 신입생 Power Up 스터디)",
    content:
      "The Power Up Study Group scheme (수학교육과 신입생 Power Up 스터디 지원사업) is open ONLY to first-year students in the Department of Mathematics Education (수학교육과). Students in any other department are not eligible. Applicants must also meet PNU's scholarship regulations: a grade average of at least 2.5 out of 4.5 in the previous semester and at least the minimum 12 credits taken. Students form study teams of three to five and apply between 1 and 11 September 2026 through the " +
      PORTAL +
      "; the team leader applies first and shares the team name and password so every member can complete their own application, and uploads the activity plan. Selected teams run at least eight study sessions of two hours or more, ending 18 December, and record each session. Result reports are submitted in person to the department office between 1 and 22 December 2026. Teams that submit their report and complete the required surveys receive a scholarship, paid individually and sized according to how many students took part. Enquiries: Department of Mathematics Education office, 051-510-1622. Source: https://my.pusan.ac.kr/ko/extracurricular/eco2/all/view/24269",
  },
];

async function main() {
  const { data: existing, error } = await supabase
    .from("kb_document")
    .select("id, title, category");
  if (error) {
    console.error("✗ Could not read kb_document:", error.message);
    process.exit(1);
  }

  // Guard against drifting away from the source table: if a programme was added
  // or removed upstream, these hand-written summaries no longer cover it.
  const { data: rows, error: rowErr } = await supabase
    .from("extracurricular_program")
    .select("program_id, name");
  if (rowErr) {
    console.error("✗ Could not read extracurricular_program:", rowErr.message);
    process.exit(1);
  }
  const covered = new Set([...DOCS.map((d) => d.programId), 1]); // 1 = Buddy, already in the KB
  const uncovered = (rows || []).filter((r) => !covered.has(r.program_id));
  if (uncovered.length) {
    console.error(
      `✗ ${uncovered.length} programme(s) in extracurricular_program have no summary here:`,
    );
    uncovered.forEach((r) => console.error(`    [${r.program_id}] ${r.name}`));
    console.error("  Read the Korean source and add them before ingesting.");
    process.exit(1);
  }

  const byTitle = new Map((existing || []).map((d) => [d.title, d]));
  let inserted = 0;
  let updated = 0;
  let unchanged = 0;

  for (const doc of DOCS) {
    const found = byTitle.get(doc.title);
    const payload = { category: "Program", title: doc.title, content: doc.content };

    if (!found) {
      console.log(`  + ${doc.title}`);
      inserted++;
      if (apply) {
        const { error: insErr } = await supabase.from("kb_document").insert(payload);
        if (insErr) {
          console.error(`    ✗ insert failed: ${insErr.message}`);
          process.exit(1);
        }
      }
      continue;
    }

    const { data: current } = await supabase
      .from("kb_document")
      .select("content")
      .eq("id", found.id)
      .single();
    if (current?.content === doc.content) {
      unchanged++;
      continue;
    }

    console.log(`  ~ ${doc.title} (content changed)`);
    updated++;
    if (apply) {
      const { error: updErr } = await supabase
        .from("kb_document")
        .update(payload)
        .eq("id", found.id);
      if (updErr) {
        console.error(`    ✗ update failed: ${updErr.message}`);
        process.exit(1);
      }
      // Its old chunks describe the old text, so drop them and let
      // embed-kb-documents.js regenerate.
      await supabase.from("kb_chunk").delete().eq("document_id", found.id);
    }
  }

  console.log(
    `\n  ${inserted} new, ${updated} updated, ${unchanged} unchanged` +
      (apply ? "" : "  — DRY RUN, nothing written. Re-run with --apply."),
  );
  if (apply && (inserted || updated)) {
    console.log("  Next: node scripts/embed-kb-documents.js");
  }
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
