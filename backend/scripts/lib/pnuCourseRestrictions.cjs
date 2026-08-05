const { createHash } = require('node:crypto');
const { mkdir, readFile, writeFile } = require('node:fs/promises');
const { dirname, join, resolve, sep } = require('node:path');

const { readXlsxWorkbookBuffer } = require('./engineeringCourseValidation.cjs');

const SOURCE_FILE = '3. 2026학년도 2학기 학부 수강신청 제한 교과목 현황(26.7.27. 9시 기준).xlsx';
const RESTRICTION_SHEET = '26-2학기 수강신청 제한 교과목';
const EXCEPTION_SHEET = '26-2학기 수강신청제한 예외내역';
const RULE_TYPES = new Set(['학과', '학년', '내외국인', '국적', '교육과정적용학년도', '이수학기']);

function nullableString(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function rowsFromSheet(sheet, requiredHeaders) {
  const headerIndex = sheet.rawRows.findIndex((row) => requiredHeaders.every((header) => row.includes(header)));
  if (headerIndex < 0) throw new Error(`Header row not found in ${sheet.name}`);
  const headers = sheet.rawRows[headerIndex].map(nullableString);
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`${sheet.name} is missing headers: ${missing.join(', ')}`);
  const rows = sheet.rawRows.slice(headerIndex + 1)
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]])))
    .filter((row) => nullableString(row['교과목번호']) && nullableString(row['분반']));
  return { headers, rows };
}

function ruleKey(rule) {
  return createHash('sha256').update(JSON.stringify(rule)).digest('hex');
}

function deduplicateRestrictionsByKey(rows) {
  const byKey = new Map();
  for (const row of rows || []) {
    const existing = byKey.get(row.restrictionKey);
    if (!existing) {
      byKey.set(row.restrictionKey, { ...row, duplicateSourceCount: 1 });
      continue;
    }
    const comparableExisting = { ...existing };
    delete comparableExisting.duplicateSourceCount;
    const comparableRow = { ...row };
    delete comparableRow.duplicateSourceCount;
    if (JSON.stringify(comparableExisting) !== JSON.stringify(comparableRow)) {
      throw new Error(`Restriction key collision with different semantic fields: ${row.restrictionKey}`);
    }
    existing.duplicateSourceCount += 1;
  }
  return [...byKey.values()];
}

function parseRestrictionWorkbook(buffer, context) {
  const workbook = readXlsxWorkbookBuffer(buffer);
  const restrictionSheet = workbook.sheets[RESTRICTION_SHEET];
  const exceptionSheet = workbook.sheets[EXCEPTION_SHEET];
  if (!restrictionSheet || !exceptionSheet) throw new Error('Official restriction workbook sheets do not match the reviewed structure');

  const restrictionRows = rowsFromSheet(restrictionSheet, [
    '개설대학', '개설학과명', '교과목번호', '교과목명', '분반', '제한구분', '수강여부',
    '학과명', '학년', '내외국인', '국적', '적용학년도', '이수학기수', '학적상태', '학위과정', '수강제한사유',
  ]);
  const exceptionRows = rowsFromSheet(exceptionSheet, [
    '개설대학', '개설학과명', '교과목번호', '교과목명', '분반', '예외내역',
  ]);

  const rawRestrictions = restrictionRows.rows.map((row) => {
    const sourceRuleType = nullableString(row['제한구분']);
    if (!RULE_TYPES.has(sourceRuleType)) throw new Error(`Unreviewed restriction type: ${sourceRuleType}`);
    const sourcePermission = nullableString(row['수강여부']);
    const permission = sourcePermission === '수강가능' ? 'ALLOWED' : sourcePermission === '수강불가' ? 'PROHIBITED' : null;
    if (!permission) throw new Error(`Unreviewed registration permission: ${sourcePermission}`);
    const rule = {
      academicYear: context.academicYear,
      semester: context.semester,
      officialCourseNumber: nullableString(row['교과목번호']),
      section: nullableString(row['분반']),
      offeringCollegeName: nullableString(row['개설대학']),
      offeringDepartmentName: nullableString(row['개설학과명']),
      courseName: nullableString(row['교과목명']),
      generalEducationArea: nullableString(row['영역명']),
      sourceRuleType,
      permission,
      departmentCondition: nullableString(row['학과명']),
      yearLevelCondition: nullableString(row['학년']),
      domesticForeignCondition: nullableString(row['내외국인']),
      nationalityCondition: nullableString(row['국적']),
      curriculumYearCondition: nullableString(row['적용학년도']),
      completedSemestersCondition: nullableString(row['이수학기수']),
      academicStatusCondition: nullableString(row['학적상태']),
      degreeProgramCondition: nullableString(row['학위과정']),
      reason: nullableString(row['수강제한사유']),
      sourceFileName: context.sourceFileName,
    };
    return { restrictionKey: ruleKey(rule), ...rule };
  });

  const restrictions = deduplicateRestrictionsByKey(rawRestrictions);
  const exceptions = exceptionRows.rows.map((row) => {
    const exception = {
      academicYear: context.academicYear,
      semester: context.semester,
      officialCourseNumber: nullableString(row['교과목번호']),
      section: nullableString(row['분반']),
      offeringCollegeName: nullableString(row['개설대학']),
      offeringDepartmentName: nullableString(row['개설학과명']),
      courseName: nullableString(row['교과목명']),
      exceptionText: nullableString(row['예외내역']),
      sourceFileName: context.sourceFileName,
    };
    return { restrictionKey: ruleKey(exception), ...exception };
  });

  return {
    sheetNames: workbook.sheetNames,
    sourceHeaders: {
      restrictions: restrictionRows.headers,
      exceptions: exceptionRows.headers,
    },
    rawRestrictionCount: rawRestrictions.length,
    duplicateRestrictionGroups: restrictions
      .filter((row) => row.duplicateSourceCount > 1)
      .map((row) => ({
        restrictionKey: row.restrictionKey,
        duplicateSourceCount: row.duplicateSourceCount,
        officialCourseNumber: row.officialCourseNumber,
        section: row.section,
      })),
    restrictions,
    exceptions,
  };
}

