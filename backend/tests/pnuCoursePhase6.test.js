const { execFileSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const {
  EXPECTED_COUNTS,
  applicationDatasetPath,
  applicationResultPath,
  authorizeOperation,
  datasetChecksum,
  explicitEnglishStatus,
  parseApplicationArguments,
  revalidateProductionCourses,
  validateDataset,
  validatePackage,
} = require('../scripts/lib/pnuCourseApplication.cjs');

const backendRoot = join(__dirname, '..');
const repoRoot = join(backendRoot, '..');

function fixtureDataset() {
  const courseAssignments = Array.from(
    { length: EXPECTED_COUNTS.courseAssignments },
    (_, index) => ({
      course_id: index + 1,
      official_course_number: `PNU${String(index + 1).padStart(5, '0')}`,
      expected_course_name: `Course ${index + 1}`,
      expected_credit: 3,
      expected_category: 'ELECTIVE',
      expected_major_id: 46,
      previous_official_course_number: null,
    }),
  );
  const courseOfferings = Array.from(
    { length: EXPECTED_COUNTS.courseOfferings },
    (_, index) => {
      const assignment = courseAssignments[index % courseAssignments.length];
      const english = index < EXPECTED_COUNTS.explicitEnglishOfferings;
      const explicitOther = !english && index < EXPECTED_COUNTS.explicitEnglishOfferings + 10;
      return {
        course_id: assignment.course_id,
        official_course_number: assignment.official_course_number,
        academic_year: 2026,
        semester: '2',
        section: String(index + 1).padStart(4, '0'),
        professor: null,
        year_level: null,
        theory_hours: null,
        practical_hours: null,
        schedule: null,
        classroom: null,
        remote_course_status: null,
        original_language_code: english ? 'E' : explicitOther ? 'C' : null,
        teaching_language: english ? 'ENGLISH' : explicitOther ? 'OTHER' : null,
        is_english_taught: english ? true : explicitOther ? false : null,
        source_url: 'https://onestop.pusan.ac.kr/',
        retrieved_at: '2026-08-03T15:12:18.882Z',
      };
    },
  );
  return {
    schemaVersion: 1,
    mode: 'REVIEWED_PNU_COURSE_APPLICATION_DATASET',
    source: { phase5FinalReviewedProposalSha256: 'a'.repeat(64) },
    expectedCounts: { ...EXPECTED_COUNTS },
    exclusions: {
      ambiguousSubjects: 94,
      unmatchedSubjects: 2448,
      crossDepartmentOfficialNumbers: 3,
    },
    courseAssignments,
    courseOfferings,
    courseRestrictions: Array.from({ length: 18 }, (_, index) => ({ restriction_key: `restriction-${index}` })),
    courseRestrictionExceptions: Array.from({ length: 2 }, (_, index) => ({ restriction_key: `exception-${index}` })),
  };
}

function fixtureProduction(dataset) {
  const reviewed = new Map(dataset.courseAssignments.map((row) => [row.course_id, row]));
  return Array.from({ length: EXPECTED_COUNTS.productionCourses }, (_, index) => {
    const courseId = index + 1;
    const expected = reviewed.get(courseId);
    return expected
      ? {
          course_id: courseId,
          course_name: expected.expected_course_name,
          credit: expected.expected_credit,
          category: expected.expected_category,
          major_id: expected.expected_major_id,
          official_course_number: expected.previous_official_course_number,
        }
      : {
          course_id: courseId,
          course_name: `Unreviewed ${courseId}`,
          credit: 3,
          category: 'ELECTIVE',
          major_id: 46,
          official_course_number: null,
        };
  });
}

describe('Phase 6 package gates and deterministic data', () => {
  let dataset;
  let wrapper;

  beforeAll(() => {
    dataset = fixtureDataset();
    wrapper = { datasetSha256: datasetChecksum(dataset), dataset };
  });

  test('dry-run is the default and approval alone cannot authorize a write', () => {
    const options = parseApplicationArguments([
      '--expected-checksum',
      wrapper.datasetSha256,
    ]);
    expect(options.apply).toBe(false);
    expect(authorizeOperation(options, { COURSE_BACKFILL_APPROVED: 'true' })).toEqual({
      dryRun: true,
      writeAuthorized: false,
    });
  });

  test('--apply alone is rejected', () => {
    const options = parseApplicationArguments(['--apply']);
    expect(() => authorizeOperation(options, {})).toThrow(
      '--apply requires COURSE_BACKFILL_APPROVED=true',
    );
  });

  test('both independent write safeguards are required', () => {
    const options = parseApplicationArguments(['--apply']);
    expect(authorizeOperation(options, { COURSE_BACKFILL_APPROVED: 'true' })).toEqual({
      dryRun: false,
      writeAuthorized: true,
    });
  });

  test('checksum mismatch is rejected', () => {
    expect(() => validatePackage(wrapper, 'b'.repeat(64))).toThrow(
      'Application dataset checksum mismatch',
    );
  });

  test('exact application and exclusion counts are enforced', () => {
    expect(validateDataset(dataset)).toBe(true);
    expect(dataset.courseAssignments).toHaveLength(57);
    expect(dataset.courseOfferings).toHaveLength(82);
    expect(dataset.courseOfferings.filter((row) => row.is_english_taught)).toHaveLength(13);
    expect(dataset.exclusions).toEqual({
      ambiguousSubjects: 94,
      unmatchedSubjects: 2448,
      crossDepartmentOfficialNumbers: 3,
    });
    expect(JSON.stringify(dataset)).not.toMatch(/workbookCourseId|workbook_course_id/i);
  });

  test('duplicate offering identities are rejected', () => {
    const duplicate = structuredClone(dataset);
    duplicate.courseOfferings[1] = { ...duplicate.courseOfferings[0] };
    expect(() => validateDataset(duplicate)).toThrow('Duplicate application identity');
  });

  test('duplicate restriction keys are rejected instead of overcounted', () => {
    const duplicate = structuredClone(dataset);
    duplicate.courseRestrictions[1].restriction_key = duplicate.courseRestrictions[0].restriction_key;
    expect(() => validateDataset(duplicate)).toThrow('Duplicate application identity');
  });

  test('null language remains unknown and only explicit evidence yields true', () => {
    expect(explicitEnglishStatus(null, null)).toBeNull();
    expect(explicitEnglishStatus('E', 'ENGLISH')).toBe(true);
    expect(explicitEnglishStatus('C', 'OTHER')).toBe(false);
    const corrupted = structuredClone(dataset);
    const unknown = corrupted.courseOfferings.find(
      (row) => row.original_language_code === null,
    );
    corrupted.courseOfferings[0].is_english_taught = false;
    unknown.is_english_taught = true;
    expect(() => validateDataset(corrupted)).toThrow('invalid English status');
  });

  test('production drift is rejected', () => {
    const production = fixtureProduction(dataset);
    production[0].course_name = 'Changed Course';
    expect(() => revalidateProductionCourses(dataset, production)).toThrow(
      'Production course drift detected',
    );
  });

  test('an existing conflicting official number is rejected', () => {
    const production = fixtureProduction(dataset);
    production[0].official_course_number = 'DIFFERENT';
    expect(() => revalidateProductionCourses(dataset, production)).toThrow(
      'Conflicting official course numbers',
    );
  });

  test('revalidation is idempotent after reviewed official numbers already exist', () => {
    const production = fixtureProduction(dataset);
    for (const assignment of dataset.courseAssignments) {
      production[assignment.course_id - 1].official_course_number = assignment.official_course_number;
    }
    expect(revalidateProductionCourses(dataset, production)).toMatchObject({
      revalidatedAssignments: 57,
      drift: 0,
      conflicts: 0,
    });
  });

  test('the generated local package matches the tracked manifest when present', () => {
    const manifest = JSON.parse(
      readFileSync(join(backendRoot, 'config', 'pnu-course-application-manifest.json'), 'utf8'),
    );
    expect(manifest.counts).toMatchObject(EXPECTED_COUNTS);
    const packagePath = applicationDatasetPath(backendRoot, 2026, '2');
    if (existsSync(packagePath)) {
      const localPackage = JSON.parse(readFileSync(packagePath, 'utf8'));
      expect(validatePackage(localPackage, manifest.datasetSha256)).toBe(
        manifest.datasetSha256,
      );
      expect(localPackage.dataset.courseAssignments).toHaveLength(57);
      expect(localPackage.dataset.courseOfferings).toHaveLength(82);
    }
  });
});

describe('Phase 6 transaction, rollback, and exposure safety', () => {
  const sqlPath = join(backendRoot, 'supabase', 'course_application_rpc.sql');
  const scriptPath = join(backendRoot, 'scripts', 'apply-pnu-course-package.mjs');
  let sql;
  let script;

  beforeAll(() => {
    sql = readFileSync(sqlPath, 'utf8');
    script = readFileSync(scriptPath, 'utf8');
  });

  test('application and rollback use one atomic server-side RPC each', () => {
    expect(sql.match(/^begin\s*;/gim)).toHaveLength(1);
    expect(sql.match(/^commit\s*;/gim)).toHaveLength(1);
    expect(sql).toMatch(/function public\.apply_reviewed_pnu_course_package/i);
    expect(sql).toMatch(/function public\.rollback_reviewed_pnu_course_package/i);
    expect(script).toMatch(/'apply_reviewed_pnu_course_package'/);
    expect(script).toMatch(/'rollback_reviewed_pnu_course_package'/);
  });

  test('course mutation is limited to nullable official_course_number', () => {
    const courseUpdates = [...sql.matchAll(/update public\.course[\s\S]*?;/gi)];
    expect(courseUpdates).toHaveLength(2);
    for (const update of courseUpdates) {
      expect(update[0]).toMatch(/set official_course_number\s*=/i);
      expect(update[0]).not.toMatch(/set\s+(course_id|course_name|credit|category|major_id)\s*=/i);
    }
    expect(sql).not.toMatch(/delete\s+from\s+public\.course\b/i);
  });

  test('rollback is checksum-scoped and cannot drop tables', () => {
    expect(sql).toMatch(/v_present_offerings\s*<>\s*82/i);
    expect(sql).toMatch(/v_deleted_offerings\s*<>\s*82/i);
    expect(sql).toMatch(/v_restored_courses\s*<>\s*57/i);
    expect(sql).toMatch(/v_present_restrictions\s*<>\s*20/i);
    expect(sql).toMatch(/v_deleted_restrictions\s*<>\s*20/i);
    expect(sql).toMatch(/run rollback_reviewed_pnu_course_metadata_2026_2 first/i);
    expect(sql.indexOf('delete from public.course_offering_restriction')).toBeLessThan(sql.indexOf('delete from public.course_offering existing'));
    expect(sql).toMatch(/previous_official_course_number/i);
    expect(sql).not.toMatch(/drop\s+(table|column)/i);
  });

  test('RLS and no-public-access gates remain mandatory', () => {
    expect(sql).toMatch(/not relrowsecurity/i);
    expect(sql).toMatch(/from pg_policies/i);
    expect(sql).not.toMatch(/create\s+policy/i);
    for (const functionName of [
      'preflight_reviewed_pnu_course_package',
      'apply_reviewed_pnu_course_package',
      'rollback_reviewed_pnu_course_package',
    ]) {
      expect(sql).toMatch(
        new RegExp(`revoke all on function public\\.${functionName}\\(jsonb, text\\)[\\s\\S]*?from public, anon, authenticated`, 'i'),
      );
    }
  });

  test('RPC rejects duplicate keys and verifies distinct restriction identities', () => {
    expect(sql).toMatch(/duplicate or null restriction keys are forbidden/i);
    expect(sql).toMatch(/count\(distinct reviewed\.restriction_key\)/i);
    expect(sql).toMatch(/v_restriction_count\s*<>\s*18/i);
    expect(sql).toMatch(/v_exception_count\s*<>\s*2/i);
    expect(sql).toMatch(/v_verified_restrictions\s*<>\s*20/i);
    expect(sql).toMatch(/on conflict \(restriction_key\) do nothing/i);
  });

  test('the CLI is not exposed through backend routes or frontend code', () => {
    const routeFiles = execFileSync(
      'git',
      ['ls-files', 'backend/routes', 'backend/controllers', 'frontend/src'],
      { cwd: repoRoot, encoding: 'utf8' },
    )
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    const exposedSource = routeFiles
      .map((file) => readFileSync(join(repoRoot, file), 'utf8'))
      .join('\n');
    expect(exposedSource).not.toMatch(
      /apply-pnu-course-package|apply_reviewed_pnu_course_package|rollback_reviewed_pnu_course_package/i,
    );
  });

  test('the CLI is locked to the active reviewed manifest term and checksum', () => {
    expect(script).toMatch(/pnu-course-application-manifest\.json/);
    expect(script).toMatch(/Only the active reviewed term/);
    expect(script).toMatch(/Expected checksum does not match the active reviewed manifest/);
  });

  test('source contains no credential values and local outputs are ignored', () => {
    const combined = `${sql}\n${script}`;
    expect(combined).not.toMatch(/SUPABASE_(?:URL|KEY)\s*=\s*\S+/i);
    expect(combined).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/);
    for (const path of [
      applicationDatasetPath(backendRoot, 2026, '2'),
      applicationResultPath(backendRoot, 2026, '2', 'apply'),
    ]) {
      expect(
        execFileSync('git', ['check-ignore', path], {
          cwd: backendRoot,
          encoding: 'utf8',
        }),
      ).toContain('pnu-course-application');
    }
  });
});
