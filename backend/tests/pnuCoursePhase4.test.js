const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const { recommendCourses } = require('../ai/courseRecommendationEngine');
const {
  fetchAllCourses,
  fetchStudentCourseHistory,
  mapCourseOfferingRow,
} = require('../ai/supabaseDataRepository');
const {
  createBackfillDryRunReport,
  localDryRunOutputPath,
  reviewBackfillCandidates,
} = require('../scripts/lib/pnuCourseBackfillDryRun.cjs');

const backendRoot = join(__dirname, '..');

function candidate(overrides = {}) {
  return {
    official: {
      officialCourseNumber: 'PNU1001',
      courseName: 'Exact Course',
      credit: 3,
      category: 'ELECTIVE',
    },
    target: {
      courseId: 10,
      courseName: 'Exact Course',
      credit: 3,
      majorId: 46,
      category: 'ELECTIVE',
    },
    method: 'CURRICULUM_MAJOR_BRIDGE_PLUS_EXACT_NAME_CREDIT_CATEGORY_ONE_TO_ONE',
    ...overrides,
  };
}

function matchingReport(candidates = [candidate()], variations = []) {
  return {
    generatedAt: '2026-08-04T00:00:00.000Z',
    officialIdentityAudit: { managingDepartmentVariations: variations },
    dryRunBackfillPlan: { productionCourseOfficialNumberBackfills: candidates },
  };
}

function productionCourse(overrides = {}) {
  return {
    course_id: 10,
    course_name: 'Exact Course',
    credit: 3,
    major_id: 46,
    category: 'ELECTIVE',
    ...overrides,
  };
}

function coursePage(data) {
  const query = {};
  query.select = jest.fn(() => query);
  query.order = jest.fn(() => query);
  query.range = jest.fn(async () => ({ data, error: null }));
  return query;
}

function offeringPage(result) {
  const query = {};
  query.select = jest.fn(() => query);
  query.eq = jest.fn(() => query);
  query.order = jest.fn(() => query);
  query.range = jest.fn(async () => result);
  return query;
}

describe('strict Phase 4 candidate review', () => {
  test('approves only a fully reverified one-to-one candidate', () => {
    const result = reviewBackfillCandidates({
      matchingReport: matchingReport(),
      productionCourses: [productionCourse()],
    });
    expect(result.approvedCandidates).toHaveLength(1);
    expect(result.rejectedCandidates).toHaveLength(0);
    expect(result.ambiguousCandidates).toHaveLength(0);
  });

  test('rejects a production record changed since matching', () => {
    const result = reviewBackfillCandidates({
      matchingReport: matchingReport(),
      productionCourses: [productionCourse({ course_name: 'Changed Course' })],
    });
    expect(result.approvedCandidates).toHaveLength(0);
    expect(result.changedProductionRecords).toHaveLength(1);
    expect(result.rejectedCandidates[0].rejectionReasons.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'PRODUCTION_RECORD_CHANGED_SINCE_MATCH_REPORT',
        'COURSE_NAME_MISMATCH',
      ]),
    );
  });

  test('rejects an official snapshot changed since matching', () => {
    const result = reviewBackfillCandidates({
      matchingReport: matchingReport(),
      productionCourses: [productionCourse()],
      officialSnapshot: {
        offerings: [
          {
            officialCourseNumber: 'PNU1001',
            academicYear: 2026,
            semester: '1',
            section: '001',
            courseName: 'Changed Official Course',
            credits: 3,
            canonicalCourseCategory: 'ELECTIVE',
            managingDepartmentName: '검토학과',
          },
        ],
      },
    });
    expect(result.approvedCandidates).toHaveLength(0);
    expect(result.rejectedCandidates[0].rejectionReasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'OFFICIAL_SNAPSHOT_CHANGED_SINCE_MATCH_REPORT' }),
      ]),
    );
  });

  test('never approves a cross-department or competing identity', () => {
    const second = candidate({
      official: { ...candidate().official, officialCourseNumber: 'PNU1002' },
    });
    const competing = reviewBackfillCandidates({
      matchingReport: matchingReport([candidate(), second]),
      productionCourses: [productionCourse()],
    });
    expect(competing.approvedCandidates).toHaveLength(0);
    expect(competing.ambiguousCandidates).toHaveLength(2);

    const crossDepartment = reviewBackfillCandidates({
      matchingReport: matchingReport(
        [candidate()],
        [{ officialCourseNumber: 'PNU1001', managingDepartments: ['A', 'B'] }],
      ),
      productionCourses: [productionCourse()],
    });
    expect(crossDepartment.approvedCandidates).toHaveLength(0);
    expect(crossDepartment.ambiguousCandidates[0].ambiguityReasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'CROSS_DEPARTMENT_IDENTITY_CONFLICT' }),
      ]),
    );
  });

  test('creates proposals only for strictly approved candidates', () => {
    const report = createBackfillDryRunReport({
      matchingReport: matchingReport(),
      productionCourses: [productionCourse()],
      officialSnapshot: {
        academicYear: 2026,
        semester: '1',
        retrievedAt: '2026-08-04T00:00:00.000Z',
        offerings: [
          {
            officialCourseNumber: 'PNU1001',
            academicYear: 2026,
            semester: '1',
            section: '001',
            courseName: 'Exact Course',
            credits: 3,
            canonicalCourseCategory: 'ELECTIVE',
            managingDepartmentName: '검토학과',
            teachingLanguage: 'ENGLISH',
          },
        ],
      },
      now: () => new Date('2026-08-04T01:00:00.000Z'),
    });
    expect(report.summary).toMatchObject({
      approvedCandidates: 1,
      proposedCourseNumberAssignments: 1,
      proposedCourseOfferingRows: 1,
      proposedEnglishOfferingRows: 1,
    });
    expect(report.proposedCourseOfferingRows[0]).toMatchObject({
      course_id: 10,
      official_course_number: 'PNU1001',
      section: '001',
      classroom: null,
    });
  });
});

