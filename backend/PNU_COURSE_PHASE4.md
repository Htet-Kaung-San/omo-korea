# Phase 4 Course-Offering Application Foundation

> Historical pre-application record for the 2026-1 candidate set. The reviewed
> 2026-2 packages were applied later; do not use the counts below as current
> production instructions.

The Phase 4 tooling remains local and read-only. It did not apply either SQL
definition, change production data, or add an executable apply mode; later
reviewed application tooling performed the recorded 2026-2 production work.

## Strict candidate review

The Phase 3 deterministic set is treated only as an input candidate list. The
Phase 4 dry run re-reads current production courses and independently requires:

- one official number and one production course per candidate;
- exact NFKC/whitespace-normalized name;
- exact numeric credit and canonical category;
- the reviewed production major ID;
- no competing official number for the production course;
- no cross-department identity conflict; and
- no current production drift from the matching-report snapshot.

Run from `backend/`:

```bash
npm run dry-run:pnu-course-backfill -- --year 2026 --semester 1
```

The script performs SELECT-only production reads and writes only to
`data/local/pnu-course-backfill-dry-run/`, which is gitignored. It contains no
apply mode or database mutation method.

The reviewed 2026-1 result is:

- input candidates: 1,590;
- strictly approved: 1,590;
- rejected: 0;
- ambiguous: 0;
- changed production records: 0;
- proposed official-number assignments: 1,590;
- proposed offering rows: 1,909;
- proposed explicitly English offering rows: 161.

These remain proposals requiring human review and a separately approved
migration/backfill phase.

## Migration sequence

The review sequence is intentionally split without duplicated definitions:

1. `supabase/course_identity_and_offerings.sql` adds the nullable course
   official number and creates `course_offering`.
2. `supabase/course_metadata.sql` creates syllabus metadata linked by
   `course_offering_id`.

Both tables enable RLS and define no public policies. No course primary key is
changed, no data statement is present, and the course official number remains
non-unique because the current major-scoped identity question is unresolved.

## Backend feature gate

Offering reads are disabled unless all of the following are deliberately set:

```text
ENABLE_COURSE_OFFERINGS=true
COURSE_OFFERING_ACADEMIC_YEAR=2026
COURSE_OFFERING_SEMESTER=1
```

`COURSE_OFFERING_SECTION` is optional. Without a requested section, metadata is
attached only when one offering exists for a course in the selected term. This
prevents an arbitrary section from supplying language or professor data.

When disabled, incomplete, or unable to read the not-yet-created table, the API
returns the existing recommendations with every offering field set to `null`.
It does not fail the request. Language is true only for explicit English,
false only for explicit non-English evidence, and null when unknown.

## Frontend behavior

The Recommended Courses page conditionally displays:

- `English-taught` only for `isEnglishTaught === true`;
- a named official language for an explicit non-English code;
- no language badge when status is unknown;
- professor, schedule, term/section, and remote status only when present.

Presentation, project, assignment, and exam indicators are absent. Offering
metadata is not used by recommendation scoring.

