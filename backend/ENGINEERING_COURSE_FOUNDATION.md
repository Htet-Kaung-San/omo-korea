# Engineering Course Foundation

Phase 1 is a local validation and schema-design foundation. It does not import
`data/engineering_courses.xlsx`, connect to Supabase, or change recommendation
scoring.

## Why the workbook cannot be imported directly

The workbook `course_id` values are local row identifiers. They are not PNU
subject identifiers and they overlap unrelated production primary keys. A future
import must discard them rather than insert or upsert them into
`course.course_id`.

The workbook `major_id` values are also local workbook identifiers. Only the
exact-name matches recorded in
`config/engineering-course-major-mapping.json` are approved. Unresolved entries
remain `null`; similar-looking department names are not enough to establish
identity.

The workbook also contains malformed names, exact duplicate names across
majors, and four 1.5-credit courses while the current production `course.credit`
column is an integer. These issues must be reviewed before an import design is
approved.

Run the read-only validator from `backend/`:

```bash
npm run validate:engineering-courses
```

The command reads the local ignored workbook and the reviewed mapping config.
It does not load environment variables, import the Supabase client, or perform
network/database operations.

The validator reports two independent results:

- `structureValid` checks only the expected sheets and required columns.
  Duplicate names and other review warnings do not make it false.
- `importSafe` requires every course to have an official production-safe course
  identifier, a confirmed production major mapping, and no other import blocker.

The default command is structure-only mode: it exits successfully when
`structureValid` is true while still printing `IMPORT BLOCKED`. Use
`npm run validate:engineering-courses -- --require-import-safe` when import
safety must be enforced; that mode exits non-zero while `importSafe` is false.
The current workbook can therefore pass structural validation while all 639
courses remain blocked: official course identifiers are absent, and five major
mappings are unresolved.

## Official identifiers still required

Before an importer is built, obtain an authoritative PNU subject/course code for
every row. If metadata is section-specific, also obtain the official offering or
class-section identifier for the academic year and semester. Those identifiers,
not English names or workbook row numbers, must be used for reconciliation and
idempotency.

Official confirmation is also required for the unresolved Architecture,
Electronics Engineering, Polymer Engineering, Ship and Ocean Engineering, and
Urban Planning and Engineering mappings.

## Source required for course metadata

The workbook and the existing curriculum JSON do not contain teaching or
assessment metadata. Populate teaching language on `course_offering`, and
populate the draft `course_metadata` assessment fields only from an
authoritative, term- and section-specific PNU syllabus or an official PNU API
or export that exposes equivalent fields.

Required evidence includes:

- official lecture/teaching language for English-taught status;
- syllabus teaching or assessment methods for presentations;
- syllabus activity and assessment details for group projects;
- syllabus assessment plans for assignments and workload;
- syllabus examination details for `exam_information`;
- official contact-hour or teaching-format data for laboratory/practical work.

Course names must never be used to infer these values. `NULL` means the source
does not provide reliable evidence. `NONE` is allowed only when the official
source explicitly states that the requirement is absent.

## Draft migration

`supabase/course_identity_and_offerings.sql` and
`supabase/course_metadata.sql` are review-only and are not referenced by any
npm script. The identity/offering draft must precede the metadata draft because
metadata now references `course_offering_id`. Teaching language belongs to the
offering; syllabus-only assessment fields remain in metadata. Applying either
file requires a separate approved database migration phase. Both drafts enable
row-level security and define no anonymous or authenticated client policies,
so the tables remain backend-only by default.