describe('backward-compatible course offering API support', () => {
  test('does not query course_offering when disabled and returns nullable fields', async () => {
    const courseQuery = coursePage([productionCourse()]);
    const supabase = { from: jest.fn(() => courseQuery) };
    const result = await fetchAllCourses(supabase);
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(result[0]).toMatchObject({
      officialCourseNumber: null,
      academicYear: null,
      teachingLanguage: null,
      isEnglishTaught: null,
    });
  });

  test('falls back safely when the optional table does not exist', async () => {
    const courseQuery = coursePage([productionCourse()]);
    const missingOfferingQuery = offeringPage({
      data: null,
      error: { code: '42P01', message: 'relation course_offering does not exist' },
    });
    const supabase = {
      from: jest.fn((table) => (table === 'course' ? courseQuery : missingOfferingQuery)),
    };
    await expect(
      fetchAllCourses(supabase, {
        includeOfferings: true,
        offeringAcademicYear: 2026,
        offeringSemester: '1',
      }),
    ).resolves.toEqual([
      expect.objectContaining({ id: '10', teachingLanguage: null, isEnglishTaught: null }),
    ]);
  });

  test('preserves explicit English, explicit non-English, and null language states', () => {
    expect(
      mapCourseOfferingRow({ original_language_code: 'E', teaching_language: 'ENGLISH' }),
    ).toMatchObject({ isEnglishTaught: true });
    expect(
      mapCourseOfferingRow({ original_language_code: 'C', teaching_language: 'OTHER' }),
    ).toMatchObject({ isEnglishTaught: false });
    expect(
      mapCourseOfferingRow({ original_language_code: '', teaching_language: null }),
    ).toMatchObject({
      originalLanguageCode: null,
      teachingLanguage: null,
      isEnglishTaught: null,
      academicYear: null,
      theoryHours: null,
      practicalHours: null,
    });
    expect(
      mapCourseOfferingRow({ original_language_code: null, teaching_language: 'MIXED' }),
    ).toMatchObject({ teachingLanguage: 'MIXED', isEnglishTaught: null });
  });

  test('maps Korean, numeric, and all-years offering levels deterministically', () => {
    expect(mapCourseOfferingRow({ year_level: '2학년' }).year).toBe(2);
    expect(mapCourseOfferingRow({ year_level: '3' }).year).toBe(3);
    expect(mapCourseOfferingRow({ year_level: '전학년' }).year).toBe('ALL');
    expect(mapCourseOfferingRow({ year_level: null }).year).toBeNull();
  });

  test('does not choose arbitrarily among multiple sections', async () => {
    const courseQuery = coursePage([productionCourse()]);
    const offeringQuery = offeringPage({
      data: [
        { course_id: 10, section: '001', original_language_code: 'E' },
        { course_id: 10, section: '002', original_language_code: null },
      ],
      error: null,
    });
    const supabase = {
      from: jest.fn((table) => (table === 'course' ? courseQuery : offeringQuery)),
    };
    const result = await fetchAllCourses(supabase, {
      includeOfferings: true,
      offeringAcademicYear: 2026,
      offeringSemester: '1',
    });
    expect(result[0]).toMatchObject({ section: null, isEnglishTaught: null });
  });

  test('offering metadata does not affect recommendation order or fabricate assessments', () => {
    const courses = [
      { id: '2', nameEn: 'Beta', majorId: '46', type: 'ELECTIVE', tags: [] },
      { id: '1', nameEn: 'Alpha', majorId: '46', type: 'ELECTIVE', tags: [] },
    ];
    const profile = { majorId: '46', interests: [] };
    const baseline = recommendCourses(profile, courses).map((item) => item.id);
    const enriched = recommendCourses(
      profile,
      courses.map((course, index) => ({
        ...course,
        teachingLanguage: index === 0 ? 'ENGLISH' : null,
        isEnglishTaught: index === 0 ? true : null,
        professor: index === 0 ? 'Professor' : null,
      })),
    );
    expect(enriched.map((item) => item.id)).toEqual(baseline);
    for (const item of enriched) {
      expect(item).not.toHaveProperty('presentationRequirement');
      expect(item).not.toHaveProperty('groupProjectRequirement');
      expect(item).not.toHaveProperty('assignmentRequirement');
      expect(item).not.toHaveProperty('examInformation');
    }
  });
});

