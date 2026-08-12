const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const { recommendCourses } = require('../ai/courseRecommendationEngine');
const { fetchAllCourses } = require('../ai/supabaseDataRepository');
const {
  createProductionReadinessReview,
  localProductionReviewPath,
} = require('../scripts/lib/pnuCourseBackfillDryRun.cjs');

const backendRoot = join(__dirname, '..');

function queryPage(result, includeFilters = false) {
  const query = {};
  query.select = jest.fn(() => query);
  query.order = jest.fn(() => query);
  query.range = jest.fn(async () => result);
  if (includeFilters) query.eq = jest.fn(() => query);
  return query;
}

function course(courseId, name = `Course ${courseId}`) {
  return {
    course_id: courseId,
    course_name: name,
    credit: 3,
    major_id: 46,
    category: 'ELECTIVE',
  };
}

describe('Phase 5 feature-flag and local end-to-end safety', () => {
  test.each([
    ['feature disabled', { includeOfferings: false }],
    ['year missing', { includeOfferings: true, offeringSemester: '1' }],
    ['semester missing', { includeOfferings: true, offeringAcademicYear: 2026 }],
  ])('%s does not query the optional table', async (_label, options) => {
    const courseQuery = queryPage({ data: [course(1)], error: null });
    const supabase = { from: jest.fn(() => courseQuery) };
    const rows = await fetchAllCourses(supabase, options);
    expect(supabase.from.mock.calls).toEqual([['course']]);
    expect(rows[0]).toMatchObject({
      officialCourseNumber: null,
      section: null,
      teachingLanguage: null,
      isEnglishTaught: null,
    });
  });

  test('empty, verified, and multiple-section offerings remain conservative', async () => {
    const courseQuery = queryPage({
      data: [course(1), course(2), course(3), course(4), course(5)],
      error: null,
    });
    const offeringQuery = queryPage(
      {
        data: [
          {
            course_id: 1,
            official_course_number: 'PNU1',
            academic_year: 2026,
            semester: '1',
            section: '001',
            original_language_code: 'E',
            teaching_language: 'ENGLISH',
            remote_course_status: 'REMOTE',
            professor: 'Professor Kim',
            schedule: 'Mon 09:00',
          },
          {
            course_id: 2,
            official_course_number: 'PNU2',
            academic_year: 2026,
            semester: '1',
            section: '001',
            original_language_code: 'C',
            teaching_language: 'OTHER',
          },
          {
            course_id: 3,
            official_course_number: 'PNU3',
            academic_year: 2026,
            semester: '1',
            section: '001',
            original_language_code: null,
            teaching_language: null,
          },
          { course_id: 5, section: '001', original_language_code: 'E' },
          { course_id: 5, section: '002', original_language_code: null },
        ],
        error: null,
      },
      true,
    );
    const supabase = {
      from: jest.fn((table) => (table === 'course' ? courseQuery : offeringQuery)),
    };
    const rows = await fetchAllCourses(supabase, {
      includeOfferings: true,
      offeringAcademicYear: 2026,
      offeringSemester: '1',
    });

    expect(rows[0]).toMatchObject({
      isEnglishTaught: true,
      remoteCourseStatus: 'REMOTE',
      professor: 'Professor Kim',
      schedule: 'Mon 09:00',
    });
    expect(rows[1]).toMatchObject({
      originalLanguageCode: 'C',
      isEnglishTaught: false,
    });
    expect(rows[2]).toMatchObject({
      originalLanguageCode: null,
      teachingLanguage: null,
      isEnglishTaught: null,
    });
    expect(rows[3]).toMatchObject({ section: null, isEnglishTaught: null });
    expect(rows[4]).toMatchObject({ section: null, isEnglishTaught: null });

    const profile = { majorId: '46', interests: [] };
    const baseOrder = recommendCourses(
      profile,
      [1, 2, 3, 4, 5].map((id) => ({
        id: String(id),
        nameEn: `Course ${id}`,
        majorId: '46',
        type: 'ELECTIVE',
        tags: [],
      })),
    ).map((item) => item.id);
    expect(recommendCourses(profile, rows).map((item) => item.id)).toEqual(baseOrder);
    for (const row of rows) {
      expect(row.presentationRequirement).toBeNull();
      expect(row.groupProjectRequirement).toBeNull();
      expect(row.assignmentRequirement).toBeNull();
      expect(row.examInformation).toBeNull();
    }
  });

  test('an explicitly requested section is selected only when unique', async () => {
    const courseQuery = queryPage({ data: [course(5)], error: null });
    const offeringQuery = queryPage(
      {
        data: [
          { course_id: 5, section: '001', original_language_code: 'E' },
          { course_id: 5, section: '002', original_language_code: null },
        ],
        error: null,
      },
      true,
    );
    const supabase = {
      from: jest.fn((table) => (table === 'course' ? courseQuery : offeringQuery)),
    };
    const rows = await fetchAllCourses(supabase, {
      includeOfferings: true,
      offeringAcademicYear: 2026,
      offeringSemester: '1',
      offeringSection: '001',
    });
    expect(rows[0]).toMatchObject({ section: '001', isEnglishTaught: true });
  });
});

