const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  EXPECTED_SHEETS,
  REQUIRED_COLUMNS,
  analyzeWorkbook,
  validateWorkbook,
} = require('../scripts/lib/engineeringCourseValidation.cjs');
const mappingConfig = require('../config/engineering-course-major-mapping.json');

const backendRoot = join(__dirname, '..');
const workbookPath = join(backendRoot, 'data', 'engineering_courses.xlsx');
const mappingPath = join(backendRoot, 'config', 'engineering-course-major-mapping.json');

function fixtureWorkbook(courseOverrides = []) {
  return {
    sheetNames: [...EXPECTED_SHEETS],
    sheets: {
      courses: {
        columns: [...REQUIRED_COLUMNS.courses],
        rows: [
          {
            _rowNumber: 2,
            course_id: 1,
            course_name: 'Example Course',
            credit: 3,
            major_id: 9,
            category: 'REQUIRED',
            ...courseOverrides[0],
          },
          ...courseOverrides.slice(1).map((override, index) => ({
            _rowNumber: index + 3,
            course_id: index + 2,
            course_name: `Example Course ${index + 2}`,
            credit: 3,
            major_id: 9,
            category: 'ELECTIVE',
            ...override,
          })),
        ],
      },
      engineering_courses: {
        columns: [...REQUIRED_COLUMNS.engineering_courses],
        rows: mappingConfig.mappings.map((mapping, index) => ({
          _rowNumber: index + 2,
          major_id: mapping.workbook_major_id,
          major_name: mapping.workbook_major_name,
        })),
      },
    },
  };
}

