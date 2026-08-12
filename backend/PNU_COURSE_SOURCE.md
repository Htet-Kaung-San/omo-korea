# PNU Course Source Prototype

> Historical pre-application source investigation. The reviewed 2026-2
> packages were applied later; current facts are in the production runbook.

Phase 2 investigates official, public PNU course data without importing it or
changing recommendation scoring. The prototype performs public GET requests
only and writes a local JSON snapshot under the gitignored
`data/local/pnu-course-offerings/` directory.

## Sources and access constraints

The live Student Support System course catalog is public at:

`https://onestop.pusan.ac.kr/page?menuCD=000000000000335`

Its published page script submits searches to
`/ost/cls/atlectmanual/atlectmanual/selectAtlectManual_v2025`. That request is
an encrypted, CSRF-protected anonymous-session POST. A direct GET is not a
supported catalog API and returned HTTP 500 during this audit. The prototype
does not emulate or bypass that request.

PNU also publishes a term-specific course-offering XLSX as a public attachment
to an official Student Support System notice. The reviewed 2026-1 source page
is:

`https://onestop.pusan.ac.kr/page?menuCD=000000000000386&mode=DETAIL&seq=1964`

The script GETs that notice, discovers the official attachment link by its
reviewed attachment name, then GETs and parses the workbook. No term is
defaulted. Only 2026-1 is configured because no stable official index or URL
rule has yet been verified for other terms.

Run from `backend/`:

```bash
npm run fetch:pnu-course-offerings -- --year 2026 --semester 1
```

Unsupported terms fail instead of guessing a notice or attachment URL.
Each GET has a 15-second timeout and up to two retries for network failures,
HTTP 429, or HTTP 5xx responses. Requests are separated by at least 750 ms.
These are transport defaults only; academic year and semester never default.

The dynamic page's published request fields include `SCH_SYEAR`,
`SCH_TERM_GCD`, `SCH_COURSE_COLL_GRAD_GCD`, `SCH_COLL_GRAD_GCD`,
`SCH_GRAD_GCD`, `SCH_COLL_CD`, `SCH_DEPT_CD`, `SEARCH_GBN`,
`SCH_SUBJ_GBN`, `SCH_DETAIL`, `SCH_SUBJ_NM`, `SCH_PNU_CAPBLTY_GCD`, and
`SCH_NATIVE_LANG_LECT_GCD`, plus paging fields. Its helper wraps those values
in encrypted `_data`, sends JSON with `AJAX: true` and an anonymous-session
CSRF header, and receives a JSON envelope containing `statusCode`, `data`, and
`pageInfo`.

## Official offering fields

The 2026-1 XLSX contains structured columns for managing college, department,
year level, official course number, section, course name, course category,
credits, theory hours, practical hours, timetable/classroom, professor,
general-education area, original-language designation, team teaching,
remote-course status, enrollment limit, and remarks.

The public catalog page additionally renders these response fields:
`MNG_DEPT_NM`, `ALL_CYBER`, `NATIVE_LANG_NM`, `STDT_YEAR_NM`,
`SUBJ_GCD_NM`, `SUBJ_NM`, `SUBJ_NO`, `CLASS_NO`, `CRDT`, `SIGAN`,
`PROF_NM`, and `TIMETABLE_SUMMARY_INFO`. It conditionally exposes Korean and
English syllabus buttons through `PRT_KOR` and `PRT_ENG`, but does not expose a
stable GET syllabus URL or standalone syllabus identifier.

## Original-language identification

PNU's official rule is: `E` English, `C` Chinese, `J` Japanese, `F` French,
`G` German, and `R` Russian. The reviewed XLSX uses the corresponding exact
Korean labels in its structured `원어강의` column. The prototype maps only
those exact labels or official codes. It never uses the course title.

A blank source value remains `null`; it is not converted to Korean or to
`false`. `isEnglishTaught` is true only for `E`, false only for another
explicit original-language code, and null when the source designation is
absent or unrecognized.

## Syllabus metadata

The official PNU syllabus form has structured sections for `수업방식`
(Methodology of Instruction) and `평가방법` (Evaluation and Grading). Published
PNU syllabus examples show structured teaching-method choices such as lecture,
discussion, experiment/practice, online, presentation, seminar,
research/project, and design. Evaluation choices include attendance, midterm,
final, assignment, quiz, presentation, report, practical, and other, with
weights. The weekly plan has free-text lecture content plus assignment, design,
and experiment content.

- Presentation: structured teaching/evaluation choice when completed; details
  may also be free text.
- Assignment: structured evaluation choice/weight; weekly details are free
  text.
- Exams: structured midterm/final evaluation choices/weights; dates or formats
  may be free text in the weekly plan or evaluation requirements.
- Laboratory/practical work: structured experiment/practice teaching choice,
  structured practical assessment choice, numeric practical hours, and
  possibly free-text weekly details.
- Group project: no confirmed dedicated group-project field. The
  research/project choice does not prove that work is performed in groups.

These values can vary by academic year, semester, section, and professor. The
catalog exposes syllabus buttons publicly when a syllabus is available, but
the report transport is POST-based and no stable public GET document contract
was verified. The prototype therefore leaves presentation, group project,
assignment, exam, and syllabus identifier/URL fields null. It does not classify
free text.

## Identifier matching audit

The official XLSX provides `교과목번호` plus `분반`, which is a safe offering
identity only together with academic year and semester. Current production
`course` rows contain only `course_id`, `course_name`, `credit`, `major_id`,
`category`, and schedule fields. The 1,785-row
`curriculum-courses-2026-1.json` and the 639-row engineering workbook also omit
official course numbers.

Phase 3 adds a local deterministic matching audit. Current targets still have
no official-number field, so there are zero exact identifier links. A record
may be proposed for backfill only when exact normalized name, credit, category,
and a curriculum-bridged production major form a one-to-one match. Multiple
candidates and competing official numbers remain ambiguous. Fuzzy names are
never promoted to identity, and the engineering workbook's local row IDs are
discarded before matching. See `PNU_COURSE_IDENTITY.md` for the dry-run totals.

## Next implementation step

Review every Phase 3 backfill candidate and resolve the cross-department and
ambiguous identities. This was the historical gate before a separately
reviewed phase applied exact identities. It is not an instruction to rerun the
retained migration or application RPC.
