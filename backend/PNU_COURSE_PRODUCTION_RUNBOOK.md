# Controlled PNU Course Application Runbook

This is a staging-first operator procedure. It does not authorize a database
change and contains no credentials. No staging or production execution has
been performed. Keep `ENABLE_COURSE_OFFERINGS` disabled until Step 10.

## Reviewed package

- Term: `2026-2`
- Application dataset SHA-256:
  `93ae0386cef12717461c2ef24920a4a51b7dc1a867331b41f6dbb900adda35eb`
- Course official-number assignments: 57
- Course offering rows: 82
- Explicitly English linked offerings: 13
- Linked unique restriction rows: 18 plus 2 exception rows
- Excluded ambiguous subjects: 94
- Excluded unmatched subjects: 2,448
- Excluded cross-department official-number conflicts: 4

The dataset is local and gitignored. Archive it with the reviewed code and
checksum using the organization's approved artifact store before any staging
operation. Never substitute a regenerated dataset without a new review.

## Step 1: Archive the reviewed code and checksums

1. Commit, tag, or otherwise immutably archive the exact reviewed code without
   changing the dataset.
2. Archive the ignored application dataset separately.
3. Recalculate its checksum and require the exact value above.
4. Record the Phase 5 source, match, dry-run, and proposal checksums.
5. Assign an operator, independent reviewer, rollback owner, and maintenance
   window.

Stop if the code or any checksum differs from the reviewed package.

## Step 2: Back up production data

1. Keep `ENABLE_COURSE_OFFERINGS` disabled.
2. Export the schema and data for `public.course` and every table referencing
   it.
3. If the offering tables already exist, export `course_offering` and
   `course_metadata` as well.
4. Record row counts and a checksum for the course export.
5. Confirm the restore destination and procedure with the rollback owner.

Do not continue without a restorable backup.

## Step 3: Apply migrations in staging

Apply, in order, through the approved staging migration process:

1. `supabase/course_identity_and_offerings.sql`
2. `supabase/course_metadata.sql`
3. `supabase/course_offering_2026_2_extensions.sql`

If the first two migrations are already installed and their drift guards pass,
do not rerun them. Apply only the additive third migration. No migration contains
course data or a backfill.
3. `supabase/course_application_rpc.sql`

Verify every transaction committed. Confirm the nullable course column,
tables, columns, named constraints, cascading foreign keys, indexes, and RLS.
Confirm there are no policies on the offering tables and that application RPC
execution is revoked from `PUBLIC`, `anon`, and `authenticated` and granted
only to `service_role`.

## Step 4: Run the package in staging

1. Configure service-role credentials only in the protected backend operator
   environment.
2. Run `apply:pnu-course-package` without `--apply` first, supplying the exact
   reviewed checksum. It must report `DRY_RUN` and all preflight gates passing.
3. Obtain explicit staging approval.
4. Set `COURSE_BACKFILL_APPROVED=true` only for the controlled operator
   process.
5. Run the same command with `--apply` and the reviewed checksum.

`--apply` without the approval variable must fail. The approval variable
without `--apply` remains a dry-run. Do not expose the operator environment to
the frontend or an HTTP handler.

## Step 5: Verify staging counts and invariants

Require all of the following:

- production-equivalent course count is 1,875;
- exactly 57 reviewed courses have their expected official number;
- exactly 82 reviewed offering identities exist;
- exactly 13 linked offerings have code `E` and language `ENGLISH`;
- exactly 20 reviewed restriction/exception rows exist;
- null original-language values remain null;
- no name, credit, category, major, or `course_id` changed;
- ambiguous, unmatched, and cross-department exclusions remain untouched;
- both offering uniqueness constraints have zero violations;
- RLS remains enabled and no public policies exist.

Preserve the generated local result report with the staging evidence.

## Step 6: Run staging smoke tests

Run the complete backend and frontend test matrix, then verify with approved
staging accounts:

- recommendation ordering is unchanged;
- explicit English and non-English badges use only official evidence;
- null-language and missing-offering courses show no language badge;
- professor, schedule, and remote status appear only when populated;
- multiple sections do not select an arbitrary offering;
- presentation, project, assignment, and exam indicators remain absent.

Do not describe staging as verified until these tests have actually run.

## Step 7: Test rollback in staging

1. Keep the feature flag disabled.
2. Run the package with `--rollback` but without `--apply`; require a dry-run.
3. Obtain explicit rollback-test approval.
4. With `COURSE_BACKFILL_APPROVED=true`, run `--rollback --apply` using the
   exact reviewed checksum.
5. Require exactly 82 reviewed offerings removed and exactly 57 reviewed
   course official-number values restored to their packaged previous values.
6. Verify unrelated rows and all other course fields are unchanged.

The rollback RPC does not drop tables or columns. Any count mismatch raises an
exception and rolls back the entire RPC transaction.

## Step 8: Repeat production preflight and checksums

Immediately before production:

1. Recalculate every archived checksum.
2. Re-run the application CLI in default dry-run mode against production.
3. Require all schema, RLS, policy, course-count, uniqueness, checksum, and
   drift gates to pass.
4. Confirm all 57 current production rows still match their expected name,
   credit, category, and major.
5. Stop for any changed, missing, conflicting, duplicated, or ambiguous row.

## Step 9: Apply to production after explicit approval

After the named approver signs the exact checksum and preflight report:

1. Restrict `COURSE_BACKFILL_APPROVED=true` to the operator process.
2. Run the application command with `--apply` and the reviewed checksum.
3. Preserve its result report and database logs.
4. Repeat all Step 5 invariants before proceeding.

The CLI invokes one server-side PostgreSQL function. PostgreSQL executes that
function atomically; any raised validation exception rolls back its course and
offering changes together.

## Step 10: Enable the feature only after verification

Only after successful production postflight and smoke tests, set:

```text
ENABLE_COURSE_OFFERINGS=true
COURSE_OFFERING_ACADEMIC_YEAR=2026
COURSE_OFFERING_SEMESTER=2
```

Set `COURSE_OFFERING_SECTION` only when intentionally displaying one reviewed
section. Redeploy through the normal controlled process and repeat the read-only
API/UI smoke tests.

## Production rollback decision

On any failure, first disable `ENABLE_COURSE_OFFERINGS` and redeploy. Preserve
logs and stop further writes. If the package fully applied and rollback is
approved, use the checksum-bound rollback operation described in Step 7. It
deletes only the 82 reviewed offering identities and restores only the 57
packaged course values. It never drops tables. If rollback preflight or counts
fail, stop and restore from the Step 2 backup through the approved recovery
process.
