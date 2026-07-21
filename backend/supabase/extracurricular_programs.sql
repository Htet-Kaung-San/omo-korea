-- Extracurricular programs — manual Supabase catalog
--
-- Core columns: program_id, name, category, deadline, source_url, description
-- (run extracurricular_program_descriptions.sql to add description)
--
-- Enter rows in Table Editor. App ranks open programs for the student.

-- Open programs: deadline still valid through tomorrow (or no deadline).
-- Order: sooner deadline first. Tag ranking is done in the backend AI engine
-- using category text vs student interests.
create or replace function recommended_programs(user_tags text[], result_limit int default 20)
returns setof extracurricular_program
language sql
stable
as $$
  select p.*
  from extracurricular_program p
  where p.deadline is null
     or p.deadline >= (current_date + 1)
  order by
    p.deadline asc nulls last,
    p.program_id asc
  limit result_limit;
$$;

-- Example row:
-- insert into extracurricular_program (name, category, deadline, source_url, description)
-- values (
--   '자기소개서 1:1 클리닉',
--   'Career',
--   current_date + 14,
--   'https://www.pusan.ac.kr/...',
--   '1:1 이력서 클리닉. 사전 신청 필요.'
-- );
