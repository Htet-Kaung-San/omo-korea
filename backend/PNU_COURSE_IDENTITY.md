# PNU Course and Offering Identity Draft

Phase 3 remains a local, read-only design and matching exercise. Neither SQL
draft is applied, the workbook is not imported, and the matching script never
writes to Supabase.

## Smallest safe structure

`course` remains the permanent, major-scoped subject record. The draft adds a
nullable `official_course_number` alongside the existing `course_id`,
`course_name`, `credit`, `major_id`, and `category`. It never replaces or
derives the production primary key.

The Phase 3 SELECT-only production check returned 1,875 course rows. The live
identity fields are `course_id`, `course_name`, `credit`, `major_id`, and
`category`; there is currently no official-number column.

`course_offering` represents one official academic-year, semester, subject
number, and section. It stores the linked `course_id`, official course number,
professor, year level, theory/practical hours, schedule, classroom,
remote-course status, official original-language code, mapped teaching
language, source URL, and retrieval time. Optional source fields are nullable;
`NULL` means unknown.

Teaching language belongs to `course_offering`, because PNU designates it on a
specific offering and it can vary by term, section, or professor. The separate
`course_metadata` draft now references `course_offering_id` and retains only
syllabus-derived assessment fields. This avoids duplicating term identity and
teaching language.

The official number is repeated on `course_offering` deliberately: production
courses do not yet have a safe backfill, and the source number is required to
make `(academic_year, semester, official_course_number, section)` idempotent.

## Uniqueness decision

The reviewed 2026-1 snapshot contains 4,427 offerings and 2,691 official
course numbers. There are no duplicate
`(academic_year, semester, official_course_number, section)` records and no
number with conflicting course name, credit, or canonical category.

However, four official numbers appear under multiple managing departments.
The production `course` model is major-scoped, so the snapshot does not prove
that `course.official_course_number` is globally one-to-one. The draft creates
a partial lookup index but no uniqueness constraint on that course column.
Offering identity is protected by both the official term/section key and the
linked course term/section key.

Both draft tables enable RLS and define no anonymous or authenticated-client
policies. They are backend-only by default.

## Deterministic matching

Run from `backend/` after the official local snapshot exists:

```bash
npm run match:pnu-course-offerings -- --year 2026 --semester 1
```

The script performs paginated SELECT-only reads of production `course`, reads
the two local datasets, and writes only to the gitignored
`data/local/pnu-course-matches/` directory.

Targets with an official number would be matched by that number first. Current
production and both local target datasets have no such field. The fallback is
therefore intentionally narrow:

1. exact NFKC/whitespace-normalized course name, exact numeric credit, and
   exact reviewed category must identify one curriculum row;
2. that curriculum row supplies the existing production major ID;
3. the same major, exact normalized name, credit, and category must identify
   exactly one target row;
4. one target row must not be claimed by multiple official numbers.

Multiple candidates or competing official numbers are ambiguous. Missing
candidates are unmatched. Fuzzy names never establish identity. The
engineering workbook's local `course_id` column is discarded before matching;
only confirmed Phase 1 major mappings are eligible.

## 2026-1 dry-run result

- production exact official-number matches: 0;
- deterministic production backfill candidates: 1,590;
- ambiguous production identities: 270;
- unmatched production identities: 831;
- production courses left untouched: 285;
- official offerings linkable after those reviewed backfills: 1,909;
- explicitly English-designated linkable offerings: 161;
- deterministic curriculum candidates: 1,590;
- ambiguous curriculum records: 270;
- unmatched curriculum records: 831;
- deterministic engineering workbook matches: 0;
- ambiguous engineering identities: 270;
- unmatched engineering identities: 2,421.

These are dry-run candidates, not an authorization to update production. The
ignored JSON report contains every candidate and every untouched production
course ID for review.

Phase 4 performs an independent current-production review of these candidates.
See `PNU_COURSE_PHASE4.md` for its stricter gate, application feature flag, and
updated dry-run result.

## Remaining uncertainties and blockers

- A second official term is required before considering any global uniqueness
  rule for official numbers across time.
- The four cross-department official numbers require a reviewed rule for the
  existing major-scoped course model.
- The 270 curriculum ambiguities must remain unresolved until a reviewed major
  or other official identifier distinguishes them.
- Classroom is not a separate structured source column in the reviewed XLSX.
  The parser preserves the combined timetable/classroom value in `schedule`
  and leaves `classroom` null rather than guessing how to split free text.
- Syllabus transport and structured syllabus extraction remain unresolved, so
  presentation, project, assignment, and exam metadata stay null.
- No executable importer or database backfill exists in Phase 3.
