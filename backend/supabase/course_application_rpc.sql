-- DRAFT CONTROLLED APPLICATION RPC. Do not apply automatically.
-- Apply only after all three course schema migrations pass in staging. This file
-- creates no HTTP route and grants execution only to the Supabase service_role.

begin;

create or replace function public.preflight_reviewed_pnu_course_package(
  p_package jsonb,
  p_expected_checksum text
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_dataset jsonb := p_package -> 'dataset';
  v_assignment_count integer;
  v_offering_count integer;
  v_restriction_count integer;
  v_exception_count integer;
  v_english_count integer;
  v_course_count integer;
  v_drift_count integer;
  v_conflict_count integer;
begin
  if p_expected_checksum is null
     or p_expected_checksum !~ '^[0-9a-f]{64}$'
     or p_package ->> 'datasetSha256' is distinct from p_expected_checksum then
    raise exception 'reviewed dataset checksum mismatch';
  end if;
  if v_dataset is null or v_dataset ->> 'mode' <> 'REVIEWED_PNU_COURSE_APPLICATION_DATASET' then
    raise exception 'invalid reviewed application dataset';
  end if;
  if p_package::text ~* 'workbook(course|_course| row)' then
    raise exception 'workbook identifiers are forbidden';
  end if;

  if to_regclass('public.course') is null
     or to_regclass('public.course_offering') is null
     or to_regclass('public.course_metadata') is null
     or to_regclass('public.course_offering_restriction') is null then
    raise exception 'required course migration tables are missing';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'course'
      and column_name = 'official_course_number' and data_type = 'text'
      and is_nullable = 'YES'
  ) then
    raise exception 'course.official_course_number is missing or incompatible';
  end if;
  if exists (
    select 1
    from (
      values
        ('course_offering', 'course_offering_id'),
        ('course_offering', 'course_id'),
        ('course_offering', 'official_course_number'),
        ('course_offering', 'academic_year'),
        ('course_offering', 'semester'),
        ('course_offering', 'section'),
        ('course_offering', 'professor'),
        ('course_offering', 'year_level'),
        ('course_offering', 'theory_hours'),
        ('course_offering', 'practical_hours'),
        ('course_offering', 'enrollment_limit'),
        ('course_offering', 'schedule'),
        ('course_offering', 'classroom'),
        ('course_offering', 'remote_course_status'),
        ('course_offering', 'team_teaching_status'),
        ('course_offering', 'general_education_area'),
        ('course_offering', 'remarks'),
        ('course_offering', 'original_language_code'),
        ('course_offering', 'teaching_language'),
        ('course_offering', 'source_url'),
        ('course_offering', 'retrieved_at'),
        ('course_metadata', 'course_metadata_id'),
        ('course_metadata', 'course_offering_id'),
        ('course_metadata', 'presentation_requirement'),
        ('course_metadata', 'group_project_requirement'),
        ('course_metadata', 'assignment_requirement'),
        ('course_metadata', 'exam_information'),
        ('course_metadata', 'practical_type'),
        ('course_metadata', 'source_url'),
        ('course_metadata', 'source_updated_at'),
        ('course_metadata', 'verified_at')
        ,('course_offering_restriction', 'course_offering_restriction_id')
        ,('course_offering_restriction', 'course_offering_id')
        ,('course_offering_restriction', 'restriction_key')
        ,('course_offering_restriction', 'source_kind')
    ) expected(table_name, column_name)
    left join information_schema.columns actual
      on actual.table_schema = 'public'
      and actual.table_name = expected.table_name
      and actual.column_name = expected.column_name
    where actual.column_name is null
  ) then
    raise exception 'required offering or metadata columns are missing';
  end if;
  if exists (
    select 1
    from (
      values
        ('course', 'course_official_course_number_nonblank_check', 'c'),
        ('course_offering', 'course_offering_pkey', 'p'),
        ('course_offering', 'course_offering_course_id_fkey', 'f'),
        ('course_offering', 'course_offering_official_number_nonblank_check', 'c'),
        ('course_offering', 'course_offering_academic_year_check', 'c'),
        ('course_offering', 'course_offering_semester_check', 'c'),
        ('course_offering', 'course_offering_section_nonblank_check', 'c'),
        ('course_offering', 'course_offering_theory_hours_nonnegative_check', 'c'),
        ('course_offering', 'course_offering_practical_hours_nonnegative_check', 'c'),
        ('course_offering', 'course_offering_remote_status_check', 'c'),
        ('course_offering', 'course_offering_original_language_code_check', 'c'),
        ('course_offering', 'course_offering_teaching_language_check', 'c'),
        ('course_offering', 'course_offering_official_term_section_key', 'u'),
        ('course_offering', 'course_offering_course_term_section_key', 'u'),
        ('course_metadata', 'course_metadata_pkey', 'p'),
        ('course_metadata', 'course_metadata_course_offering_id_fkey', 'f'),
        ('course_metadata', 'course_metadata_presentation_requirement_check', 'c'),
        ('course_metadata', 'course_metadata_group_project_requirement_check', 'c'),
        ('course_metadata', 'course_metadata_assignment_requirement_check', 'c'),
        ('course_metadata', 'course_metadata_practical_type_check', 'c'),
        ('course_metadata', 'course_metadata_offering_key', 'u')
    ) expected(table_name, constraint_name, constraint_type)
    left join pg_constraint actual
      on actual.conname = expected.constraint_name
      and actual.conrelid = ('public.' || expected.table_name)::regclass
      and actual.contype::text = expected.constraint_type
    where actual.oid is null
  ) then
    raise exception 'required offering or metadata constraints are missing';
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.course_offering'::regclass
      and conname = 'course_offering_official_term_section_key'
      and pg_get_constraintdef(oid) =
        'UNIQUE (academic_year, semester, official_course_number, section)'
  ) or not exists (
    select 1 from pg_constraint
    where conrelid = 'public.course_offering'::regclass
      and conname = 'course_offering_course_term_section_key'
      and pg_get_constraintdef(oid) =
        'UNIQUE (course_id, academic_year, semester, section)'
  ) or not exists (
    select 1 from pg_constraint
    where conrelid = 'public.course_offering'::regclass
      and conname = 'course_offering_course_id_fkey'
      and confrelid = 'public.course'::regclass and confdeltype = 'c'
  ) or not exists (
    select 1 from pg_constraint
    where conrelid = 'public.course_metadata'::regclass
      and conname = 'course_metadata_course_offering_id_fkey'
      and confrelid = 'public.course_offering'::regclass and confdeltype = 'c'
  ) or not exists (
    select 1 from pg_constraint
    where conrelid = 'public.course_metadata'::regclass
      and conname = 'course_metadata_offering_key'
      and pg_get_constraintdef(oid) = 'UNIQUE (course_offering_id)'
  ) then
    raise exception 'required uniqueness or foreign-key definitions drifted';
  end if;
  if exists (
    select 1 from pg_class
    where oid in (
      'public.course_offering'::regclass,
      'public.course_metadata'::regclass,
      'public.course_offering_restriction'::regclass
    ) and not relrowsecurity
  ) then
    raise exception 'RLS must be enabled on offering and metadata tables';
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in ('course_offering', 'course_metadata', 'course_offering_restriction')
  ) then
    raise exception 'course offering tables must have no public client policies';
  end if;

  v_assignment_count := jsonb_array_length(v_dataset -> 'courseAssignments');
  v_offering_count := jsonb_array_length(v_dataset -> 'courseOfferings');
  v_restriction_count := jsonb_array_length(v_dataset -> 'courseRestrictions');
  v_exception_count := jsonb_array_length(v_dataset -> 'courseRestrictionExceptions');
  if v_assignment_count <> 57 or v_offering_count <> 82 then
    raise exception 'reviewed counts are invalid: assignments %, offerings %',
      v_assignment_count, v_offering_count;
  end if;
  if v_restriction_count <> 18 or v_exception_count <> 2 then
    raise exception 'reviewed restriction counts are invalid: restrictions %, exceptions %',
      v_restriction_count, v_exception_count;
  end if;
  if exists (
    select restriction_key
    from (
      select restriction_key
      from jsonb_to_recordset(v_dataset -> 'courseRestrictions') as x(restriction_key text)
      union all
      select restriction_key
      from jsonb_to_recordset(v_dataset -> 'courseRestrictionExceptions') as x(restriction_key text)
    ) reviewed
    group by restriction_key
    having restriction_key is null or count(*) <> 1
  ) then
    raise exception 'duplicate or null restriction keys are forbidden';
  end if;
  if (v_dataset -> 'exclusions' ->> 'ambiguousSubjects')::integer <> 94
     or (v_dataset -> 'exclusions' ->> 'unmatchedSubjects')::integer <> 2448
     or (v_dataset -> 'exclusions' ->> 'crossDepartmentOfficialNumbers')::integer <> 3 then
    raise exception 'reviewed exclusion counts are invalid';
  end if;

  select count(*) into v_course_count from public.course;
  if v_course_count <> 1875 then
    raise exception 'production course count drifted: expected 1875, received %', v_course_count;
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(v_dataset -> 'courseAssignments') as a(
      course_id integer,
      official_course_number text,
      expected_course_name text,
      expected_credit numeric,
      expected_category text,
      expected_major_id integer,
      previous_official_course_number text
    )
    group by a.course_id having count(*) <> 1
  ) or exists (
    select 1
    from jsonb_to_recordset(v_dataset -> 'courseAssignments') as a(
      course_id integer, official_course_number text
    )
    group by a.official_course_number having count(*) <> 1
  ) then
    raise exception 'duplicate reviewed course assignment identity';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(v_dataset -> 'courseOfferings') as o(
      course_id integer, official_course_number text, academic_year smallint,
      semester text, section text
    )
    group by o.academic_year, o.semester, o.official_course_number, o.section
    having count(*) <> 1
  ) or exists (
    select 1
    from jsonb_to_recordset(v_dataset -> 'courseOfferings') as o(
      course_id integer, official_course_number text, academic_year smallint,
      semester text, section text
    )
    group by o.course_id, o.academic_year, o.semester, o.section
    having count(*) <> 1
  ) then
    raise exception 'duplicate reviewed offering identity';
  end if;

  select count(*) into v_drift_count
  from jsonb_to_recordset(v_dataset -> 'courseAssignments') as a(
    course_id integer,
    official_course_number text,
    expected_course_name text,
    expected_credit numeric,
    expected_category text,
    expected_major_id integer,
    previous_official_course_number text
  )
  left join public.course c on c.course_id = a.course_id
  where c.course_id is null
     or c.course_name is distinct from a.expected_course_name
     or c.credit::numeric is distinct from a.expected_credit
     or c.category is distinct from a.expected_category
     or c.major_id is distinct from a.expected_major_id;
  if v_drift_count <> 0 then
    raise exception 'production course drift detected for % reviewed rows', v_drift_count;
  end if;

  select count(*) into v_conflict_count
  from jsonb_to_recordset(v_dataset -> 'courseAssignments') as a(
    course_id integer,
    official_course_number text,
    previous_official_course_number text
  )
  join public.course c on c.course_id = a.course_id
  where c.official_course_number is distinct from a.previous_official_course_number
    and c.official_course_number is distinct from a.official_course_number;
  if v_conflict_count <> 0 then
    raise exception 'conflicting existing official numbers detected for % rows', v_conflict_count;
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(v_dataset -> 'courseOfferings') as o(
      course_id integer, official_course_number text
    )
    left join jsonb_to_recordset(v_dataset -> 'courseAssignments') as a(
      course_id integer, official_course_number text
    ) using (course_id, official_course_number)
    where a.course_id is null
  ) then
    raise exception 'offering is not linked to a reviewed assignment';
  end if;

  select count(*) into v_english_count
  from jsonb_to_recordset(v_dataset -> 'courseOfferings') as o(
    original_language_code text,
    teaching_language text,
    is_english_taught boolean
  )
  where o.is_english_taught is true;
  if v_english_count <> 13 then
    raise exception 'explicit English count is invalid: %', v_english_count;
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(v_dataset -> 'courseOfferings') as o(
      original_language_code text,
      teaching_language text,
      is_english_taught boolean
    )
    where o.is_english_taught is distinct from case
      when o.original_language_code = 'E' or o.teaching_language = 'ENGLISH' then true
      when o.original_language_code in ('C', 'J', 'F', 'G', 'R')
        or o.teaching_language in ('KOREAN', 'OTHER') then false
      else null
    end
  ) then
    raise exception 'English status is not derived solely from explicit language evidence';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(v_dataset -> 'courseOfferings') as o(
      course_id integer,
      official_course_number text,
      academic_year smallint,
      semester text,
      section text,
      professor text,
      year_level text,
      theory_hours numeric,
      practical_hours numeric,
      enrollment_limit integer,
      schedule text,
      classroom text,
      remote_course_status text,
      team_teaching_status text,
      general_education_area text,
      remarks text,
      original_language_code text,
      teaching_language text,
      source_url text,
      retrieved_at timestamptz
    )
    join public.course_offering existing
      using (academic_year, semester, official_course_number, section)
    where existing.course_id is distinct from o.course_id
       or existing.professor is distinct from o.professor
       or existing.year_level is distinct from o.year_level
       or existing.theory_hours is distinct from o.theory_hours
       or existing.practical_hours is distinct from o.practical_hours
       or existing.enrollment_limit is distinct from o.enrollment_limit
       or existing.schedule is distinct from o.schedule
       or existing.classroom is distinct from o.classroom
       or existing.remote_course_status is distinct from o.remote_course_status
       or existing.team_teaching_status is distinct from o.team_teaching_status
       or existing.general_education_area is distinct from o.general_education_area
       or existing.remarks is distinct from o.remarks
       or existing.original_language_code is distinct from o.original_language_code
       or existing.teaching_language is distinct from o.teaching_language
       or existing.source_url is distinct from o.source_url
       or existing.retrieved_at is distinct from o.retrieved_at
  ) then
    raise exception 'an existing offering conflicts with the reviewed package';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(v_dataset -> 'courseOfferings') as o(
      course_id integer,
      official_course_number text,
      academic_year smallint,
      semester text,
      section text
    )
    join public.course_offering existing
      using (course_id, academic_year, semester, section)
    where existing.official_course_number is distinct from o.official_course_number
  ) then
    raise exception 'an existing course/term/section identity has a conflicting official number';
  end if;

  if exists (
    select 1
    from (
      select * from jsonb_to_recordset(v_dataset -> 'courseRestrictions') as x(
        restriction_key text, academic_year smallint, semester text, official_course_number text,
        section text, source_kind text, source_rule_type text, permission text,
        department_condition text, year_level_condition text, domestic_foreign_condition text,
        nationality_condition text, curriculum_year_condition text,
        completed_semesters_condition text, academic_status_condition text,
        degree_program_condition text, reason text, exception_text text, source_file_name text
      )
      union all
      select * from jsonb_to_recordset(v_dataset -> 'courseRestrictionExceptions') as x(
        restriction_key text, academic_year smallint, semester text, official_course_number text,
        section text, source_kind text, source_rule_type text, permission text,
        department_condition text, year_level_condition text, domestic_foreign_condition text,
        nationality_condition text, curriculum_year_condition text,
        completed_semesters_condition text, academic_status_condition text,
        degree_program_condition text, reason text, exception_text text, source_file_name text
      )
    ) r
    join public.course_offering_restriction existing using (restriction_key)
    join public.course_offering offering on offering.course_offering_id = existing.course_offering_id
    where (offering.academic_year, offering.semester, offering.official_course_number, offering.section,
           existing.source_kind, existing.source_rule_type, existing.permission,
           existing.department_condition, existing.year_level_condition,
           existing.domestic_foreign_condition, existing.nationality_condition,
           existing.curriculum_year_condition, existing.completed_semesters_condition,
           existing.academic_status_condition, existing.degree_program_condition,
           existing.reason, existing.exception_text, existing.source_file_name)
      is distinct from
          (r.academic_year, r.semester, r.official_course_number, r.section,
           r.source_kind, r.source_rule_type, r.permission, r.department_condition,
           r.year_level_condition, r.domestic_foreign_condition, r.nationality_condition,
           r.curriculum_year_condition, r.completed_semesters_condition,
           r.academic_status_condition, r.degree_program_condition,
           r.reason, r.exception_text, r.source_file_name)
  ) then
    raise exception 'an existing restriction conflicts with the reviewed package';
  end if;

  return jsonb_build_object(
    'ready', true,
    'productionCourses', v_course_count,
    'revalidatedAssignments', v_assignment_count,
    'uniqueOfferingIdentities', v_offering_count,
    'explicitEnglishOfferings', v_english_count,
    'uniqueRestrictions', v_restriction_count,
    'uniqueRestrictionExceptions', v_exception_count,
    'checksum', p_expected_checksum
  );
