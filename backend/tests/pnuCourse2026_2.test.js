const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const { readLocalPnuCourseOfferings } = require('../scripts/lib/pnuCourseOfferings.cjs');
const { deduplicateRestrictionsByKey, evaluateRestriction, readLocalRestrictions } = require('../scripts/lib/pnuCourseRestrictions.cjs');

const backendRoot = join(__dirname, '..');

describe('reviewed official PNU 2026-2 sources', () => {
  test('preserves all 4,275 offering identities and official fields', async () => {
    const report = await readLocalPnuCourseOfferings({
      backendRoot,
      academicYear: 2026,
      semester: '2',
      now: () => new Date('2026-08-05T00:00:00.000Z'),
    });
    expect(report.offeringCount).toBe(4275);
    expect(report.sheetName).toBe('sheet');
    expect(new Set(report.offerings.map((row) => [row.academicYear, row.semester, row.officialCourseNumber, row.section].join('|'))).size).toBe(4275);
    expect(report.offerings.filter((row) => row.originalLanguageCode === 'E')).toHaveLength(349);
    expect(report.offerings.every((row) => row.presentationRequirement === null && row.groupProjectRequirement === null && row.assignmentRequirement === null && row.examInformation === null)).toBe(true);
    expect(report.offerings.some((row) => row.enrollmentLimit != null)).toBe(true);
    expect(report.offerings.some((row) => row.teamTeachingStatus === 'TEAM_TAUGHT')).toBe(true);
  });

  test('preserves restrictions and exceptions without inventing structured values', async () => {
    const report = await readLocalRestrictions({ backendRoot, academicYear: 2026, semester: '2' });
    expect(report.rawRestrictionCount).toBe(1225);
    expect(report.restrictions).toHaveLength(1196);
    expect(report.duplicateRestrictionGroups).toHaveLength(25);
    expect(report.exceptions).toHaveLength(37);
    expect(report.restrictions.filter((row) => row.sourceRuleType === '학과')).toHaveLength(616);
    expect(report.restrictions.filter((row) => row.sourceRuleType === '국적')).toHaveLength(69);
    expect(report.restrictions.filter((row) => row.sourceRuleType === '학년')).toHaveLength(8);
    expect(report.restrictions.filter((row) => row.sourceRuleType === '이수학기')).toHaveLength(13);
    expect(report.restrictions.filter((row) => row.sourceRuleType === '교육과정적용학년도')).toHaveLength(319);
    expect(report.restrictions.filter((row) => row.sourceRuleType === '내외국인')).toHaveLength(171);
    expect(report.restrictions.filter((row) => row.sourceRuleType === '학년').every((row) => row.yearLevelCondition === null)).toBe(true);
    expect(report.restrictions.filter((row) => row.sourceRuleType === '이수학기').every((row) => row.completedSemestersCondition === null)).toBe(true);
  });

  test('identical source restrictions are deterministically deduplicated', () => {
    const rule = { restrictionKey: 'same-key', officialCourseNumber: 'OM2002685', section: '064', permission: 'ALLOWED' };
    expect(deduplicateRestrictionsByKey([rule, { ...rule }])).toEqual([
      { ...rule, duplicateSourceCount: 2 },
    ]);
    expect(() => deduplicateRestrictionsByKey([rule, { ...rule, permission: 'PROHIBITED' }])).toThrow(/collision/);
  });

  test('eligibility is tri-state and compound or missing conditions stay unknown', () => {
    expect(evaluateRestriction({ sourceRuleType: '학과', departmentCondition: '컴퓨터공학과', permission: 'PROHIBITED' }, { majorName: '컴퓨터공학과' })).toBe('INELIGIBLE');
    expect(evaluateRestriction({ sourceRuleType: '학과', departmentCondition: '컴퓨터공학과,전기공학과', permission: 'PROHIBITED' }, { majorName: '컴퓨터공학과' })).toBe('UNKNOWN');
    expect(evaluateRestriction({ sourceRuleType: '학년', yearLevelCondition: null, permission: 'PROHIBITED' }, { yearLevel: '2' })).toBe('UNKNOWN');
    expect(evaluateRestriction(null, {})).toBe('UNKNOWN');
  });

  test('restriction output and official source workbooks remain ignored', () => {
    for (const path of [
      join(backendRoot, 'data', 'local', 'pnu-course-restrictions', '2026-2.json'),
      join(backendRoot, 'data', 'source', '2026-2', '2. 2026학년도 2학기 학부 개설강좌일람표(26.7.27.9시 기준).xlsx'),
    ]) {
      expect(execFileSync('git', ['check-ignore', path], { cwd: backendRoot, encoding: 'utf8' })).toBeTruthy();
    }
  });

  test('additive migration is backend-only and contains no data mutation', () => {
    const sql = readFileSync(join(backendRoot, 'supabase', 'course_offering_2026_2_extensions.sql'), 'utf8');
    expect(sql).toMatch(/alter table public\.course_offering_restriction enable row level security/i);
    expect(sql).not.toMatch(/create\s+policy/i);
    expect(sql).not.toMatch(/^\s*(insert|update|delete|merge|truncate|copy)\b/im);
    expect(sql).toMatch(/department_condition text null/i);
    expect(sql).toMatch(/exception_text text null/i);
  });
});
