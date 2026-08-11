const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const {
  buildOfficialSubjects,
  createMatchingReport,
  fetchProductionCourses,
  localMatchingOutputPath,
  matchMajorScopedTarget,
  prepareEngineeringTargets,
} = require('../scripts/lib/pnuCourseMatching.cjs');

const backendRoot = join(__dirname, '..');

function offering(overrides = {}) {
  return {
    academicYear: 2026,
    semester: '1',
    officialCourseNumber: 'PNU1001',
    section: '001',
    courseName: 'Exact Course',
    credits: 3,
    courseCategory: '전공선택',
    canonicalCourseCategory: 'ELECTIVE',
    managingDepartmentName: '검토학과',
    teachingLanguage: null,
    ...overrides,
  };
}

describe('PNU permanent course and offering identity', () => {
  test('preserves one official number across multiple sections', () => {
    const result = buildOfficialSubjects([
      offering({ section: '001', professor: 'A' }),
      offering({ section: '002', professor: 'B' }),
    ]);

    expect(result.subjects).toHaveLength(1);
    expect(result.subjects[0].officialCourseNumber).toBe('PNU1001');
    expect(result.subjects[0].offerings).toHaveLength(2);
    expect(result.sharedByMultipleSections).toEqual([
      expect.objectContaining({ officialCourseNumber: 'PNU1001', offeringCount: 2 }),
    ]);
  });

  test('year, semester, official number, and section form the offering identity', () => {
    const result = buildOfficialSubjects([offering(), offering()]);
    expect(result.duplicateOfferingKeys).toEqual([
      expect.objectContaining({
        academicYear: 2026,
        semester: '1',
        officialCourseNumber: 'PNU1001',
        section: '001',
      }),
    ]);
  });

  test('ambiguous candidates are never automatically accepted', () => {
    const official = buildOfficialSubjects([offering()]);
    const curriculumBridge = new Map([
      ['PNU1001', { major_id: 46, course_name: 'Exact Course', credit: 3, category: 'ELECTIVE' }],
    ]);
    const result = matchMajorScopedTarget(
      official.subjects,
      [
        { course_id: 1, major_id: 46, course_name: 'Exact Course', credit: 3, category: 'ELECTIVE' },
        { course_id: 2, major_id: 46, course_name: 'Exact Course', credit: 3, category: 'ELECTIVE' },
      ],
      curriculumBridge,
    );

    expect(result.deterministicBackfillCandidates).toHaveLength(0);
    expect(result.ambiguous).toHaveLength(1);
  });

  test('engineering workbook row IDs are discarded and never used for matching', () => {
    const workbook = {
      sheets: {
        engineering_courses: { rows: [{ major_id: 9, major_name: 'Aerospace Engineering' }] },
        courses: {
          rows: [
            {
              course_id: 999999,
              course_name: 'Exact Course',
              credit: 3,
              major_id: 9,
              category: 'ELECTIVE',
            },
          ],
        },
      },
    };
    const mapping = {
      mappings: [
        { workbook_major_id: 9, production_major_id: 46, status: 'CONFIRMED' },
      ],
    };
    const targets = prepareEngineeringTargets(workbook, mapping);

    expect(targets[0]).not.toHaveProperty('course_id');
    expect(targets[0]).not.toHaveProperty('courseId');
    expect(targets[0]).not.toHaveProperty('workbookCourseId');
    expect(JSON.stringify(targets)).not.toContain('999999');
  });

  test('null teaching language stays unknown in dry-run English totals', () => {
    const report = createMatchingReport({
      officialSnapshot: {
        academicYear: 2026,
        semester: '1',
        sourceUrl: 'https://onestop.pusan.ac.kr/source',
        retrievedAt: '2026-08-04T00:00:00.000Z',
        offerings: [offering({ teachingLanguage: null })],
      },
      productionCourses: [],
      curriculumRows: [],
      engineeringTargets: [],
    });

    expect(report.summary.englishOfferingsLinkableAfterSafeBackfill).toBe(0);
  });
});