end
$function$;

revoke all on function public.preflight_reviewed_pnu_course_package(jsonb, text)
  from public, anon, authenticated;
grant execute on function public.preflight_reviewed_pnu_course_package(jsonb, text)
  to service_role;

create or replace function public.apply_reviewed_pnu_course_package(
  p_package jsonb,
  p_expected_checksum text
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_dataset jsonb := p_package -> 'dataset';
  v_updated_courses integer;
  v_inserted_offerings integer;
  v_inserted_restrictions integer;
  v_verified_courses integer;
  v_verified_offerings integer;
  v_verified_english integer;
  v_verified_restrictions integer;
begin
  perform public.preflight_reviewed_pnu_course_package(p_package, p_expected_checksum);

  update public.course c
  set official_course_number = a.official_course_number
  from jsonb_to_recordset(v_dataset -> 'courseAssignments') as a(
    course_id integer, official_course_number text
  )
  where c.course_id = a.course_id
    and c.official_course_number is null;
  get diagnostics v_updated_courses = row_count;

  insert into public.course_offering (
    course_id, official_course_number, academic_year, semester, section,
    professor, year_level, theory_hours, practical_hours, enrollment_limit, schedule, classroom,
    remote_course_status, team_teaching_status, general_education_area, remarks,
    original_language_code, teaching_language,
    source_url, retrieved_at
  )
  select
    o.course_id, o.official_course_number, o.academic_year, o.semester, o.section,
    o.professor, o.year_level, o.theory_hours, o.practical_hours, o.enrollment_limit, o.schedule,
    o.classroom, o.remote_course_status, o.team_teaching_status, o.general_education_area, o.remarks, o.original_language_code,
    o.teaching_language, o.source_url, o.retrieved_at
  from jsonb_to_recordset(v_dataset -> 'courseOfferings') as o(
    course_id integer,
    official_course_number text,
    academic_year smallint,
    semester text,
    section text,
    professor text,
    year_level text,
    theory_hours numeric,
    practical_hours numeric,
    enrollment_limit integer,
    schedule text,
    classroom text,
    remote_course_status text,
    team_teaching_status text,
    general_education_area text,
    remarks text,
    original_language_code text,
    teaching_language text,
    source_url text,
    retrieved_at timestamptz
  )
  on conflict (academic_year, semester, official_course_number, section) do nothing;
  get diagnostics v_inserted_offerings = row_count;

  insert into public.course_offering_restriction (
    course_offering_id, restriction_key, source_kind, source_rule_type, permission,
    department_condition, year_level_condition, domestic_foreign_condition,
    nationality_condition, curriculum_year_condition, completed_semesters_condition,
    academic_status_condition, degree_program_condition, reason, exception_text,
    source_file_name
  )
  select
    offering.course_offering_id, r.restriction_key, r.source_kind, r.source_rule_type,
    r.permission, r.department_condition, r.year_level_condition,
    r.domestic_foreign_condition, r.nationality_condition,
    r.curriculum_year_condition, r.completed_semesters_condition,
    r.academic_status_condition, r.degree_program_condition, r.reason,
    r.exception_text, r.source_file_name
  from (
    select * from jsonb_to_recordset(v_dataset -> 'courseRestrictions') as x(
      restriction_key text, academic_year smallint, semester text,
      official_course_number text, section text, source_kind text,
      source_rule_type text, permission text, department_condition text,
      year_level_condition text, domestic_foreign_condition text,
      nationality_condition text, curriculum_year_condition text,
      completed_semesters_condition text, academic_status_condition text,
      degree_program_condition text, reason text, exception_text text,
      source_file_name text
    )
    union all
    select * from jsonb_to_recordset(v_dataset -> 'courseRestrictionExceptions') as x(
      restriction_key text, academic_year smallint, semester text,
      official_course_number text, section text, source_kind text,
      source_rule_type text, permission text, department_condition text,
      year_level_condition text, domestic_foreign_condition text,
      nationality_condition text, curriculum_year_condition text,
      completed_semesters_condition text, academic_status_condition text,
      degree_program_condition text, reason text, exception_text text,
      source_file_name text
    )
  ) r
  join public.course_offering offering
    using (academic_year, semester, official_course_number, section)
  on conflict (restriction_key) do nothing;
  get diagnostics v_inserted_restrictions = row_count;

  -- Repeat every drift, language, schema, RLS, policy, and offering-content
  -- assertion after the writes and before this RPC transaction can commit.
  perform public.preflight_reviewed_pnu_course_package(p_package, p_expected_checksum);

  select count(*) into v_verified_courses
  from jsonb_to_recordset(v_dataset -> 'courseAssignments') as a(
    course_id integer, official_course_number text
  )
  join public.course c using (course_id)
  where c.official_course_number = a.official_course_number;

  select count(*) into v_verified_offerings
  from jsonb_to_recordset(v_dataset -> 'courseOfferings') as o(
    academic_year smallint, semester text, official_course_number text, section text
  )
  join public.course_offering existing
    using (academic_year, semester, official_course_number, section);

  select count(*) into v_verified_english
  from jsonb_to_recordset(v_dataset -> 'courseOfferings') as o(
    academic_year smallint, semester text, official_course_number text, section text,
    original_language_code text, teaching_language text, is_english_taught boolean
  )
  join public.course_offering existing
    using (academic_year, semester, official_course_number, section)
  where o.is_english_taught is true
    and existing.original_language_code = 'E'
    and existing.teaching_language = 'ENGLISH';

  select count(distinct reviewed.restriction_key) into v_verified_restrictions
  from (
    select restriction_key from jsonb_to_recordset(v_dataset -> 'courseRestrictions') as x(restriction_key text)
    union all
    select restriction_key from jsonb_to_recordset(v_dataset -> 'courseRestrictionExceptions') as x(restriction_key text)
  ) reviewed
  join public.course_offering_restriction existing using (restriction_key);

  if v_verified_courses <> 57
     or v_verified_offerings <> 82
     or v_verified_english <> 13
     or v_verified_restrictions <> 20 then
    raise exception 'postflight count failure: courses %, offerings %, English %, restrictions %',
      v_verified_courses, v_verified_offerings, v_verified_english, v_verified_restrictions;
  end if;

  return jsonb_build_object(
    'applied', true,
    'updatedCourseOfficialNumbers', v_updated_courses,
    'insertedOfferings', v_inserted_offerings,
    'insertedRestrictions', v_inserted_restrictions,
    'verifiedCourseAssignments', v_verified_courses,
    'verifiedOfferings', v_verified_offerings,
    'verifiedEnglishOfferings', v_verified_english,
    'verifiedRestrictions', v_verified_restrictions,
    'checksum', p_expected_checksum
  );
end
$function$;

revoke all on function public.apply_reviewed_pnu_course_package(jsonb, text)
  from public, anon, authenticated;
grant execute on function public.apply_reviewed_pnu_course_package(jsonb, text)
  to service_role;

create or replace function public.rollback_reviewed_pnu_course_package(
  p_package jsonb,
  p_expected_checksum text
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_dataset jsonb := p_package -> 'dataset';
  v_present_offerings integer;
  v_deleted_offerings integer;
  v_restored_courses integer;
  v_remaining_offerings integer;
  v_unrestored_courses integer;
begin
  perform public.preflight_reviewed_pnu_course_package(p_package, p_expected_checksum);

  select count(*) into v_present_offerings
  from jsonb_to_recordset(v_dataset -> 'courseOfferings') as o(
    academic_year smallint, semester text, official_course_number text, section text
  )
  join public.course_offering existing
    using (academic_year, semester, official_course_number, section);
  if v_present_offerings <> 82 then
    raise exception 'rollback requires all 82 reviewed offering rows; found %',
      v_present_offerings;
  end if;

  delete from public.course_offering existing
  using jsonb_to_recordset(v_dataset -> 'courseOfferings') as o(
    academic_year smallint, semester text, official_course_number text, section text
  )
  where existing.academic_year = o.academic_year
    and existing.semester = o.semester
    and existing.official_course_number = o.official_course_number
    and existing.section = o.section;
  get diagnostics v_deleted_offerings = row_count;

  update public.course c
  set official_course_number = a.previous_official_course_number
  from jsonb_to_recordset(v_dataset -> 'courseAssignments') as a(
    course_id integer,
    official_course_number text,
    previous_official_course_number text
  )
  where c.course_id = a.course_id
    and c.official_course_number = a.official_course_number;
  get diagnostics v_restored_courses = row_count;

  -- Revalidate immutable course fields, checksum, schema, RLS, and policies
  -- before allowing the rollback transaction to commit.
  perform public.preflight_reviewed_pnu_course_package(p_package, p_expected_checksum);

  select count(*) into v_remaining_offerings
  from jsonb_to_recordset(v_dataset -> 'courseOfferings') as o(
    academic_year smallint, semester text, official_course_number text, section text
  )
  join public.course_offering existing
    using (academic_year, semester, official_course_number, section);

  select count(*) into v_unrestored_courses
  from jsonb_to_recordset(v_dataset -> 'courseAssignments') as a(
    course_id integer, previous_official_course_number text
  )
  join public.course c using (course_id)
  where c.official_course_number is distinct from a.previous_official_course_number;

  if v_deleted_offerings <> 82
     or v_restored_courses <> 57
     or v_remaining_offerings <> 0
     or v_unrestored_courses <> 0 then
    raise exception 'rollback verification failed';
  end if;

  return jsonb_build_object(
    'rolledBack', true,
    'deletedReviewedOfferings', v_deleted_offerings,
    'restoredCourseOfficialNumbers', v_restored_courses,
    'remainingReviewedOfferings', v_remaining_offerings,
    'checksum', p_expected_checksum
  );
end
$function$;

revoke all on function public.rollback_reviewed_pnu_course_package(jsonb, text)
  from public, anon, authenticated;
grant execute on function public.rollback_reviewed_pnu_course_package(jsonb, text)
  to service_role;

commit;
