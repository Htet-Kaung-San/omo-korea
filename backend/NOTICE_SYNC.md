# Production notice synchronization

Notice synchronization is intentionally not scheduled inside the Express
process. The deployment platform should invoke the existing command:

```bash
cd backend
npm run seed:notices
```

The job requires `SUPABASE_URL` and `SUPABASE_KEY` with permission to read and
write the production `notice` table. It also requires outbound HTTPS access to
the configured PNU notice boards.

The tracked `.github/workflows/sync-notices.yml` workflow runs every 15 minutes
and also supports deliberate manual dispatch. The scraper reads notices from
five official, publicly accessible sources: PNU main notices, the public
One-Stop login-page notice panel, PNU International, CSE, and the Dormitory.
It does not authenticate or access protected One-Stop pages. One unavailable
source does not discard notices collected from the other sources; the run fails
only when every configured source fails. Results use a 30-day lookback and are
deduplicated by `source_url` before the shared persistence service updates or
inserts rows. The database unique index on non-null `source_url` remains the
final duplicate guard.

For an existing `source_url`, synchronization preserves a richer stored title
or body when a board list supplies only a shorter summary. Rows with no material
field change are left untouched, including `scraped_at`; board timestamps on the
same calendar date are treated as equivalent.

The authenticated frontend uses one shared notice feed. It refetches every 60
seconds while the page is visible and immediately when a hidden tab becomes
visible again. This is near-real-time polling: the PNU boards do not expose a
push feed, so freshness is bounded by the scheduler plus frontend intervals.
Production builds always use the real API. Mock mode remains available only for
explicit local/test use with `VITE_API_MODE=mock`; it is never an automatic
runtime fallback.

Scheduled execution begins only after the workflow is merged into the default
branch and both repository secrets are configured. Do not run the job using an
in-process timer. The protected admin endpoint
`POST /api/students/notices/sync` remains available for deliberate manual
operations.

Only one scheduled notice synchronization job should run at a time. The
service's in-process lock protects concurrent calls within one Node process
only. The unique `source_url` index and `23505` conflict recovery prevent
database duplicates, but they do not prevent multiple application instances
from scraping simultaneously. Multi-instance deployments should configure
scheduler concurrency to `1` or provide a deployment-level or distributed
lock.
