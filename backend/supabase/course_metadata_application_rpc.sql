-- RETAINED APPLICATION RPC PLUS PROPOSED METADATA ROLLBACK DEFINITION. The
-- reviewed metadata package was already applied, but the rollback added below
-- is not confirmed installed in production. Do not invoke installed production
-- rollback functions. Installation requires separate schema-change approval.
--
-- The seven permanent courses below were matched without fuzzy names: the
-- official Korean title and syllabus English title form the exact production
-- bilingual title, and major, credit, and category are pinned for drift checks.

begin;

-- Remove the earlier one-checksum draft signature if it was installed during
-- review. Keeping both overloads would leave a stale two-row application path.
drop function if exists public.apply_reviewed_pnu_course_metadata_2026_2(text);

create or replace function public.apply_reviewed_pnu_course_metadata_2026_2(
  p_manifest_sha256 text,
  p_resolution_sha256 text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  expected_manifest_sha256 constant text :=
    '288ff7569cff5494e029b12f14aeddd174bbb7083926984b70a3c159bfaaf051';
  expected_resolution_sha256 constant text :=
    '977bcca97a1f885c35faa9bf63c9102a707f10877fcc8faf5c0d0b7e2ec6aab2';
  resolution_count integer;
  reviewed_count integer;
  exact_offering_count integer;
  assigned_count integer;
  inserted_offering_count integer;
  inserted_metadata_count integer;
begin
  if p_manifest_sha256 is distinct from expected_manifest_sha256 then
    raise exception 'metadata manifest checksum mismatch';
  end if;
  if p_resolution_sha256 is distinct from expected_resolution_sha256 then
    raise exception 'metadata resolution checksum mismatch';
  end if;

  create temporary table reviewed_course_resolution_2026_2 (
    course_id integer primary key,
    expected_course_name text not null,
    expected_credit numeric not null,
    expected_major_id integer not null,
    expected_category text not null,
    official_course_number text not null unique,
    academic_year smallint not null,
    semester text not null,
    section text not null,
    professor text null,
    year_level text null,
    theory_hours numeric null,
    practical_hours numeric null,
    schedule text null,
    classroom text null,
    remote_course_status text null,
    original_language_code text null,
    teaching_language text null,
    source_url text null,
    retrieved_at timestamptz null,
    enrollment_limit integer null,
    team_teaching_status text null,
    general_education_area text null,
    remarks text null,
    unique (academic_year, semester, official_course_number, section),
    unique (course_id, academic_year, semester, section)
  ) on commit drop;

  insert into reviewed_course_resolution_2026_2 values
    (66, 'Data Structures (자료구조)', 3, 8, 'REQUIRED', 'CB1501019', 2026, '2', '059', '이기준', '2학년', 3, 0, '월 16:30(75) 102-306, 수 16:30(75) 102-306', null, 'NOT_REMOTE', 'E', 'ENGLISH', null, '2026-08-04T16:08:54.546Z', 50, 'NOT_TEAM_TAUGHT', null, null),
    (75, 'AI Programming (AI프로그래밍)', 3, 8, 'ELECTIVE', 'CB2001103', 2026, '2', '059', '멘가라 멘가라 악셀 기드온', '2학년', 3, 0, '화 09:00(75) 102-307, 목 09:00(75) 102-307', null, 'NOT_REMOTE', 'E', 'ENGLISH', null, '2026-08-04T16:08:54.546Z', 50, 'NOT_TEAM_TAUGHT', null, null),
    (77, 'Web Application Programming (웹응용프로그래밍)', 3, 8, 'ELECTIVE', 'CB2001105', 2026, '2', '059', '최성기', '2학년', 3, 0, '월 10:30(75) 102-406, 수 10:30(75) 102-406', null, 'NOT_REMOTE', null, null, null, '2026-08-04T16:08:54.546Z', 50, 'NOT_TEAM_TAUGHT', null, null),
    (78, 'Platform-based Programming (플랫폼기반프로그래밍)', 3, 8, 'ELECTIVE', 'CB2001106', 2026, '2', '059', '탁성우', '2학년', 3, 0, '월 10:30(75) 102-309, 수 10:30(75) 102-309', null, 'NOT_REMOTE', null, null, null, '2026-08-04T16:08:54.546Z', 40, 'NOT_TEAM_TAUGHT', null, null),
    (88, 'Software Engineering (소프트웨어공학)', 3, 8, 'ELECTIVE', 'CB1501024', 2026, '2', '059', '염근혁', '3학년', 3, 0, '화 15:00(75) 102-406, 목 15:00(75) 102-406', null, 'NOT_REMOTE', null, null, null, '2026-08-04T16:08:54.546Z', 50, 'NOT_TEAM_TAUGHT', null, null),
    (86, 'Databases (데이터베이스)', 3, 8, 'ELECTIVE', 'CB2001111', 2026, '2', '059', '이기준', '3학년', 3, 0, '월 13:30(75) 102-306, 수 13:30(75) 102-306', null, 'NOT_REMOTE', null, null, null, '2026-08-04T16:08:54.546Z', 50, 'NOT_TEAM_TAUGHT', null, null),
    (87, 'Programming for Deep Learning (딥러닝프로그래밍)', 3, 8, 'ELECTIVE', 'CB2001610', 2026, '2', '059', '전상률', '3학년', 3, 0, '화 13:30(75) 102-307, 목 13:30(75) 102-307', null, 'NOT_REMOTE', null, null, null, '2026-08-04T16:08:54.546Z', 50, 'NOT_TEAM_TAUGHT', null, null);

  select count(*) into resolution_count from reviewed_course_resolution_2026_2;
  if resolution_count <> 7 then
    raise exception 'reviewed course resolution row count mismatch: %', resolution_count;
  end if;

  if exists (
    select 1
    from reviewed_course_resolution_2026_2 reviewed
    left join public.course course on course.course_id = reviewed.course_id
    where course.course_id is null
      or course.course_name is distinct from reviewed.expected_course_name
      or course.credit is distinct from reviewed.expected_credit
      or course.major_id is distinct from reviewed.expected_major_id
      or course.category is distinct from reviewed.expected_category
      or (course.official_course_number is not null
        and course.official_course_number is distinct from reviewed.official_course_number)
  ) then
    raise exception 'reviewed permanent course is missing or has drifted';
  end if;

  if exists (
    select 1
    from reviewed_course_resolution_2026_2 reviewed
    join public.course competing
      on competing.official_course_number = reviewed.official_course_number
      and competing.course_id <> reviewed.course_id
  ) then
    raise exception 'reviewed official number is assigned to a competing course';
  end if;

  if exists (
    select 1
    from reviewed_course_resolution_2026_2 reviewed
    join public.course_offering offering
      on offering.official_course_number = reviewed.official_course_number
      and offering.course_id <> reviewed.course_id
  ) then
    raise exception 'reviewed official number has a cross-course offering conflict';
  end if;

  if exists (
    select 1
    from reviewed_course_resolution_2026_2 reviewed
    join public.course_offering offering
      on offering.course_id = reviewed.course_id
      and offering.academic_year = reviewed.academic_year
      and offering.semester = reviewed.semester
      and offering.section = reviewed.section
      and offering.official_course_number <> reviewed.official_course_number
  ) then
    raise exception 'reviewed course term and section has a conflicting offering';
  end if;

  update public.course course
  set official_course_number = reviewed.official_course_number
  from reviewed_course_resolution_2026_2 reviewed
  where course.course_id = reviewed.course_id
    and course.official_course_number is null;
  get diagnostics assigned_count = row_count;

  insert into public.course_offering (
    course_id, official_course_number, academic_year, semester, section,
    professor, year_level, theory_hours, practical_hours, schedule, classroom,
    remote_course_status, original_language_code, teaching_language, source_url,
    retrieved_at, enrollment_limit, team_teaching_status,
    general_education_area, remarks
  )
  select
    course_id, official_course_number, academic_year, semester, section,
    professor, year_level, theory_hours, practical_hours, schedule, classroom,
    remote_course_status, original_language_code, teaching_language, source_url,
    retrieved_at, enrollment_limit, team_teaching_status,
    general_education_area, remarks
  from reviewed_course_resolution_2026_2
  on conflict (academic_year, semester, official_course_number, section) do nothing;
  get diagnostics inserted_offering_count = row_count;

  if exists (
    select 1
    from reviewed_course_resolution_2026_2 reviewed
    left join public.course_offering offering
      on offering.official_course_number = reviewed.official_course_number
      and offering.academic_year = reviewed.academic_year
      and offering.semester = reviewed.semester
      and offering.section = reviewed.section
    where offering.course_offering_id is null
      or offering.course_id is distinct from reviewed.course_id
      or offering.professor is distinct from reviewed.professor
      or offering.year_level is distinct from reviewed.year_level
      or offering.theory_hours is distinct from reviewed.theory_hours
      or offering.practical_hours is distinct from reviewed.practical_hours
      or offering.schedule is distinct from reviewed.schedule
      or offering.classroom is distinct from reviewed.classroom
      or offering.remote_course_status is distinct from reviewed.remote_course_status
      or offering.original_language_code is distinct from reviewed.original_language_code
      or offering.teaching_language is distinct from reviewed.teaching_language
      or offering.source_url is distinct from reviewed.source_url
      or offering.retrieved_at is distinct from reviewed.retrieved_at
      or offering.enrollment_limit is distinct from reviewed.enrollment_limit
      or offering.team_teaching_status is distinct from reviewed.team_teaching_status
      or offering.general_education_area is distinct from reviewed.general_education_area
      or offering.remarks is distinct from reviewed.remarks
  ) then
    raise exception 'existing or inserted offering conflicts with reviewed values';
  end if;

  create temporary table reviewed_course_metadata_2026_2 (
    official_course_number text not null,
    academic_year integer not null,
    semester text not null,
    section text not null,
    presentation_requirement text null,
    group_project_requirement text null,
    assignment_requirement text null,
    exam_information text null,
    verified_at timestamptz not null,
    primary key (official_course_number, academic_year, semester, section)
  ) on commit drop;

  insert into reviewed_course_metadata_2026_2 values
    ('CB1501019', 2026, '2', '059', null, null, null, 'Exams 90%', '2026-08-05T12:38:58.356Z'),
    ('CB1501022', 2026, '2', '059', null, null, 'REQUIRED', 'Midterm 40%; Final exam 40%; Assignment 15%', '2026-08-05T12:38:58.356Z'),
    ('CB2001103', 2026, '2', '059', 'REQUIRED', null, 'REQUIRED', 'Midterm 40%; Final exam 40%; Final project 15%', '2026-08-05T12:38:58.356Z'),
    ('CB2001105', 2026, '2', '059', null, null, 'REQUIRED', 'Midterm 30%; Final exam 35%; Assignment 25%', '2026-08-05T12:38:58.356Z'),
    ('CB2001106', 2026, '2', '059', null, null, 'REQUIRED', 'Midterm 40%; Final exam 40%; Homework 10%', '2026-08-05T12:38:58.356Z'),
    ('CB1501024', 2026, '2', '059', null, null, 'REQUIRED', 'Midterm 30%; Final exam 35%; Homework 25%', '2026-08-05T12:38:58.356Z'),
    ('CB2001111', 2026, '2', '059', null, null, null, null, '2026-08-05T12:38:58.356Z'),
    ('CB2001610', 2026, '2', '059', null, null, 'REQUIRED', 'Homework 70%; Final project 20%', '2026-08-05T12:38:58.356Z'),
    ('CB2001125', 2026, '2', '059', 'REQUIRED', 'REQUIRED', 'REQUIRED', 'Presentation and final work evaluation', '2026-08-05T12:38:58.356Z');

  select count(*) into reviewed_count from reviewed_course_metadata_2026_2;
  if reviewed_count <> 9 then
    raise exception 'reviewed metadata row count mismatch: %', reviewed_count;
  end if;

  select count(*) into exact_offering_count
  from reviewed_course_metadata_2026_2 reviewed
  join public.course_offering offering
    on offering.official_course_number = reviewed.official_course_number
    and offering.academic_year = reviewed.academic_year
    and offering.semester = reviewed.semester
    and offering.section = reviewed.section;
  if exact_offering_count <> reviewed_count then
    raise exception 'one or more reviewed course offerings are missing or ambiguous';
  end if;

  if exists (
    select 1
    from reviewed_course_metadata_2026_2 reviewed
    join public.course_offering offering
      on offering.official_course_number = reviewed.official_course_number
      and offering.academic_year = reviewed.academic_year
      and offering.semester = reviewed.semester
      and offering.section = reviewed.section
    join public.course_metadata existing
      on existing.course_offering_id = offering.course_offering_id
    where existing.presentation_requirement is distinct from reviewed.presentation_requirement
      or existing.group_project_requirement is distinct from reviewed.group_project_requirement
      or existing.assignment_requirement is distinct from reviewed.assignment_requirement
      or existing.exam_information is distinct from reviewed.exam_information
  ) then
    raise exception 'existing course metadata conflicts with the reviewed payload';
  end if;

  insert into public.course_metadata (
    course_offering_id, presentation_requirement, group_project_requirement,
    assignment_requirement, exam_information, practical_type, source_url,
    source_updated_at, verified_at
  )
  select
    offering.course_offering_id, reviewed.presentation_requirement,
    reviewed.group_project_requirement, reviewed.assignment_requirement,
    reviewed.exam_information, null, null, null, reviewed.verified_at
  from reviewed_course_metadata_2026_2 reviewed
  join public.course_offering offering
    on offering.official_course_number = reviewed.official_course_number
    and offering.academic_year = reviewed.academic_year
    and offering.semester = reviewed.semester
    and offering.section = reviewed.section
  on conflict (course_offering_id) do nothing;
  get diagnostics inserted_metadata_count = row_count;

  return jsonb_build_object(
    'manifestSha256', expected_manifest_sha256,
    'resolutionSha256', expected_resolution_sha256,
    'reviewedRows', reviewed_count,
    'resolvedCourses', resolution_count,
    'assignedOfficialNumbers', assigned_count,
    'insertedOfferings', inserted_offering_count,
    'exactOfferings', exact_offering_count,
    'insertedMetadataRows', inserted_metadata_count,
    'existingIdenticalMetadataRows', reviewed_count - inserted_metadata_count
  );
end
$function$;

revoke all on function public.apply_reviewed_pnu_course_metadata_2026_2(text, text)
  from public, anon, authenticated;
grant execute on function public.apply_reviewed_pnu_course_metadata_2026_2(text, text)
  to service_role;

create or replace function public.rollback_reviewed_pnu_course_metadata_2026_2(
  p_manifest_sha256 text,
  p_resolution_sha256 text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  expected_manifest_sha256 constant text := '288ff7569cff5494e029b12f14aeddd174bbb7083926984b70a3c159bfaaf051';
  expected_resolution_sha256 constant text := '977bcca97a1f885c35faa9bf63c9102a707f10877fcc8faf5c0d0b7e2ec6aab2';
  exact_metadata_count integer;
  exact_resolution_count integer;
  dependent_restriction_count integer;
  deleted_metadata_count integer;
  deleted_offering_count integer;
  restored_course_count integer;
begin
  if p_manifest_sha256 is distinct from expected_manifest_sha256 then raise exception 'metadata manifest checksum mismatch'; end if;
  if p_resolution_sha256 is distinct from expected_resolution_sha256 then raise exception 'metadata resolution checksum mismatch'; end if;

  create temporary table rollback_resolution_2026_2(course_id integer primary key, official_course_number text unique, academic_year smallint, semester text, section text) on commit drop;
  insert into rollback_resolution_2026_2 values
    (66, 'CB1501019', 2026, '2', '059'), (75, 'CB2001103', 2026, '2', '059'),
    (77, 'CB2001105', 2026, '2', '059'), (78, 'CB2001106', 2026, '2', '059'),
    (88, 'CB1501024', 2026, '2', '059'), (86, 'CB2001111', 2026, '2', '059'),
    (87, 'CB2001610', 2026, '2', '059');

  create temporary table rollback_metadata_2026_2(
    official_course_number text primary key, academic_year smallint, semester text, section text,
    presentation_requirement text, group_project_requirement text, assignment_requirement text,
    exam_information text, verified_at timestamptz
  ) on commit drop;
  insert into rollback_metadata_2026_2 values
    ('CB1501019', 2026, '2', '059', null, null, null, 'Exams 90%', '2026-08-05T12:38:58.356Z'),
    ('CB1501022', 2026, '2', '059', null, null, 'REQUIRED', 'Midterm 40%; Final exam 40%; Assignment 15%', '2026-08-05T12:38:58.356Z'),
    ('CB2001103', 2026, '2', '059', 'REQUIRED', null, 'REQUIRED', 'Midterm 40%; Final exam 40%; Final project 15%', '2026-08-05T12:38:58.356Z'),
    ('CB2001105', 2026, '2', '059', null, null, 'REQUIRED', 'Midterm 30%; Final exam 35%; Assignment 25%', '2026-08-05T12:38:58.356Z'),
    ('CB2001106', 2026, '2', '059', null, null, 'REQUIRED', 'Midterm 40%; Final exam 40%; Homework 10%', '2026-08-05T12:38:58.356Z'),
    ('CB1501024', 2026, '2', '059', null, null, 'REQUIRED', 'Midterm 30%; Final exam 35%; Homework 25%', '2026-08-05T12:38:58.356Z'),
    ('CB2001111', 2026, '2', '059', null, null, null, null, '2026-08-05T12:38:58.356Z'),
    ('CB2001610', 2026, '2', '059', null, null, 'REQUIRED', 'Homework 70%; Final project 20%', '2026-08-05T12:38:58.356Z'),
    ('CB2001125', 2026, '2', '059', 'REQUIRED', 'REQUIRED', 'REQUIRED', 'Presentation and final work evaluation', '2026-08-05T12:38:58.356Z');

  select count(*) into exact_resolution_count
  from rollback_resolution_2026_2 reviewed
  join public.course course on course.course_id = reviewed.course_id and course.official_course_number = reviewed.official_course_number
  join public.course_offering offering on offering.course_id = reviewed.course_id and offering.official_course_number = reviewed.official_course_number
    and offering.academic_year = reviewed.academic_year and offering.semester = reviewed.semester and offering.section = reviewed.section;
  if exact_resolution_count <> 7 then raise exception 'metadata rollback identity drift: expected 7 resolved offerings, found %', exact_resolution_count; end if;

  select count(*) into exact_metadata_count
  from rollback_metadata_2026_2 reviewed
  join public.course_offering offering on offering.official_course_number = reviewed.official_course_number
    and offering.academic_year = reviewed.academic_year and offering.semester = reviewed.semester and offering.section = reviewed.section
  join public.course_metadata metadata on metadata.course_offering_id = offering.course_offering_id
  where metadata.presentation_requirement is not distinct from reviewed.presentation_requirement
    and metadata.group_project_requirement is not distinct from reviewed.group_project_requirement
    and metadata.assignment_requirement is not distinct from reviewed.assignment_requirement
    and metadata.exam_information is not distinct from reviewed.exam_information
    and metadata.practical_type is null and metadata.source_url is null and metadata.source_updated_at is null
    and metadata.verified_at is not distinct from reviewed.verified_at;
  if exact_metadata_count <> 9 then raise exception 'metadata rollback drift: expected 9 exact metadata rows, found %', exact_metadata_count; end if;

  select count(*) into dependent_restriction_count
  from rollback_resolution_2026_2 reviewed
  join public.course_offering offering on offering.official_course_number = reviewed.official_course_number
    and offering.academic_year = reviewed.academic_year and offering.semester = reviewed.semester and offering.section = reviewed.section
  join public.course_offering_restriction restriction on restriction.course_offering_id = offering.course_offering_id;
  if dependent_restriction_count <> 0 then raise exception 'metadata rollback blocked by % unrelated restriction rows', dependent_restriction_count; end if;

  delete from public.course_metadata metadata
  using public.course_offering offering, rollback_metadata_2026_2 reviewed
  where metadata.course_offering_id = offering.course_offering_id
    and offering.official_course_number = reviewed.official_course_number
    and offering.academic_year = reviewed.academic_year and offering.semester = reviewed.semester and offering.section = reviewed.section;
  get diagnostics deleted_metadata_count = row_count;

  delete from public.course_offering offering using rollback_resolution_2026_2 reviewed
  where offering.course_id = reviewed.course_id and offering.official_course_number = reviewed.official_course_number
    and offering.academic_year = reviewed.academic_year and offering.semester = reviewed.semester and offering.section = reviewed.section;
  get diagnostics deleted_offering_count = row_count;

  update public.course course set official_course_number = null
  from rollback_resolution_2026_2 reviewed
  where course.course_id = reviewed.course_id and course.official_course_number = reviewed.official_course_number;
  get diagnostics restored_course_count = row_count;

  if deleted_metadata_count <> 9 or deleted_offering_count <> 7 or restored_course_count <> 7 then
    raise exception 'metadata rollback count failure: metadata %, offerings %, courses %', deleted_metadata_count, deleted_offering_count, restored_course_count;
  end if;
  return jsonb_build_object('rolledBack', true, 'deletedMetadataRows', deleted_metadata_count, 'deletedAdditionalOfferings', deleted_offering_count, 'restoredCourseOfficialNumbers', restored_course_count, 'manifestSha256', expected_manifest_sha256, 'resolutionSha256', expected_resolution_sha256);
end
$function$;

revoke all on function public.rollback_reviewed_pnu_course_metadata_2026_2(text, text)
  from public, anon, authenticated;
grant execute on function public.rollback_reviewed_pnu_course_metadata_2026_2(text, text)
  to service_role;

commit;

-- Do not include an invocation in this file. The function can be installed only
-- after separate approval; invoking it requires both exact checksums above.
