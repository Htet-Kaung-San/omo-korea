# PNU 2026-2 syllabus metadata

The reviewed package was applied manually by Tuvshinjargal03 before 2026-08-11
KST: 7 additional CSE offering identities and 9 metadata rows. The feature flag
remains disabled. The RPC is retained for audit/recovery and must not be invoked
again casually.

This phase uses exactly nine official PNU syllabus PDFs supplied under
`data/source/2026-2/syllabi`. The PDF directory is ignored and must remain
untracked. The reviewed filenames, SHA-256 values, evidence summaries, and
nullable metadata are pinned in
`config/pnu-course-metadata-2026-2.json`.

The manifest SHA-256 is:

`288ff7569cff5494e029b12f14aeddd174bbb7083926984b70a3c159bfaaf051`

## Evidence rules

- `null` means the syllabus did not reliably state the value.
- `NONE` and `false` are never substitutes for unknown evidence.
- Course names are descriptive only. Identity is the exact combination of
  official course number, academic year 2026, semester 2, and section 059.
- The missing tenth syllabus is not referenced or inferred.
- Presentation, group-project, assignment, and exam information are not
  derived from course names.

## Production identity review

The initial read-only production review on 2026-08-05 found two exact offerings,
which remain unchanged:

- `CB1501022|2026|2|059` - eligible
- `CB2001125|2026|2|059` - eligible

The seven initially absent offerings were subsequently resolved to existing
permanent courses. The reviewed mapping is pinned in
`config/pnu-course-metadata-resolutions-2026-2.json` with SHA-256:

`977bcca97a1f885c35faa9bf63c9102a707f10877fcc8faf5c0d0b7e2ec6aab2`

Every row is a `SAFE EXISTING COURSE MATCH`:

- `CB1501019|2026|2|059` -> production course `66`
- `CB2001103|2026|2|059` -> production course `75`
- `CB2001105|2026|2|059` -> production course `77`
- `CB2001106|2026|2|059` -> production course `78`
- `CB1501024|2026|2|059` -> production course `88`
- `CB2001111|2026|2|059` -> production course `86`
- `CB2001610|2026|2|059` -> production course `87`

The official workbook managing department is `컴퓨터공학전공`. The current
production major is exactly major `8`, `Computer Science and Engineering`, in
the `ICE Department`. Each production title is an exact bilingual combination
of the official Korean workbook title and the official syllabus English title;
credit and category also match. The official number is currently null on all
seven courses, no target official number is assigned elsewhere, and no target
offering exists. Same-name Artificial Intelligence candidates are excluded by
major. The 2026-1 curriculum JSON has no exact Korean row for six subjects; its
two `데이터베이스` rows belong to Industrial Engineering and Data Science and
are excluded by the official managing major. No fuzzy match or workbook row ID
is used.

No permanent course must be created. Assigning official numbers and inserting
offerings does not add a recommendation candidate and therefore does not change
the candidate pool or scoring.

## Dry-run procedure

Run from `backend`:

```powershell
npm run dry-run:pnu-course-metadata
```

The command supports no `--apply` mode. It reads production courses, the major,
offerings, and existing metadata; verifies the local offering snapshot and every
PDF checksum; rejects drift, competing official numbers, cross-course offering
conflicts, and duplicate manifest identities; and writes only an ignored local
report under `data/local/pnu-course-metadata-dry-run/`. A passing report has 9
eligible rows: 2 existing exact offerings plus 7 planned exact offerings.

## Reviewed application method

`supabase/course_metadata_application_rpc.sql` defines a protected,
service-role-only function. Applying the SQL file only installs the function;
it does not call it or write metadata. The function:

- pins the reviewed manifest checksum;
- pins the reviewed seven-course resolution checksum;
- preserves the two existing exact offerings unchanged;
- validates all seven permanent course names, credits, categories, and major IDs
  before assigning official numbers;
- inserts exactly seven reviewed offering rows when absent;
- aborts on drift, competing official numbers, cross-course conflicts, or
  conflicting existing offering values;
- requires all nine exact term/section offerings before metadata insertion;
- aborts instead of overwriting conflicting existing metadata;
- inserts the nine reviewed rows into `course_metadata` when absent;
- preserves all reviewed null values;
- is idempotent when identical rows already exist;
- creates no public client policy.

Historically, invocation required separate production approval. Any recovery
or re-application now requires a new approval and both exact checksums.

## Application behavior

Course metadata is fetched only when the existing course-offering feature flag
is enabled. Query failure leaves metadata unknown and does not fail course
recommendations. The recommendation engine and ordering rules are unchanged.
The frontend hides all null metadata. It shows presentation only when REQUIRED
or OPTIONAL, shows group-project and assignment labels only for explicit enum
values, and shows exam/evaluation text only when nonblank.