describe('Phase 5 reviewed proposal and migration safety', () => {
  test('creates a checksum-bound final proposal from unchanged fixtures', () => {
    const matchingReport = {
      generatedAt: '2026-08-04T00:00:00.000Z',
      officialIdentityAudit: { managingDepartmentVariations: [] },
      matches: { production: { ambiguous: [], unmatched: [] } },
      dryRunBackfillPlan: {
        productionCourseOfficialNumberBackfills: [
          {
            official: {
              officialCourseNumber: 'PNU1',
              courseName: 'Course 1',
              credit: 3,
              category: 'ELECTIVE',
            },
            target: {
              courseId: 1,
              courseName: 'Course 1',
              credit: 3,
              majorId: 46,
              category: 'ELECTIVE',
            },
          },
        ],
      },
    };
    const officialSnapshot = {
      academicYear: 2026,
      semester: '1',
      offerings: [
        {
          officialCourseNumber: 'PNU1',
          academicYear: 2026,
          semester: '1',
          section: '001',
          courseName: 'Course 1',
          credits: 3,
          canonicalCourseCategory: 'ELECTIVE',
          managingDepartmentName: 'Department',
          originalLanguageCode: 'E',
          teachingLanguage: 'ENGLISH',
          isEnglishTaught: true,
        },
      ],
    };
    const dryRun = {
      proposedCourseNumberAssignments: [
        { course_id: 1, official_course_number: 'PNU1' },
      ],
      proposedCourseOfferingRows: [
        {
          course_id: 1,
          official_course_number: 'PNU1',
          academic_year: 2026,
          semester: '1',
          section: '001',
          original_language_code: 'E',
          teaching_language: 'ENGLISH',
        },
      ],
    };
    const report = createProductionReadinessReview({
      officialSnapshotText: JSON.stringify(officialSnapshot),
      matchingReportText: JSON.stringify(matchingReport),
      dryRunReportText: JSON.stringify(dryRun),
      productionCourses: [course(1)],
      now: () => new Date('2026-08-04T01:00:00.000Z'),
    });
    expect(report.ready).toBe(true);
    expect(report.counts).toMatchObject({
      approvedCourseNumberAssignments: 1,
      approvedCourseOfferingRows: 1,
      explicitEnglishOfferingRows: 1,
    });
    Object.values(report.checksums).forEach((checksum) =>
      expect(checksum).toMatch(/^[a-f0-9]{64}$/),
    );
  });

  test('migration drafts are atomic, drift-guarded, and contain no data changes', () => {
    const identitySql = readFileSync(
      join(backendRoot, 'supabase', 'course_identity_and_offerings.sql'),
      'utf8',
    );
    const metadataSql = readFileSync(
      join(backendRoot, 'supabase', 'course_metadata.sql'),
      'utf8',
    );
    for (const sql of [identitySql, metadataSql]) {
      expect(sql.match(/^begin\s*;/gim)).toHaveLength(1);
      expect(sql.match(/^commit\s*;/gim)).toHaveLength(1);
      expect(sql).toMatch(/information_schema\.columns/i);
      expect(sql).toMatch(/raise\s+exception/i);
      expect(sql).not.toMatch(/^\s*(insert|update|delete|merge|truncate|copy)\b/im);
      expect(sql).not.toMatch(/create\s+policy/i);
    }
    expect(identitySql).not.toMatch(/course_offering_course_id_idx/i);
    expect(metadataSql).not.toMatch(/course_metadata_course_offering_id_idx/i);
  });

  test('production review source has no mutation capability and output is ignored', () => {
    const files = [
      join(backendRoot, 'scripts', 'review-pnu-course-production-readiness.mjs'),
      join(backendRoot, 'scripts', 'lib', 'pnuCourseBackfillDryRun.cjs'),
    ];
    const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');
    expect(source).not.toMatch(/\.(insert|update|delete|upsert|rpc)\s*\(/i);
    expect(source).not.toMatch(/createClient\s*\(/i);
    const outputPath = localProductionReviewPath(backendRoot, 2026, '1');
    const ignored = execFileSync('git', ['check-ignore', outputPath], {
      cwd: backendRoot,
      encoding: 'utf8',
    }).trim();
    expect(ignored).toContain('pnu-course-production-review');
  });

  test('runbook contains all nine controlled steps and no credentials', () => {
    const runbook = readFileSync(
      join(backendRoot, 'PNU_COURSE_PRODUCTION_RUNBOOK.md'),
      'utf8',
    );
    for (let step = 1; step <= 9; step += 1) {
      expect(runbook).toMatch(new RegExp(`## Step ${step}:`));
    }
    expect(runbook).not.toMatch(/SUPABASE_(?:URL|KEY)\s*=\s*\S+/i);
  });
});
