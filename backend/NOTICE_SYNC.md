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

A reasonable starting cadence is every six hours. The scraper reads recent
PNU International and CSE board pages, and the shared persistence service
updates rows by `source_url` or inserts new rows. The database unique index on
non-null `source_url` remains the final duplicate guard.

Actual scheduling must be configured in the production deployment platform,
which is not identified in this repository. Do not run the job using an
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
