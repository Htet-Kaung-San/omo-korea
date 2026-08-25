import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const provenance = JSON.parse(readFileSync(join(backendRoot, 'config', 'pnu-course-provenance-2026-2.json'), 'utf8'));
const packageWrapper = {
  datasetSha256: provenance.applicationDatasetSha256,
  dataset: {
    schemaVersion: provenance.reviewedBasePackage.schemaVersion,
    mode: provenance.reviewedBasePackage.mode,
    source: provenance.reviewedBasePackage.source,
    expectedCounts: provenance.reviewedBasePackage.expectedCounts,
    exclusions: provenance.reviewedBasePackage.exclusions,
    courseAssignments: provenance.reviewedBasePackage.courseAssignments,
    courseOfferings: provenance.reviewedBasePackage.courseOfferings,
    courseRestrictions: provenance.reviewedBasePackage.courseRestrictions,
    courseRestrictionExceptions: provenance.reviewedBasePackage.courseRestrictionExceptions,
  },
};

const sqlString = (value) => value == null ? 'null' : `'${String(value).replaceAll("'", "''")}'`;
const sqlNumber = (value) => value == null ? 'null' : String(value);
const reviewedCourses = new Map();
for (const row of provenance.reviewedBasePackage.courseAssignments) {
  reviewedCourses.set(row.course_id, {
    courseId: row.course_id,
    name: row.expected_course_name,
    credit: row.expected_credit,
    category: row.expected_category,
    majorId: row.expected_major_id,
    officialNumber: row.previous_official_course_number,
  });
}
for (const row of provenance.reviewedMetadataPackage.identities) {
  if (!reviewedCourses.has(row.courseId)) reviewedCourses.set(row.courseId, {
    courseId: row.courseId,
    name: row.productionCourseName,
    credit: row.credit,
    category: row.category,
    majorId: provenance.reviewedMetadataPackage.scope.majorId,
    officialNumber: null,
  });
}

const courseValues = [...reviewedCourses.values()].map((row) =>
  `(${row.courseId}, ${sqlString(row.name)}, ${sqlNumber(row.credit)}, ${sqlString(row.category)}, ${row.majorId}, ${sqlString(row.officialNumber)})`);
const fillerCount = 1875 - reviewedCourses.size;
const packageJson = JSON.stringify(packageWrapper);
if (packageJson.includes('$package$')) throw new Error('Unexpected package delimiter collision');

