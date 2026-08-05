# Phase 6 Auditable Application Package

Phase 6 prepares a staging-first application package. Nothing in this phase
has been applied to Supabase. The local dataset and result reports are ignored
by Git; the reviewed checksum and counts are retained in
`config/pnu-course-application-manifest.json`.

## Reviewed identity boundary

The application dataset selects records only from the Phase 5 reviewed
proposal. A fresh SELECT-only course read contributes the expected current
course name, credit, category, and major used by the future drift gate; it does
not add candidates. Workbook row identifiers are prohibited.

Reviewed dataset SHA-256:
`93ae0386cef12717461c2ef24920a4a51b7dc1a867331b41f6dbb900adda35eb`

- 1,590 course official-number assignments
- 1,909 course offering rows
- 161 explicitly English offering rows
- 270 ambiguous subjects excluded
- 831 unmatched subjects excluded
- 4 cross-department official-number conflicts excluded

## Safeguards

`scripts/apply-pnu-course-package.mjs` defaults to dry-run. Every invocation
requires the independently reviewed dataset checksum. A write additionally
requires both `--apply` and `COURSE_BACKFILL_APPROVED=true`. Loading the
Supabase client is delayed until local argument, approval, and checksum checks
pass.

The future apply path rereads all production courses, rejects immutable-field
drift and official-number conflicts, runs a read-only database preflight, and
then invokes one server-side RPC. The RPC validates schema, constraints, RLS,
policies, counts, identities, language evidence, and existing rows before
updating only nullable `course.official_course_number` values and inserting
only reviewed offerings. Any exception rolls back the RPC transaction.

## Security boundary

The CLI is not imported by a controller or route and no frontend module can
invoke it. Credentials are provided only through the existing protected
backend environment. The SQL explicitly revokes RPC execution from `PUBLIC`,
`anon`, and `authenticated`, grants it only to `service_role`, and creates no
client policies.

## Rollback boundary

Rollback uses the same dataset and checksum gates. It requires all 1,909
reviewed offering identities to be present, deletes only those identities, and
restores only the 1,590 packaged previous official-number values. It verifies
the resulting counts in the same PostgreSQL transaction and never drops a
table or column. The feature flag must be disabled before rollback.
