# Phase 6 Auditable 2026-2 Application Package

This document records the reviewed package and its application history. The
pre-application procedure was staging-first and dry-run by default. The package
was subsequently applied manually to production by Tuvshinjargal03 before
2026-08-11 KST. The feature flag remains disabled.

## Reviewed 2026-2 boundary

Dataset SHA-256:
`6a363904829faa41c2e32c331f0967ffd4481cfefbb1422aa0eaab94a6d4a650`

- 1,875 production course rows checked;
- 57 official-number assignments;
- 82 base offering rows;
- 13 explicitly English linked offerings;
- 18 restriction rows plus 2 exception rows;
- 94 ambiguous subjects excluded;
- 2,448 unmatched subjects excluded;
- 3 cross-department official-number conflicts excluded.

The former 1,590 / 1,909 / 161 values described an earlier 2026-1 candidate
package and are not valid 2026-2 operational counts.

## Safeguards and retained definitions

`scripts/apply-pnu-course-package.mjs` defaults to dry-run and requires the
reviewed checksum. A write additionally requires `--apply` and
`COURSE_BACKFILL_APPROVED=true`. The retained SQL definitions verify schema,
constraints, RLS, policy exposure, immutable course fields, identities, and
counts. RPC execution is revoked from public, anonymous, and authenticated
roles and granted only to `service_role`.

These controls describe recovery/reapplication behavior; they do not authorize
another production invocation.

## Production result and rollback

The later reviewed CSE metadata application added 7 offerings and 9 metadata
rows, producing 89 offerings and 9 metadata rows in production while leaving
1,875 course rows unchanged and bringing populated official numbers to 64.

The proposed corrected rollback is intentionally split: metadata first
(9 metadata, 7 offerings, 7 assignments), then base (20 restrictions/exceptions,
82 offerings, 57 assignments). These corrected definitions are not confirmed
installed in production and must be tested and deployed only through a separate
approved schema change. Do not invoke the older installed production rollback.
See `PNU_COURSE_PRODUCTION_RUNBOOK.md` for the required order.