const firstRestriction = provenance.reviewedBasePackage.courseRestrictions[0];
const masterSql = String.raw`\set ON_ERROR_STOP on
create role anon;
create role authenticated;
create role service_role;

create table public.course (
  course_id integer primary key,
  course_name text not null,
  credit numeric not null,
  category text not null,
  major_id integer not null,
  official_course_number text null
);
insert into public.course(course_id, course_name, credit, category, major_id, official_course_number) values
${courseValues.join(',\n')};
insert into public.course(course_id, course_name, credit, category, major_id)
select -value, 'Unrelated filler ' || value, 3, 'ELECTIVE', 999
from generate_series(1, ${fillerCount}) value;

\i /work/course_identity_and_offerings.sql
\i /work/course_metadata.sql
\i /work/course_offering_2026_2_extensions.sql
\i /work/course_application_rpc.sql

select public.apply_reviewed_pnu_course_package(
  $package$${packageJson}$package$::jsonb,
  '${provenance.applicationDatasetSha256}'
);

\i /work/course_metadata_application_rpc.sql
select public.apply_reviewed_pnu_course_metadata_2026_2(
  '${provenance.reviewedMetadataPackage.manifestSha256}',
  '${provenance.reviewedMetadataPackage.resolutionSha256}'
);

do $$ declare actual integer; begin
  select count(*) into actual from public.course; if actual <> 1875 then raise exception 'course count %', actual; end if;
  select count(*) into actual from public.course where official_course_number is not null; if actual <> 64 then raise exception 'official count %', actual; end if;
  select count(*) into actual from public.course_offering; if actual <> 89 then raise exception 'offering count %', actual; end if;
  select count(*) into actual from public.course_metadata; if actual <> 9 then raise exception 'metadata count %', actual; end if;
  select count(*) into actual from public.course_offering_restriction; if actual <> 20 then raise exception 'restriction count %', actual; end if;
end $$;

insert into public.course_offering(course_id, official_course_number, academic_year, semester, section)
values (-1, 'UNRELATED001', 2026, '2', '999');
insert into public.course_metadata(course_offering_id, exam_information)
select course_offering_id, 'Unrelated metadata' from public.course_offering where official_course_number = 'UNRELATED001';
insert into public.course_offering_restriction(course_offering_id, restriction_key, source_kind, source_rule_type, permission)
select course_offering_id, 'unrelated-key', 'RESTRICTION', '학과', 'ALLOWED'
from public.course_offering where official_course_number = 'UNRELATED001';

update public.course_metadata metadata set exam_information = 'intentional drift'
from public.course_offering offering
where metadata.course_offering_id = offering.course_offering_id and offering.official_course_number = 'CB1501019';
do $$ begin
  perform public.rollback_reviewed_pnu_course_metadata_2026_2(
    '${provenance.reviewedMetadataPackage.manifestSha256}',
    '${provenance.reviewedMetadataPackage.resolutionSha256}'
  );
  raise exception 'metadata drift rollback unexpectedly succeeded';
exception when others then
  if sqlerrm not like 'metadata rollback drift:%' then raise; end if;
end $$;
do $$ declare actual integer; begin
  select count(*) into actual from public.course_offering; if actual <> 90 then raise exception 'metadata drift changed offerings'; end if;
  select count(*) into actual from public.course_metadata; if actual <> 10 then raise exception 'metadata drift changed metadata'; end if;
end $$;
update public.course_metadata metadata set exam_information = 'Exams 90%'
from public.course_offering offering
where metadata.course_offering_id = offering.course_offering_id and offering.official_course_number = 'CB1501019';

select public.rollback_reviewed_pnu_course_metadata_2026_2(
  '${provenance.reviewedMetadataPackage.manifestSha256}',
  '${provenance.reviewedMetadataPackage.resolutionSha256}'
);

update public.course_offering_restriction set reason = 'intentional drift'
where restriction_key = ${sqlString(firstRestriction.restriction_key)};
do $$ begin
  perform public.rollback_reviewed_pnu_course_package(
    $package$${packageJson}$package$::jsonb,
    '${provenance.applicationDatasetSha256}'
  );
  raise exception 'base drift rollback unexpectedly succeeded';
exception when others then
  if sqlerrm not like 'an existing restriction conflicts%' then raise; end if;
end $$;
do $$ declare actual integer; begin
  select count(*) into actual from public.course_offering; if actual <> 83 then raise exception 'base drift changed offerings'; end if;
  select count(*) into actual from public.course_offering_restriction; if actual <> 21 then raise exception 'base drift changed restrictions'; end if;
end $$;
update public.course_offering_restriction set reason = ${sqlString(firstRestriction.reason)}
where restriction_key = ${sqlString(firstRestriction.restriction_key)};

select public.rollback_reviewed_pnu_course_package(
  $package$${packageJson}$package$::jsonb,
  '${provenance.applicationDatasetSha256}'
);

do $$ declare actual integer; begin
  select count(*) into actual from public.course; if actual <> 1875 then raise exception 'final course count %', actual; end if;
  select count(*) into actual from public.course where official_course_number is not null; if actual <> 0 then raise exception 'final official count %', actual; end if;
  select count(*) into actual from public.course_offering; if actual <> 1 then raise exception 'unrelated offering lost'; end if;
  select count(*) into actual from public.course_offering where official_course_number = 'UNRELATED001'; if actual <> 1 then raise exception 'wrong offering survived'; end if;
  select count(*) into actual from public.course_metadata; if actual <> 1 then raise exception 'unrelated metadata lost'; end if;
  select count(*) into actual from public.course_offering_restriction; if actual <> 1 then raise exception 'unrelated restriction lost'; end if;
end $$;
`;

const container = `omo-pnu-rollback-${process.pid}`;
const tempRoot = mkdtempSync(join(tmpdir(), 'omo-pnu-rollback-'));
const masterPath = join(tempRoot, 'rollback-integration.sql');
writeFileSync(masterPath, masterSql, 'utf8');

const docker = (args, options = {}) => execFileSync('docker', args, { encoding: 'utf8', ...options });
try {
  docker(['run', '--rm', '-d', '--name', container, '-e', 'POSTGRES_PASSWORD=integration-only', 'postgres:16']);
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      docker([
        'exec',
        container,
        'psql',
        '-U',
        'postgres',
        '-d',
        'postgres',
        '-c',
        'SELECT 1;',
      ]);
      ready = true;
      break;
    } catch {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
    }
  }
  if (!ready) throw new Error('Disposable PostgreSQL did not become ready');
  docker(['exec', container, 'mkdir', '-p', '/work']);

  for (const file of [
    'course_identity_and_offerings.sql',
    'course_metadata.sql',
    'course_offering_2026_2_extensions.sql',
    'course_application_rpc.sql',
    'course_metadata_application_rpc.sql',
  ]) docker(['cp', join(backendRoot, 'supabase', file), `${container}:/work/${file}`]);
  docker(['cp', masterPath, `${container}:/work/rollback-integration.sql`]);
  docker(['exec', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-f', '/work/rollback-integration.sql'], { stdio: 'inherit' });
  console.log('Disposable PostgreSQL rollback integration passed');
} finally {
  try { docker(['rm', '-f', container]); } catch {}
  rmSync(tempRoot, { recursive: true, force: true });
}