describe('fetchStudentCourseHistory', () => {
  test('paginates deterministically and preserves status and semester', async () => {
    const pages = [
      [
        { course_id: 10, status: 'Completed', semester: '2025-Fall' },
        { course_id: 11, status: 'Enrolled', semester: '2026-Fall' },
      ],
      [{ course_id: 12, status: null, semester: null }],
    ];
    let page = 0;
    const query = {};
    query.select = jest.fn(() => query);
    query.eq = jest.fn(() => query);
    query.order = jest.fn(() => query);
    query.range = jest.fn(async () => ({ data: pages[page++], error: null }));
    const supabase = { from: jest.fn(() => query) };

    const result = await fetchStudentCourseHistory(supabase, 'student-1', { pageSize: 2 });

    expect(query.eq).toHaveBeenCalledWith('student_id', 'student-1');
    expect(query.order).toHaveBeenCalledWith('enrollment_id', { ascending: true });
    expect(query.range.mock.calls).toEqual([[0, 1], [2, 3]]);
    expect(result).toEqual([
      { courseId: '10', status: 'Completed', semester: '2025-Fall' },
      { courseId: '11', status: 'Enrolled', semester: '2026-Fall' },
      { courseId: '12', status: null, semester: null },
    ]);
  });
});

describe('Phase 4 safety boundaries', () => {
  test('dry-run source has no database mutation capability', () => {
    const files = [
      join(backendRoot, 'scripts', 'dry-run-pnu-course-backfill.mjs'),
      join(backendRoot, 'scripts', 'lib', 'pnuCourseBackfillDryRun.cjs'),
    ];
    const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');
    expect(source).not.toMatch(/\.(insert|update|delete|upsert|rpc)\s*\(/i);
    expect(source).not.toMatch(/createClient\s*\(/);
  });

  test('keeps dry-run output gitignored', () => {
    const outputPath = localDryRunOutputPath(backendRoot, 2026, '1');
    const ignoredPath = execFileSync('git', ['check-ignore', outputPath], {
      cwd: backendRoot,
      encoding: 'utf8',
    }).trim();
    expect(ignoredPath).toContain('pnu-course-backfill-dry-run');
  });

  test('migration sequence retains RLS and has no public policies', () => {
    const files = [
      join(backendRoot, 'supabase', 'course_identity_and_offerings.sql'),
      join(backendRoot, 'supabase', 'course_metadata.sql'),
    ];
    const sql = files.map((file) => readFileSync(file, 'utf8')).join('\n');
    expect(sql).toMatch(/alter\s+table\s+public\.course_offering\s+enable\s+row\s+level\s+security/i);
    expect(sql).toMatch(/alter\s+table\s+public\.course_metadata\s+enable\s+row\s+level\s+security/i);
    expect(sql).not.toMatch(/create\s+policy/i);
  });

  test('migration files define each new table in only one sequence step', () => {
    const identitySql = readFileSync(
      join(backendRoot, 'supabase', 'course_identity_and_offerings.sql'),
      'utf8',
    );
    const metadataSql = readFileSync(
      join(backendRoot, 'supabase', 'course_metadata.sql'),
      'utf8',
    );
    expect(identitySql.match(/create\s+table\s+if\s+not\s+exists\s+public\.course_offering/gi)).toHaveLength(1);
    expect(identitySql.match(/create\s+table\s+if\s+not\s+exists\s+public\.course_metadata/gi) || []).toHaveLength(0);
    expect(metadataSql.match(/create\s+table\s+if\s+not\s+exists\s+public\.course_metadata/gi)).toHaveLength(1);
    expect(metadataSql.match(/create\s+table\s+if\s+not\s+exists\s+public\.course_offering/gi) || []).toHaveLength(0);
  });
});