describe('engineering course workbook validation', () => {
  test('validates required sheets and columns', () => {
    const report = analyzeWorkbook(fixtureWorkbook(), mappingConfig);

    expect(report.structureValid).toBe(true);
    expect(report.importSafe).toBe(false);
    expect(report).not.toHaveProperty('valid');
    expect(report.sheetNames).toEqual(EXPECTED_SHEETS);
    expect(report.sheets.courses.columns).toEqual(REQUIRED_COLUMNS.courses);
    expect(report.sheets.engineering_courses.columns).toEqual(
      REQUIRED_COLUMNS.engineering_courses,
    );
  });

  test('duplicate names warn without invalidating workbook structure', () => {
    const report = analyzeWorkbook(
      fixtureWorkbook([{}, { course_name: 'Example Course' }]),
      mappingConfig,
    );

    expect(report.duplicateCourseNames).toHaveLength(1);
    expect(report.structureValid).toBe(true);
    expect(report.warnings.join(' ')).toMatch(/duplicate course name/i);
  });

  test('missing official identifiers block import and expose only workbookCourseId', () => {
    const report = analyzeWorkbook(fixtureWorkbook(), mappingConfig);

    expect(report.courseIdentifierSafety).toMatchObject({
      officialProductionIdentifiersPresent: false,
      count: 1,
    });
    expect(report.warnings.join(' ')).toMatch(/not production IDs/i);
    expect(report.importSafe).toBe(false);
    expect(report.eligibleCourses).toHaveLength(0);
    expect(report.blockedCourses).toHaveLength(1);
    expect(report.blockedCourses[0]).toHaveProperty('workbookCourseId', 1);
    expect(report.blockedCourses[0]).not.toHaveProperty('courseId');
    expect(report.blockedCourses[0]).not.toHaveProperty('course_id');
    expect(report.blockedCourses[0].blockingReasons).toEqual(
      expect.arrayContaining([expect.stringMatching(/^OFFICIAL_COURSE_IDENTIFIER_MISSING:/)]),
    );
  });

  test('unresolved majors block import and never enter eligibleCourses', () => {
    const report = analyzeWorkbook(fixtureWorkbook([{ major_id: 8 }]), mappingConfig);

    expect(report.importSafe).toBe(false);
    expect(report.eligibleCourses).toHaveLength(0);
    expect(report.blockedCourses).toHaveLength(1);
    expect(report.blockedCourses[0]).toMatchObject({
      workbookMajorId: 8,
      productionMajorId: null,
    });
    expect(report.blockedCourses[0].blockingReasons).toEqual(
      expect.arrayContaining([expect.stringMatching(/^PRODUCTION_MAJOR_MAPPING_UNRESOLVED:/)]),
    );
  });

  test('detects decimal credits without rounding them', () => {
    const report = analyzeWorkbook(
      fixtureWorkbook([{ course_id: 136, credit: 1.5 }]),
      mappingConfig,
    );

    expect(report.decimalCredits).toEqual([
      expect.objectContaining({ workbookCourseId: 136, credit: 1.5 }),
    ]);
    expect(report.blockedCourses[0].blockingReasons).toEqual(
      expect.arrayContaining([expect.stringMatching(/^DECIMAL_CREDIT_REQUIRES_REVIEW:/)]),
    );
  });

  test('keeps unresolved major mappings null and explained', () => {
    const unresolved = mappingConfig.mappings.filter(
      (mapping) => mapping.production_major_id === null,
    );

    expect(unresolved.map((mapping) => mapping.workbook_major_id)).toEqual([
      8, 12, 16, 17, 18,
    ]);
    unresolved.forEach((mapping) => {
      expect(mapping.status).toBe('UNRESOLVED');
      expect(mapping.production_major_name).toBeNull();
      expect(mapping.explanation).toEqual(expect.any(String));
      expect(mapping.explanation.length).toBeGreaterThan(10);
    });
  });

  const actualWorkbookTest = existsSync(workbookPath) ? test : test.skip;
  actualWorkbookTest('validates the local engineering workbook read-only', () => {
    const report = validateWorkbook({ workbookPath, mappingPath });

    expect(report.structureValid).toBe(true);
    expect(report.importSafe).toBe(false);
    expect(report.sheets.courses.rowCount).toBe(639);
    expect(report.sheets.engineering_courses.rowCount).toBe(11);
    expect(report.duplicateWorkbookCourseIds).toHaveLength(0);
    expect(report.decimalCredits).toHaveLength(4);
    expect(report.majorMappings.unresolved).toHaveLength(5);
    expect(report.courseIdentifierSafety.officialProductionIdentifiersPresent).toBe(false);
    expect(report.eligibleCourses).toHaveLength(0);
    expect(report.blockedCourses).toHaveLength(639);
    report.blockedCourses.forEach((course) => {
      expect(course.blockingReasons).toEqual(
        expect.arrayContaining([expect.stringMatching(/^OFFICIAL_COURSE_IDENTIFIER_MISSING:/)]),
      );
    });
  });

  actualWorkbookTest('supports successful structure-only and failing import-safety CLI modes', () => {
    const scriptPath = join(backendRoot, 'scripts', 'validate-engineering-courses.mjs');
    const structureOnly = spawnSync(process.execPath, [scriptPath], {
      cwd: backendRoot,
      encoding: 'utf8',
    });
    const importSafety = spawnSync(process.execPath, [scriptPath, '--require-import-safe'], {
      cwd: backendRoot,
      encoding: 'utf8',
    });

    expect(structureOnly.status).toBe(0);
    expect(structureOnly.stdout).toMatch(/STRUCTURE VALID/);
    expect(structureOnly.stdout).toMatch(/IMPORT BLOCKED/);
    expect(importSafety.status).toBe(1);
    expect(importSafety.stdout).toMatch(/STRUCTURE VALID/);
    expect(importSafety.stdout).toMatch(/IMPORT BLOCKED/);
  });
});

describe('course_metadata draft migration', () => {
  const sql = readFileSync(join(backendRoot, 'supabase', 'course_metadata.sql'), 'utf8');
  const nullableMetadataColumns = [
    'presentation_requirement',
    'group_project_requirement',
    'assignment_requirement',
    'exam_information',
    'practical_type',
  ];

  test('keeps metadata nullable and gives it no false or NONE defaults', () => {
    nullableMetadataColumns.forEach((column) => {
      const declaration = sql.match(new RegExp(`^\\s*${column}\\s+[^,]+`, 'mi'))?.[0];
      expect(declaration).toBeDefined();
      expect(declaration).not.toMatch(/not null/i);
      expect(declaration).not.toMatch(/default/i);
    });
    expect(sql).not.toMatch(/default\s+(false|'NONE')/i);
  });

  test('allows NULL explicitly in every constrained metadata enum', () => {
    for (const column of [
      'presentation_requirement',
      'group_project_requirement',
      'assignment_requirement',
      'practical_type',
    ]) {
      expect(sql).toMatch(new RegExp(`${column}\\s+is\\s+null`, 'i'));
    }
  });

  test('enables RLS without adding public client policies', () => {
    expect(sql).toMatch(
      /alter\s+table\s+public\.course_metadata\s+enable\s+row\s+level\s+security\s*;/i,
    );
    expect(sql).not.toMatch(/create\s+policy/i);
  });
});
