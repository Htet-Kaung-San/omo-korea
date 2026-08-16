-- Creates the `scholarship` table the API has always queried but which has
-- never existed in the database.
--
-- Why: GET /api/students/scholarships (getAllScholarships,
-- controllers/studentController.js:517) does `.from("scholarship")` and returns
-- 500 with "Could not find the table 'public.scholarship' in the schema cache".
-- Four screens call it — HomePage, NotificationsPage, ScholarshipsPage and
-- ScholarshipDetailPage — so two whole routes are dead and the home page stacks
-- red error toasts over the bottom navigation.
--
-- The table was never dropped; it was never created. There is no scholarship
-- DDL anywhere in this repo's history, and nothing in the two .sql files PR #26
-- deleted (database_restructure.sql, graduation_requirement_updates.sql)
-- mentions scholarships either.
--
-- Column names are chosen so no application code has to change.
-- mapScholarshipRow (studentController.js:114) already resolves each field
-- through a chain of aliases; the first name in each chain is used here:
--   title       <- name
--   description <- description
--   eligibility <- eligibility
--   amount / provider / category / tag are read directly
--   id          <- scholarship_id
-- getAllScholarships also orders by `deadline`, so that column must exist.
--
-- `deadline` is deliberately nullable and seeded NULL. The source pages state
-- no application deadline for these three scholarships, and inventing one would
-- put a fabricated date in front of a student deciding when to apply. The UI
-- already handles it: an empty deadline renders as "Open" rather than a date.
-- Postgres orders NULLs last on ASC, so dated scholarships added later will
-- sort ahead of the undated ones without any code change.

create table if not exists public.scholarship (
  scholarship_id bigint generated always as identity primary key,
  name text not null,
  description text,
  eligibility text,
  amount text,
  provider text not null default 'PNU International Office',
  -- Matches ScholarshipCategory in frontend/src/types/api.ts.
  category text check (category in ('department', 'international', 'government', 'other')),
  tag text,
  deadline date,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lets the seed script be re-run without creating duplicates.
create unique index if not exists scholarship_name_uidx
  on public.scholarship (name);

create index if not exists scholarship_deadline_idx
  on public.scholarship (deadline);

-- The scholarship_application table applyForScholarship (studentController.js:551)
-- inserts into. Created here too so the apply button is not the next thing to
-- fail with a missing-table error once the list finally renders.
create table if not exists public.scholarship_application (
  application_id bigint generated always as identity primary key,
  scholarship_id bigint not null references public.scholarship (scholarship_id) on delete cascade,
  student_id text not null,
  status text not null default 'Submitted',
  applied_at timestamptz not null default now()
);

-- One application per student per scholarship.
create unique index if not exists scholarship_application_unique_idx
  on public.scholarship_application (scholarship_id, student_id);
