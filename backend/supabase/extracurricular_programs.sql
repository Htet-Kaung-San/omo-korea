-- Extracurricular program scrape → Claude → publish pipeline
-- Run in Supabase SQL editor.
--
-- Existing table on this project: extracurricular_program
-- Assumed base columns (do not drop/recreate): program_id, name, category, deadline
-- This file creates notice_sources + raw_announcements, extends extracurricular_program,
-- and adds recommended_programs() RPC. It does NOT create a profiles table.

-- ============================================================
-- 1. Sources to monitor (one row per department/board you scrape)
-- ============================================================
create table if not exists notice_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- e.g. '학생처 취업전략과 공지사항'
  department text,                       -- e.g. '학생처'
  list_url text not null,                -- board list page
  base_url text not null,                -- e.g. https://www.pusan.ac.kr
  parser_key text not null default 'pnu_cms_board',
  active boolean not null default true,
  last_scraped_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. Raw announcements (before LLM extraction)
-- ============================================================
create table if not exists raw_announcements (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references notice_sources(id) on delete cascade,
  source_url text not null unique,       -- dedupe key
  title text,
  raw_text text,                         -- body text fed to the LLM
  fetched_at timestamptz not null default now(),
  llm_processed boolean not null default false,
  llm_extraction jsonb,
  is_extracurricular boolean,
  process_error text
);

create index if not exists idx_raw_announcements_unprocessed
  on raw_announcements (llm_processed) where llm_processed = false;

-- ============================================================
-- 3. Extend EXISTING extracurricular_program (do not recreate)
-- ============================================================
alter table extracurricular_program
  add column if not exists raw_announcement_id uuid references raw_announcements(id),
  add column if not exists description text,
  add column if not exists host_department text,
  add column if not exists interest_tags text[] not null default '{}',
  add column if not exists apply_start date,
  add column if not exists program_start date,
  add column if not exists program_end date,
  add column if not exists mileage_points int,
  add column if not exists source_url text,           -- original notice post (required for published)
  add column if not exists external_apply_url text,  -- separate apply link when different
  add column if not exists status text not null default 'pending_review',
  add column if not exists reviewed_by text,         -- student_id / admin id (not uuid profiles)
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Keep every existing row unpublished until source_url is backfilled.
-- (New column default already sets pending_review; this makes the intent explicit.)
update extracurricular_program
set status = 'pending_review'
where source_url is null
  and status is distinct from 'pending_review';

-- Optional later, once every published row has a real announcement URL:
--   alter table extracurricular_program alter column source_url set not null;

create index if not exists idx_extracurricular_program_tags
  on extracurricular_program using gin (interest_tags);

create index if not exists idx_extracurricular_program_status_deadline
  on extracurricular_program (status, deadline);

-- ============================================================
-- 4. Student interest tags (app uses `student`, not `profiles`)
-- ============================================================
alter table student
  add column if not exists interest_tags text[] not null default '{}';

-- ============================================================
-- 5. Seed one public notice board (idempotent on list_url)
-- ============================================================
insert into notice_sources (name, department, list_url, base_url, parser_key)
select
  '학생처 취업전략과 공지사항',
  '학생처',
  'https://www.pusan.ac.kr/kor/CMS/Board/Board.do?mCode=MN095&mode=list&mgr_seq=3',
  'https://www.pusan.ac.kr',
  'pnu_cms_board'
where not exists (
  select 1 from notice_sources
  where list_url = 'https://www.pusan.ac.kr/kor/CMS/Board/Board.do?mCode=MN095&mode=list&mgr_seq=3'
);

-- ============================================================
-- 6. Recommendation RPC — published only, tag overlap then deadline
-- ============================================================
create or replace function recommended_programs(user_tags text[], result_limit int default 20)
returns setof extracurricular_program
language sql
stable
as $$
  select p.*
  from extracurricular_program p
  where p.status = 'published'
    and p.source_url is not null
    and (p.deadline is null or p.deadline >= current_date)
  order by
    cardinality(array(select unnest(p.interest_tags) intersect select unnest(user_tags))) desc,
    p.deadline asc nulls last
  limit result_limit;
$$;

-- Usage (supabase-js):
-- const { data } = await supabase.rpc('recommended_programs', {
--   user_tags: ['career', 'it_coding'],
--   result_limit: 20,
-- });
