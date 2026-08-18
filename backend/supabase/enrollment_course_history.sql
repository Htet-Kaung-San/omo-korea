-- ADDITIVE MIGRATION: review and apply before enabling grade/history editing.

begin;

alter table public.enrollment
  add column if not exists final_grade text null,
  add column if not exists credits_earned numeric(5,2) null;

-- A course can be taken again in a later term. Remove any legacy uniqueness
-- rule that allowed only one lifetime row per student/course, then enforce one
-- row per student/course/term instead.
do $retake_constraints$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.enrollment'::regclass
      and c.contype = 'u'
      and (
        select array_agg(a.attname order by a.attname)
        from unnest(c.conkey) as key(attnum)
        join pg_attribute a
          on a.attrelid = c.conrelid and a.attnum = key.attnum
      ) = array['course_id', 'student_id']::name[]
  loop
    execute format('alter table public.enrollment drop constraint %I', constraint_name);
  end loop;
end
$retake_constraints$;

create unique index if not exists enrollment_student_course_term_key
  on public.enrollment (student_id, course_id, semester);

do $migration_guard$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.enrollment'::regclass
      and conname = 'enrollment_final_grade_check'
  ) then
    alter table public.enrollment add constraint enrollment_final_grade_check
      check (final_grade is null or final_grade in (
        'A+', 'A0', 'B+', 'B0', 'C+', 'C0', 'D+', 'D0', 'F', 'P', 'NP', 'S', 'U'
      ));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.enrollment'::regclass
      and conname = 'enrollment_credits_earned_check'
  ) then
    alter table public.enrollment add constraint enrollment_credits_earned_check
      check (credits_earned is null or credits_earned >= 0);
  end if;
end
$migration_guard$;

comment on column public.enrollment.final_grade is
  'Student-entered completed-course grade; NULL means not recorded.';
comment on column public.enrollment.credits_earned is
  'Credits earned for a completed course; NULL means not recorded.';

create or replace function public.drop_student_course_plan(
  p_student_id integer,
  p_enrollment_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  target public.enrollment%rowtype;
  target_year integer;
  target_semester text;
begin
  select * into target
  from public.enrollment
  where enrollment_id = p_enrollment_id
    and student_id = p_student_id
  for update;

  if not found then
    raise exception 'course record not found';
  end if;

  if target.semester ~ '^\\d{4}-(Spring|Summer|Fall|Winter)$' then
    target_year := split_part(target.semester, '-', 1)::integer;
    target_semester := case split_part(target.semester, '-', 2)
      when 'Spring' then '1'
      when 'Fall' then '2'
      when 'Summer' then 'SUMMER'
      when 'Winter' then 'WINTER'
    end;

    delete from public.student_timetable_entry
    where student_id = p_student_id
      and course_id = target.course_id
      and academic_year = target_year
      and semester = target_semester;
  end if;

  delete from public.enrollment
  where enrollment_id = p_enrollment_id
    and student_id = p_student_id;

  return jsonb_build_object(
    'enrollmentId', p_enrollment_id,
    'courseId', target.course_id
  );
end
$function$;

revoke all on function public.drop_student_course_plan(integer, bigint) from public;
grant execute on function public.drop_student_course_plan(integer, bigint) to service_role;

commit;
