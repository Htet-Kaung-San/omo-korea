-- Controlled import for the reviewed International Trade, Global Studies, and
-- Tourism and Convention workbooks received on 2026-08-20.
-- Install this migration first. The apply RPC accepts only the exact locally
-- validated package and refuses to write if production has drifted.

begin;

alter table public.course_curriculum
  alter column recommended_year drop not null,
  alter column grade_semester drop not null;

create table if not exists public.major_official_source (
  major_id integer primary key,
  department_name_en text not null,
  department_name_ko text not null,
  official_website_url text not null,
  source_file_sha256 text not null,
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint major_official_source_major_fkey
    foreign key (major_id) references public.major(major_id) on delete restrict,
  constraint major_official_source_url_check
    check (official_website_url ~ '^https://[^[:space:]]+$'),
  constraint major_official_source_sha256_check
    check (source_file_sha256 ~ '^[0-9a-f]{64}$')
);

alter table public.major_official_source enable row level security;

create or replace function public.preflight_reviewed_economics_curricula(
  p_package jsonb,
  p_expected_checksum text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  reviewed_checksum constant text :=
    '0387a775a97c87393da41c46810f63ca26e029691c53f3af0435d83f697013c3';
  dataset jsonb := p_package -> 'dataset';
begin
  if p_package is null or jsonb_typeof(dataset) <> 'object' then
    raise exception 'reviewed Economics curriculum package is missing';
  end if;
  if p_expected_checksum is distinct from reviewed_checksum
    or p_package ->> 'datasetSha256' is distinct from reviewed_checksum then
    raise exception 'reviewed Economics curriculum checksum mismatch';
  end if;
  if dataset ->> 'mode' is distinct from
    'REVIEWED_ECONOMICS_AND_INTERNATIONAL_TRADE_CURRICULA' then
    raise exception 'reviewed Economics curriculum mode mismatch';
  end if;
  if dataset #>> '{sources,trade,sha256}' is distinct from
      'fb985ce5e7f1af6a44502cdb78e3fea09e1b8bd69a5575cfdd7da96441a1a941'
    or dataset #>> '{sources,globalStudies,sha256}' is distinct from
      '953135139bdd57194de4a8e16d27779ed1472672632c0848b2403a7116bb098c'
    or dataset #>> '{sources,tourism,sha256}' is distinct from
      '933b9c38ba7f92085db8df52670cced705b96ddfb00c71f6e055380ee1a35950'
    or dataset #>> '{sources,websites,sha256}' is distinct from
      'd24f199c2f080d0a0b046fb1da74723fac0c7b89a01f0321e3a458aefe36cec5' then
    raise exception 'one or more reviewed source files changed';
  end if;
  if jsonb_array_length(dataset -> 'sourceCourses') <> 136
    or jsonb_array_length(dataset -> 'existingCourses') <> 37
    or jsonb_array_length(dataset -> 'newCourses') <> 99
    or jsonb_array_length(dataset -> 'curriculumRows') <> 85
    or jsonb_array_length(dataset -> 'departmentWebsites') <> 15 then
    raise exception 'reviewed Economics curriculum package count mismatch';
  end if;
  if (select count(*) from public.course) <> 1924
    or (select count(*) from public.course where major_id = 68) <> 22
    or (select count(*) from public.course where major_id = 70) <> 14
    or (select count(*) from public.course where major_id = 71) <> 1 then
    raise exception 'production course counts drifted since review';
  end if;
  if not exists (
      select 1 from public.major
      where major_id = 68 and major_name = 'International Trade' and college_id = 12
    ) or not exists (
      select 1 from public.major
      where major_id = 70 and major_name = 'Tourism and Convention' and college_id = 12
    ) or not exists (
      select 1 from public.major
      where major_id = 71 and major_name = 'International Studies' and college_id = 12
    ) then
    raise exception 'reviewed destination major identity drifted';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(dataset -> 'departmentWebsites') reviewed
    left join public.major current
      on current.major_id = (reviewed ->> 'majorId')::integer
    where current.major_id is null
  ) then
    raise exception 'one or more department websites has no production major';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(dataset -> 'existingCourses') reviewed
    left join public.course current
      on current.course_id = (reviewed ->> 'course_id')::integer
    where current.course_id is null
      or current.course_name is distinct from reviewed ->> 'previous_course_name'
      or current.credit is distinct from (reviewed ->> 'previous_credit')::numeric
      or current.major_id is distinct from (reviewed ->> 'previous_major_id')::integer
      or current.category is distinct from reviewed ->> 'previous_category'
      or current.official_course_number is distinct from
        case when reviewed -> 'previous_official_course_number' = 'null'::jsonb
          then null else reviewed ->> 'previous_official_course_number' end
      or current.course_name_en is distinct from
        case when reviewed -> 'previous_course_name_en' = 'null'::jsonb
          then null else reviewed ->> 'previous_course_name_en' end
  ) then
    raise exception 'one or more reviewed production courses drifted';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(dataset -> 'newCourses') reviewed
    join public.course current
      on current.major_id = (reviewed ->> 'major_id')::integer
      and (
        lower(regexp_replace(current.course_name, '[^[:alnum:]]', '', 'g')) =
          lower(regexp_replace(reviewed ->> 'course_name', '[^[:alnum:]]', '', 'g'))
        or (
          reviewed -> 'official_course_number' <> 'null'::jsonb
          and current.official_course_number = reviewed ->> 'official_course_number'
        )
      )
  ) then
    raise exception 'one or more planned courses already exists';
  end if;
  if (select count(*) from public.course_curriculum where major_id in (68, 70, 71)) <> 0
    or (select count(*) from public.course_source_detail detail
        join public.course course on course.course_id = detail.course_id
        where course.major_id in (68, 70, 71)) <> 0
    or (select count(*) from public.major_official_source) <> 0 then
    raise exception 'reviewed destination provenance tables are not empty';
  end if;

  return jsonb_build_object(
    'ok', true,
    'datasetSha256', reviewed_checksum,
    'existingCourses', 37,
    'newCourses', 99,
    'curriculumRows', 85,
    'departmentWebsites', 15
  );
