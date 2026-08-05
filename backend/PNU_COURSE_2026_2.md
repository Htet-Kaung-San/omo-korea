# PNU 2026-2 reviewed course package

The official offering workbook contains 4,275 section rows and 2,599 permanent
subject numbers. The separate restriction workbook contains 1,225 raw restriction
rows and 37 exception rows. Key-based deduplication preserves 1,196 unique rules
and records duplicate source counts; the safely linked subset is 18 unique rules
plus 2 exceptions. Both source workbooks and every generated report are
local and gitignored. No parser or review command writes to Supabase.

The reviewed production match accepts only official-number identity already
reviewed for an earlier term or deterministic one-to-one equality on reviewed
major, normalized exact course name, credit, and canonical category. Workbook
row numbers and fuzzy names are never identities. The result is 57 safe course
number assignments and 82 linked offering rows. Another 94 subjects are
ambiguous, 2,448 are unmatched, and the 3 official numbers seen under multiple
managing departments are excluded. Thirteen linked offerings are explicitly
English; the full source has 349 explicit English offerings.

Language is derived only from the official `원어강의` value. Blank stays null;
`영어` maps to `E`/`ENGLISH`/true, while C/J/F/G/R languages map to OTHER/false.
No title-based inference is used. Presentation, group-project, assignment, and
exam values remain null because neither workbook is a syllabus source.

Restrictions remain structured rows, not a course-level boolean. The supported
source rule types are department, year, domestic/foreign status, nationality,
curriculum year, and completed semesters. Free-text reasons and all 37 exception
texts are preserved. A rule may yield definite ineligibility only when both the
student attribute and a single atomic structured condition are present and
equal. Compound, range, missing, or free-text-only conditions yield UNKNOWN and
must not exclude a recommendation. Restriction evaluation is not wired into
recommendation scoring in this phase.

The source contains two completely identical linked entries for `OM2002685`
section `064` at workbook rows 300 and 301. The reviewed dataset preserves one
rule with `duplicateSourceCount: 2`; duplicate source entries never become
duplicate database identities or inflate verification counts.

The original identity/offering and metadata migrations remain valid. If already
installed and verified, they should not be rerun. The new additive
`course_offering_2026_2_extensions.sql` is required before the regenerated RPC;
it adds enrollment limit, team-teaching, remarks, general-education area, and a
backend-only RLS restriction table. It creates no public policies and performs
no data writes. The feature flag remains `ENABLE_COURSE_OFFERINGS=false` until a
controlled application and postflight verification succeed.
