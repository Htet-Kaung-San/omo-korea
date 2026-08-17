const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const {
  SOURCE_SHA256,
  auditAppliedDataset,
  authorizeApply,
  buildBaseDataset,
  normalizedSourceSha256,
  readSource,
} = require('../scripts/lib/businessCurriculumImport.cjs');

const backendRoot = join(__dirname, '..');
const sourcePath = join(
  backendRoot,
  'data',
  'source',
  'business-administration',
  'PNU_business_administration_combined_datalist.csv',
);

describe('reviewed Business Administration curriculum import', () => {
  test('pins and validates the clean 84-course source file', () => {
    const bytes = readFileSync(sourcePath);
    const rows = readSource(sourcePath);

    expect(normalizedSourceSha256(bytes)).toBe(SOURCE_SHA256);
    expect(rows).toHaveLength(84);
    expect(rows.filter((row) => row.category === 'REQUIRED')).toHaveLength(13);
    expect(rows.filter((row) => row.category === 'ELECTIVE')).toHaveLength(71);
    expect(new Set(rows.map((row) => row.source_course_code)).size).toBe(84);
    expect(new Set(rows.map((row) => row.course_name_ko)).size).toBe(84);
    expect(rows.filter((row) => row.course_name_en === 'Business History')).toHaveLength(2);
    expect(rows.some((row) => row.grade_semester === '2-여름도약')).toBe(true);
  });

  test('expands the source into 160 curriculum-year mappings', () => {
    const dataset = buildBaseDataset(readSource(sourcePath));

    expect(dataset.curriculumRows).toHaveLength(160);
    expect(dataset.major).toEqual({
      major_id: 73,
      major_name: 'Business Administration',
      college_id: 4,
      college_name: 'College of Business',
    });
  });

  test('requires both a review flag and exact checksum before apply mode', () => {
    expect(authorizeApply({ apply: false }, {})).toEqual({ dryRun: true });
    expect(() =>
      authorizeApply({ apply: true, expectedChecksum: 'a'.repeat(64) }, {}),
    ).toThrow('BUSINESS_CURRICULUM_APPROVED=true');
    expect(() =>
      authorizeApply({ apply: true, expectedChecksum: 'short' }, {
        BUSINESS_CURRICULUM_APPROVED: 'true',
      }),
    ).toThrow('64-character SHA-256');
  });

  test('recognizes the reviewed curriculum after the 49 new courses are applied', () => {
    const dataset = buildBaseDataset(readSource(sourcePath));
    const businessRows = dataset.sourceCourses.map((course, index) => ({
      course_id: 6000 + index,
      course_name: course.course_name_ko,
      credit: course.credit,
      major_id: 73,
      category: course.category,
    }));
    const unrelatedRows = Array.from({ length: 1924 - businessRows.length }, (_, index) => ({
      course_id: index + 1,
      course_name: `Other course ${index + 1}`,
      credit: 3,
      major_id: 1,
      category: 'ELECTIVE',
    }));

    expect(auditAppliedDataset(dataset, [...unrelatedRows, ...businessRows])).toEqual({
      mode: 'ALREADY_APPLIED_READ_ONLY_AUDIT',
      counts: {
        productionCourses: 1924,
        businessCourses: 84,
        matchedSourceCourses: 84,
        curriculumRowsExpected: 160,
      },
    });
  });

  test('migration keeps curriculum backend-only and pins the reviewed snapshot', () => {
    const sql = readFileSync(join(backendRoot, 'supabase', 'business_curriculum.sql'), 'utf8');

    expect(sql).toContain('alter table public.course_curriculum enable row level security');
    expect(sql).toContain(
      'revoke all on function public.apply_reviewed_business_curriculum(jsonb, text)',
    );
    expect(sql).toContain('5ce18178c2403ebe85c35ae6515c25f8f7cc6921fab32a2118e7c1711fc76d54');
    expect(sql).toContain("course_id = 5934");
    expect(sql).toContain("official_course_number = 'DB1600358'");
  });
});
