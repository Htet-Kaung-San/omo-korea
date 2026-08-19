/**
 * Puts PNU's graduation regulations into the knowledge base.
 *
 * Source: 부산대학교 졸업논문 등에 관한 시행세칙, dated 2026-01-15, committed at
 * backend/data/source/graduation-regulations/20260115_graduation_thesis_regulations.txt
 * with the tables recovered separately via hwp5html.
 *
 * These summaries are written from the Korean source, not machine-translated,
 * and the reasoning is the same as for the extracurricular programmes: the
 * source is a legal document whose tables carry the substance, and an
 * extraction that flattens them produces text that reads fluently and says
 * nothing. Getting a graduation requirement wrong is not a UI bug.
 *
 * Every document names the article or appendix it came from, states the
 * revision date, and routes doubt to 국제처, following WorkPermitPage.
 *
 * The per-department TOEIC table (별표 2, ~120 rows, versioned across four
 * intake years) is deliberately NOT flattened into prose. A student needs
 * their own department's number, and a document listing 120 of them would
 * retrieve for everyone and answer no one — those figures belong in
 * graduation_requirement per major, which is where the AI major's 700 now sits.
 *
 *   node scripts/ingest-graduation-regulations.mjs           # dry run
 *   node scripts/ingest-graduation-regulations.mjs --apply
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

const CATEGORY = "Graduation";
const SOURCE = "Source: 부산대학교 졸업논문 등에 관한 시행세칙, revised 2026-01-15. Confirm with the PNU International Affairs Office (국제처) before relying on it for a graduation decision.";

const DOCS = [
  {
    title: "Graduation — International Students Have a Language Requirement (외국인 유학생 어학 졸업요건)",
    content:
      "Credits alone are not enough to graduate from PNU. International students must also meet a language requirement, set out in 별표 2-1 of the graduation regulations, and a student who has earned every credit can still fail to graduate without it. " +
      "For most departments that requirement is Korean, and there are two routes: TOPIK, or completing the Korean course at PNU's own Language Education Institute (언어교육원) — the course must be completed AFTER you enrol, not before. " +
      "Three groups are treated differently and should not follow the general rule. 경영학과 (Business Administration), for intakes from March 2022 (March 2024 for transfer students), requires a higher TOPIK level, and 별표 2-1 lists TOPIK alone for it — the 언어교육원 route is not offered to 경영학과, so completing that course instead of sitting TOPIK will not satisfy the requirement. 국제학부 (Division of International Studies) is measured on English tests rather than Korean. And international students admitted from September 2025 (September 2027 for transfers) onto a PNU dual-degree programme with an overseas university on the English track have no TOPIK requirement at all and follow their own department's English standard instead. " +
      "The exact level you need depends on your department, your admission year, and whether you entered as a first-year or a transfer student (편입학생) — the regulation states every rule twice, once for each entry route, with the transfer date exactly two years later. Misreading the freshman column as your own matters most if you entered within two years of one of the table's cut-off dates. Earlier intakes are governed by older rows that are still in force for them. " +
      "Because of that, do not take a level from a classmate. Ask the PNU International Affairs Office (국제처) or your department office for the row of 별표 2-1 that matches your own admission year and entry route, and get it in writing. " +
      "Three practical points that apply whichever row you fall under. You pay your own test fees. If you are graduating, your score must reach your department by 10 January for a first-half graduation or 10 July for a second-half one, moving to the next day if that falls on a Saturday or public holiday — students not yet graduating may submit at any time. And 제11조 requires every graduation requirement to be satisfied by three weeks before your final semester's graduation assessment report date (졸업사정 결과보고일); that date is set per semester, so ask your department which deadline binds you first. " +
      "If TOPIK is cancelled for your semester because of a disaster or an epidemic and you are due to graduate, the university may accept a substitute Korean test run by its Language Education Institute; the Institute sets those details separately, so confirm rather than assume. " +
      "Reference: 제8조, 제11조, 별표 2-1. " + SOURCE,
  },
  {
    title: "Graduation — Korean Courses Required if You Entered with Low TOPIK (한국어 교과목 이수)",
    content:
      "International students who entered as first-year students from the second semester of 2015 onward, holding a low TOPIK level at admission, must take Korean language courses as part of their degree. " +
      "Students admitted with TOPIK Level 2 or below take four Korean courses across their first four semesters; students admitted with TOPIK Level 3 take two. Which courses those are depends on when the course is offered, not on when you were admitted: courses offered from the second semester of 2017 onward are 기초한국어Ⅰ·Ⅱ and 중급한국어Ⅰ·Ⅱ at 3 credits each on an absolute grading scale, while those offered between the second semester of 2015 and the first semester of 2017 were 기본한국어 and 대학한국어 at 4 credits each graded S/U. They count as 일반선택 (general electives) either way. " +
      "Five groups are named in the regulation as not having to take these courses: students admitted to 국제학부, transfer students (편입학생), students who reach TOPIK Level 4 or higher after admission, students who complete level 4 or above at PNU's Language Education Institute after admission, and international students on a dual-degree English-track programme with an overseas university. The regulation also reserves the right to set the detailed rules for exempt students separately, so confirm your own exemption with your department rather than assuming it applies automatically. " +
      "Note that these courses and the language level you need in order to graduate are two different rules. Reaching TOPIK Level 4 after admission can satisfy both at once for most departments, but being excused from the coursework does not by itself mean you have met the graduation requirement — check both. " +
      "Reference: 제2조 제5항·제6항, 별표 2-2. " + SOURCE,
  },
  {
    title: "Graduation — Requirements Beyond Credits (학점 이외의 졸업요건)",
    content:
      "PNU departments may impose graduation requirements that are not credits. The regulation names a graduation thesis (졸업논문), a laboratory or practical report (실험실습보고서), a practical presentation (실기발표), a comprehensive graduation examination (졸업종합시험), a standard foreign language test score, and recognised certifications — and the list is open rather than closed, since a dean may impose other requirements with the president's prior approval. " +
      "One restriction applies: a department may not impose more than one of thesis, laboratory report, practical presentation and comprehensive examination at the same time. That restriction covers only those four. Departments routinely require several requirements of different kinds together — a language score alongside volunteer hours, or a thesis alongside a reading requirement — so do not read the restriction as a promise that you face only one thing. " +
      "Which requirements apply to you is listed per department in 별표 1. Each row carries its own effective date, and most of those dates are keyed to a graduation date rather than an admission year — so the question is usually when you graduate, not when you enrolled. At least one department applies a change retroactively to students already enrolled. 별표 1 also splits requirements between 심화전공 (intensive major) and 최소전공 (minimum major) students, whose requirements the regulation sets separately, so the same department can ask different things of the two. " +
      "Some departments also limit which certificates count — examples in 별표 1 include accepting only a qualification earned after admission, or one earned within two years of your graduation date. A score that looks valid can be rejected for being too old or earned too early. " +
      "The comprehensive graduation examination is passed with an average of 60 or above. Every requirement under these regulations must be satisfied by three weeks before your final semester's graduation assessment report date (졸업사정 결과보고일). " +
      "Because the details are per-department, differ between intensive and minimum majors, and are usually keyed to your graduation date, confirm your own requirement with your department office rather than assuming it matches another department's. " +
      "Reference: 제2조, 제7조, 제10조, 제11조, 별표 1. " + SOURCE,
  },
  {
    title: "Graduation — Thesis, Report and Presentation Rules (졸업논문 작성 및 심사)",
    content:
      "If your department requires a graduation thesis, the schedule begins well before your final semester. Your dean appoints a supervising professor two semesters before you graduate, and at least two examiners other than your supervisor no later than three weeks before the final examinations of your graduating semester. Both must be full-time faculty. A supervisor takes no more than 15 students. You must submit a thesis plan (논문작성계획서) one semester before graduation. " +
      "Formatting is fixed: A4 paper with 30mm margins on all four sides, written horizontally in portrait orientation with 160% line spacing, and the cover must name your supervising professor. The minimum length depends on your 계열: 인문사회계열 theses must be at least 20 매 and 자연계열 theses at least 10 매. The regulation does not define which 계열 a department belongs to, and the grouping does not follow the English translation of a department's name, so confirm yours with your department rather than guessing. " +
      "The thesis goes to your examiners no later than three weeks before the graduation assessment report date. It is judged pass or fail, and if the examiners do not agree the result is a fail. " +
      "The laboratory report track mirrors the same schedule — supervisor two semesters ahead, at least two full-time examiners, a plan one semester ahead, the same formatting, a minimum of 10 매, submission three weeks before the assessment report date, and the same pass-or-fail rule. " +
      "The practical presentation track follows the same schedule, with two differences: its examiners may include people who are not full-time faculty where necessary, and the presentation must be announced in advance, held publicly, and COMPLETED — not merely scheduled — by three weeks before the graduation assessment report date. " +
      "One exemption is written into 별표 1: students completing the 국제학부 double majors Global Studies Program or Korean East Asian Studies Program are exempt from the graduation thesis. Other exemptions, if any, are department-specific — ask your department office. " +
      "Reference: 제4조, 제5조, 제6조, 별표 1. " + SOURCE,
  },
];

async function main() {
  const { data: existing, error } = await supabase
    .from("kb_document")
    .select("id, title, content");
  if (error) {
    console.error("✗ Could not read kb_document:", error.message);
    process.exit(1);
  }
  const byTitle = new Map((existing || []).map((doc) => [doc.title, doc]));

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;

  for (const doc of DOCS) {
    const found = byTitle.get(doc.title);
    const payload = { category: CATEGORY, title: doc.title, content: doc.content };

    if (!found) {
      console.log(`  + ${doc.title}`);
      inserted++;
      if (apply) {
        const { error: insErr } = await supabase.from("kb_document").insert(payload);
        if (insErr) { console.error(`      ✗ ${insErr.message}`); process.exit(1); }
      }
    } else if (found.content !== doc.content) {
      console.log(`  ~ ${doc.title}`);
      updated++;
      if (apply) {
        const { error: updErr } = await supabase.from("kb_document").update(payload).eq("id", found.id);
        if (updErr) { console.error(`      ✗ ${updErr.message}`); process.exit(1); }
        await supabase.from("kb_chunk").delete().eq("document_id", found.id);
      }
    } else {
      unchanged++;
    }
  }

  console.log(
    `\n  ${inserted} new, ${updated} updated, ${unchanged} unchanged` +
      (apply ? "" : "  — DRY RUN, nothing written. Re-run with --apply."),
  );
  if (apply && (inserted || updated)) console.log("  Next: node scripts/embed-kb-documents.js");
}

main().catch((err) => { console.error("✗", err.message); process.exit(1); });