describe('read-only matching boundaries', () => {
  test('production access performs SELECT pagination only', async () => {
    const builder = {};
    builder.select = jest.fn(() => builder);
    builder.order = jest.fn(() => builder);
    builder.range = jest.fn(async () => ({
      data: [{ course_id: 1, course_name: 'Course', credit: 3, major_id: 46, category: 'ELECTIVE' }],
      error: null,
    }));
    const supabase = { from: jest.fn(() => builder) };

    await expect(fetchProductionCourses(supabase)).resolves.toHaveLength(1);
    expect(supabase.from).toHaveBeenCalledWith('course');
    expect(builder.select).toHaveBeenCalledWith(
      'course_id,course_name,credit,major_id,category,official_course_number',
    );
    expect(builder.range).toHaveBeenCalledTimes(1);
  });

  test('contains no Supabase write operation or executable importer', () => {
    const files = [
      join(backendRoot, 'scripts', 'match-pnu-course-offerings.mjs'),
      join(backendRoot, 'scripts', 'lib', 'pnuCourseMatching.cjs'),
    ];
    const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');
    expect(source).not.toMatch(/\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.delete\s*\(/);
    expect(source).not.toMatch(/createClient\s*\(/);
  });

  test('keeps matching reports gitignored', () => {
    const outputPath = localMatchingOutputPath(backendRoot, 2026, '1');
    const ignoredPath = execFileSync('git', ['check-ignore', outputPath], {
      cwd: backendRoot,
      encoding: 'utf8',
    }).trim();
    expect(ignoredPath).toContain('pnu-course-matches');
  });
});

describe('draft course identity and offering migration', () => {
  const identitySql = readFileSync(
    join(backendRoot, 'supabase', 'course_identity_and_offerings.sql'),
    'utf8',
  );
  const metadataSql = readFileSync(
    join(backendRoot, 'supabase', 'course_metadata.sql'),
    'utf8',
  );

  test('adds a nullable, non-overwriting official number without unsafe global uniqueness', () => {
    const courseAlterSql = identitySql.split(/create\s+table\s+if\s+not\s+exists\s+public\.course_offering/i)[0];
    expect(identitySql).toMatch(
      /add\s+column\s+if\s+not\s+exists\s+official_course_number\s+text\s+null/i,
    );
    expect(identitySql).not.toMatch(/update\s+public\.course/i);
    expect(courseAlterSql).not.toMatch(/create\s+unique\s+index/i);
    expect(courseAlterSql).not.toMatch(/add\s+constraint[^;]+unique/i);
  });

  test('enforces official and course-scoped offering uniqueness', () => {
    expect(identitySql).toMatch(
      /unique\s*\(academic_year,\s*semester,\s*official_course_number,\s*section\)/i,
    );
    expect(identitySql).toMatch(
      /unique\s*\(course_id,\s*academic_year,\s*semester,\s*section\)/i,
    );
  });

  test('keeps optional offering metadata nullable with no false or NONE defaults', () => {
    for (const column of [
      'professor',
      'year_level',
      'theory_hours',
      'practical_hours',
      'schedule',
      'classroom',
      'remote_course_status',
      'original_language_code',
      'teaching_language',
      'source_url',
      'retrieved_at',
    ]) {
      const declaration = identitySql.match(new RegExp(`^\\s*${column}\\s+[^,]+`, 'mi'))?.[0];
      expect(declaration).toBeDefined();
      expect(declaration).not.toMatch(/not null/i);
      expect(declaration).not.toMatch(/default/i);
    }
    expect(identitySql).not.toMatch(/default\s+(false|'NONE')/i);
  });

  test('enables RLS on both backend-only tables and adds no client policy', () => {
    expect(identitySql).toMatch(
      /alter\s+table\s+public\.course_offering\s+enable\s+row\s+level\s+security/i,
    );
    expect(metadataSql).toMatch(
      /alter\s+table\s+public\.course_metadata\s+enable\s+row\s+level\s+security/i,
    );
    expect(`${identitySql}\n${metadataSql}`).not.toMatch(/create\s+policy/i);
  });

  test('metadata references the offering instead of duplicating term and language fields', () => {
    expect(metadataSql).toMatch(/course_offering_id\s+bigint\s+not\s+null/i);
    expect(metadataSql).not.toMatch(/^\s*(course_id|academic_year|semester|section|teaching_language)\s+/mi);
  });
});