function evaluateRestriction(rule, student) {
  if (!rule || !student) return 'UNKNOWN';
  const fields = {
    학과: ['departmentCondition', 'majorName'],
    학년: ['yearLevelCondition', 'yearLevel'],
    내외국인: ['domesticForeignCondition', 'domesticForeignStatus'],
    국적: ['nationalityCondition', 'nationality'],
    교육과정적용학년도: ['curriculumYearCondition', 'curriculumYear'],
    이수학기: ['completedSemestersCondition', 'completedSemesters'],
  };
  const pair = fields[rule.sourceRuleType];
  if (!pair || rule[pair[0]] == null || student[pair[1]] == null) return 'UNKNOWN';
  // Only exact, atomic equality is safe here. Compound/range/free-text rules stay unknown.
  const condition = String(rule[pair[0]]).trim();
  const studentValue = String(student[pair[1]]).trim();
  if (/[~,·,/,]|이상|이하|초과|미만|제외|및|또는/.test(condition)) return 'UNKNOWN';
  if (condition !== studentValue) return 'UNKNOWN';
  return rule.permission === 'ALLOWED' ? 'ELIGIBLE' : rule.permission === 'PROHIBITED' ? 'INELIGIBLE' : 'UNKNOWN';
}

async function readLocalRestrictions({ backendRoot, academicYear, semester, now = () => new Date() }) {
  if (academicYear !== 2026 || String(semester) !== '2') throw new Error('Only the reviewed 2026-2 restriction workbook is configured');
  const sourcePath = join(backendRoot, 'data', 'source', '2026-2', SOURCE_FILE);
  const parsed = parseRestrictionWorkbook(await readFile(sourcePath), { academicYear, semester: String(semester), sourceFileName: SOURCE_FILE });
  return {
    academicYear,
    semester: String(semester),
    sourceFileName: SOURCE_FILE,
    retrievedAt: now().toISOString(),
    rawRestrictionCount: parsed.rawRestrictionCount,
    restrictionCount: parsed.restrictions.length,
    exceptionCount: parsed.exceptions.length,
    ...parsed,
  };
}

async function writeLocalRestrictionOutput(report, backendRoot) {
  const outputRoot = resolve(backendRoot, 'data', 'local', 'pnu-course-restrictions');
  const outputPath = resolve(outputRoot, `${report.academicYear}-${report.semester}.json`);
  if (!outputPath.startsWith(`${outputRoot}${sep}`)) throw new Error('Refusing to write outside the gitignored restriction directory');
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return outputPath;
}

module.exports = {
  EXCEPTION_SHEET,
  RESTRICTION_SHEET,
  RULE_TYPES,
  SOURCE_FILE,
  deduplicateRestrictionsByKey,
  evaluateRestriction,
  parseRestrictionWorkbook,
  readLocalRestrictions,
  writeLocalRestrictionOutput,
};
