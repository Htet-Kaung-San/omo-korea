-- Per-student completion status for non-credit graduation milestones.
-- The major-level catalog remains in graduation_requirement.

create table if not exists public.student_graduation_requirement (
  student_id integer not null
    references public.student(student_id) on delete cascade,
  req_id integer not null
    references public.graduation_requirement(req_id) on delete cascade,
  status varchar(50) not null default 'Not Started'
    check (status in ('Not Started', 'In Progress', 'Completed')),
  current_value numeric,
  updated_at timestamptz not null default now(),
  primary key (student_id, req_id)
);

create index if not exists idx_student_graduation_requirement_student
  on public.student_graduation_requirement (student_id);

-- This table is accessed through authenticated backend endpoints. The
-- backend secret key bypasses RLS; no direct anonymous policy is required.
alter table public.student_graduation_requirement enable row level security;
