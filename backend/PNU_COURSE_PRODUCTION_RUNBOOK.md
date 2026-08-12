# Controlled PNU Course Production Runbook

## Current production status

The reviewed 2026-2 base and CSE metadata packages were applied manually by
Tuvshinjargal03 before 2026-08-11 KST. Evidence supports no more precise
timestamp. Verified production state after application is:

- 1,875 `course` rows; 64 have `official_course_number` populated;
- 89 `course_offering` rows (82 base plus 7 metadata-package additions);
- 9 `course_metadata` rows;
- 20 restriction/exception rows;
- immutable course fields unchanged.

`ENABLE_COURSE_OFFERINGS` remains false or missing in deployed production.
Application RPCs must not be invoked again casually. The application migrations
and package writes are complete. The corrected rollback definitions in this
branch are proposed recovery code and are not confirmed installed in production.
Do not invoke the currently installed production rollback functions: their
semantics predate the complete ordered rollback described below.

## Reviewed artifacts

- base application dataset SHA-256: `6a363904829faa41c2e32c331f0967ffd4481cfefbb1422aa0eaab94a6d4a650`;
- metadata manifest SHA-256: `288ff7569cff5494e029b12f14aeddd174bbb7083926984b70a3c159bfaaf051`;
- metadata resolution SHA-256: `977bcca97a1f885c35faa9bf63c9102a707f10877fcc8faf5c0d0b7e2ec6aab2`;
- base package: 57 assignments, 82 offerings, 13 explicit-English offerings,
  18 restrictions plus 2 exceptions;
- exclusions: 94 ambiguous, 2,448 unmatched, 3 cross-department conflicts;
- metadata extension: major 8, section 059, 7 additional offering identities,
  and 9 syllabus metadata identities.

The ignored XLSX/PDF originals and generated reports remain local. The tracked
`config/pnu-course-provenance-2026-2.json` records the normalized review facts
and source hashes used by hermetic tests.

## Controlled operation checklist

These steps are for a separately approved recovery or re-application; they do
not authorize another production write.

## Step 1: Confirm state and exact checksums

Compare current read-only counts and all three checksums with the reviewed
artifacts above. Stop on any difference.

## Step 2: Take and verify a restorable backup

Back up `course` and every dependent offering, metadata, and restriction table.
Record counts and prove the restore destination before proceeding.

## Step 3: Inspect retained definitions

Confirm schema, constraints, RLS, policies, and service-role-only grants. Do not
blindly rerun an already-installed migration. Installing the corrected rollback
definitions is a separate production schema change requiring explicit approval;
this runbook does not authorize it.

## Step 4: Run checksum-bound preflight only

Use dry-run mode first. Require immutable course fields, reviewed identities,
uniqueness, and expected counts to pass without mutation.

## Step 5: Verify reviewed invariants

Require the exact package counts, preserve unknown values as null, and confirm
that no unrelated course or offering identity changed.

## Step 6: Run backend and frontend smoke tests

Verify recommendation ordering, completed/enrolled exclusion, deterministic
ties, language badges, section selection, and nullable metadata display.

## Step 7: Roll back metadata package first if approved

Use both metadata checksums and require exactly 9 metadata rows, 7 offerings,
and 7 assignments to be handled atomically.

## Step 8: Roll back base package second if approved

Use the base dataset checksum and require exactly 20 restriction/exception
rows, 82 offerings, and 57 assignments to be handled atomically.

## Step 9: Decide exposure or recovery

Keep the feature flag disabled unless a separate deployment review approves
exposure. On drift, stop writes and recover from the verified backup.

## Re-application safety

Before any approved recovery or re-application, take a restorable backup and
run the checksum, schema, RLS, immutable-course, identity, and count preflights.
Stop on any drift. Never substitute a regenerated package under the reviewed
checksum. Do not expose service-role RPCs through routes or frontend code.

The legacy `npm run seed:courses` command deletes and rebuilds course rows by
major. It now fails before its first delete when any offering row or reviewed
official-course-number assignment exists. There is deliberately no force flag;
use an identity-preserving reviewed migration instead.

## Ordered complete rollback

A complete rollback is split into two atomic, checksum-protected operations.
The definitions must first be reviewed, tested in a disposable database, and
installed through a separately approved schema change. Only then may a rollback
be separately approved and executed in this order:

1. Invoke `rollback_reviewed_pnu_course_metadata_2026_2` with both exact
   metadata checksums. It verifies and deletes exactly 9 metadata rows, then
   exactly 7 metadata-added offerings, then restores exactly 7 course official
   numbers. It refuses unexpected restriction dependencies or identity drift.
2. Invoke `rollback_reviewed_pnu_course_package` with the exact base dataset and
   checksum. It refuses to proceed while reviewed metadata remains, explicitly
   deletes exactly 20 reviewed restriction/exception rows, deletes exactly 82
   base offerings, and restores exactly 57 packaged course values.

Both functions fail atomically on count or identity drift. They target reviewed
keys only and do not drop schema. Never reverse the order: base offering
deletion has cascading foreign keys, and the guard exists to prevent a cascade
from hiding metadata removal.

## Deployment exposure

Production data application does not enable product exposure. Keep
`ENABLE_COURSE_OFFERINGS=false` or missing until a separate deployment review
approves read-only API/UI smoke tests. If later enabled, pin academic year 2026
and semester 2 and repeat recommendation, language-badge, section-selection,
and metadata display checks.

Recommended PR title:
`feat(courses): add 2026-2 offering metadata and personalized recommendations`.
The recommendation engine is general; verified syllabus metadata currently
covers only the reviewed CSE subset described above.
