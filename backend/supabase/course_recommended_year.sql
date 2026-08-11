-- Adds the recommended year level to the course catalog.
--
-- Why: backend/ai/courseRecommendationEngine.js scores a "year" signal worth up
-- to 18 points, but the live `course` table has no year column at all, so
-- getCourseYear() returns null for every one of the 1,875 rows and the signal
-- can never fire. The observable effect is that a 1st-year and a 4th-year
-- student in the same major receive an identical recommendation list — a
-- first-year is currently recommended Capstone Design.
--
-- The column name is chosen to match what the code already reads:
-- mapCourseRow (ai/supabaseDataRepository.js:126) resolves
-- `recommended_year ?? course_year ?? year`, and getCourseYear
-- (ai/courseRecommendationEngine.js:69) reads it back off both the mapped
-- field and `raw`. So no application code needs to change for this to take
-- effect — only the data.
--
-- Semantics: 1-6 is the year level the course is intended for. NULL means no
-- year restriction, which is how the source catalog's 전학년 ("all years") rows
-- are represented — 1,012 of 4,427 rows. NULL is deliberately not 0: the
-- engine's `!courseYear` guard treats absent as "no signal" rather than
-- "year zero", which is the behaviour we want for unrestricted courses.
--
-- Safe to run more than once. Additive only: no data is deleted or rewritten,
-- and nothing here cascades. Backfill separately with
--   python3 scripts/backfill-course-year.py
-- which UPDATEs in place rather than re-seeding, so it cannot disturb the
-- course_offering / course_metadata rows that hang off course_id.

alter table public.course
  add column if not exists recommended_year smallint;

comment on column public.course.recommended_year is
  'Year level the course is intended for (1-6). NULL = no year restriction (전학년). Source: PNU 2026-1 개설강좌 일람표, column 학년.';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'course_recommended_year_check'
  ) then
    alter table public.course
      add constraint course_recommended_year_check
      check (recommended_year is null or recommended_year between 1 and 6);
  end if;
end $$;

-- Recommendations always filter by major first, so the useful index is the
-- composite one rather than a lone index on the year.
create index if not exists course_major_recommended_year_idx
  on public.course (major_id, recommended_year);