end
$function$;

create or replace function public.apply_reviewed_economics_curricula(
  p_package jsonb,
  p_expected_checksum text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  dataset jsonb := p_package -> 'dataset';
  updated_course_count integer;
  inserted_course_count integer;
  source_detail_count integer;
  curriculum_count integer;
  website_count integer;
begin
  perform public.preflight_reviewed_economics_curricula(p_package, p_expected_checksum);

  with reviewed as (
    select value from jsonb_array_elements(dataset -> 'existingCourses')
  )
  update public.course current
  set
    course_name_en = coalesce(current.course_name_en, reviewed.value ->> 'course_name_en'),
    category = reviewed.value ->> 'category',
    official_course_number = coalesce(
      current.official_course_number,
      reviewed.value ->> 'official_course_number'
    )
  from reviewed
  where current.course_id = (reviewed.value ->> 'course_id')::integer;
  get diagnostics updated_course_count = row_count;

  with reviewed as (
    select value from jsonb_array_elements(dataset -> 'newCourses')
  )
  insert into public.course (
    course_name,
    course_name_en,
    credit,
    major_id,
    category,
    official_course_number,
    recommended_year
  )
  select
    reviewed.value ->> 'course_name',
    nullif(reviewed.value ->> 'course_name_en', ''),
    (reviewed.value ->> 'credit')::numeric,
    (reviewed.value ->> 'major_id')::integer,
    reviewed.value ->> 'category',
    nullif(reviewed.value ->> 'official_course_number', ''),
    null
  from reviewed;
  get diagnostics inserted_course_count = row_count;

  with reviewed as (
    select value from jsonb_array_elements(dataset -> 'departmentWebsites')
  )
  insert into public.major_official_source (
    major_id,
    department_name_en,
    department_name_ko,
    official_website_url,
    source_file_sha256,
    retrieved_at
  )
  select
    (reviewed.value ->> 'majorId')::integer,
    reviewed.value ->> 'departmentEn',
    reviewed.value ->> 'departmentKo',
    reviewed.value ->> 'websiteUrl',
    dataset #>> '{sources,websites,sha256}',
    now()
  from reviewed;
  get diagnostics website_count = row_count;

  with reviewed as (
    select value from jsonb_array_elements(dataset -> 'sourceCourses')
  ), resolved as (
    select course.course_id, reviewed.value
    from reviewed
    join public.course course
      on course.major_id = (reviewed.value ->> 'major_id')::integer
      and (
        (
          reviewed.value -> 'official_course_number' <> 'null'::jsonb
          and course.official_course_number = reviewed.value ->> 'official_course_number'
        )
        or course.course_name = reviewed.value ->> 'course_name'
      )
  )
  insert into public.course_source_detail (
    course_id,
    description_ko,
    description_en,
    source_url,
    syllabus_url,
    source_kind,
    retrieved_at
  )
  select
    resolved.course_id,
    null,
    null,
    resolved.value ->> 'source_url',
    null,
    'PNU_CURRICULUM',
    now()
  from resolved;
  get diagnostics source_detail_count = row_count;

  with reviewed as (
    select value from jsonb_array_elements(dataset -> 'curriculumRows')
  )
  insert into public.course_curriculum (
    course_id,
    major_id,
    curriculum_year,
    source_course_code,
    category,
    recommended_year,
    grade_semester,
    source_department,
    source_file_sha256
  )
  select
    course.course_id,
    (reviewed.value ->> 'major_id')::integer,
    (reviewed.value ->> 'curriculum_year')::smallint,
    reviewed.value ->> 'source_course_code',
    reviewed.value ->> 'category',
    null,
    null,
    reviewed.value ->> 'source_department',
    reviewed.value ->> 'source_file_sha256'
  from reviewed
  join public.course course
    on course.major_id = (reviewed.value ->> 'major_id')::integer
    and course.official_course_number = reviewed.value ->> 'current_official_course_number';
  get diagnostics curriculum_count = row_count;

  if updated_course_count <> 37
    or inserted_course_count <> 99
    or source_detail_count <> 136
    or curriculum_count <> 85
    or website_count <> 15
    or (select count(*) from public.course) <> 2023
    or (select count(*) from public.course where major_id = 68) <> 43
    or (select count(*) from public.course where major_id = 70) <> 43
    or (select count(*) from public.course where major_id = 71) <> 50 then
    raise exception 'post-apply verification failed; transaction rolled back';
  end if;

  return jsonb_build_object(
    'ok', true,
    'datasetSha256', p_expected_checksum,
    'updatedCourses', updated_course_count,
    'insertedCourses', inserted_course_count,
    'courseSources', source_detail_count,
    'curriculumRows', curriculum_count,
    'departmentWebsites', website_count
  );
end
$function$;

revoke all on table public.major_official_source from public, anon, authenticated;
grant all on table public.major_official_source to service_role;

revoke all on function public.preflight_reviewed_economics_curricula(jsonb, text)
  from public, anon, authenticated;
revoke all on function public.apply_reviewed_economics_curricula(jsonb, text)
  from public, anon, authenticated;
grant execute on function public.preflight_reviewed_economics_curricula(jsonb, text)
  to service_role;
grant execute on function public.apply_reviewed_economics_curricula(jsonb, text)
  to service_role;

comment on table public.major_official_source is
  'Reviewed official PNU department website provenance; service-role only.';

commit;
