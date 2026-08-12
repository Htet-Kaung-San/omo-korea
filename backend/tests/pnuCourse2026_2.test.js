const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const { getSource, readLocalPnuCourseOfferings } = require('../scripts/lib/pnuCourseOfferings.cjs');
const { SOURCE_FILE, deduplicateRestrictionsByKey, evaluateRestriction, readLocalRestrictions } = require('../scripts/lib/pnuCourseRestrictions.cjs');

const backendRoot = join(__dirname, '..');
const provenance = JSON.parse(readFileSync(join(backendRoot, 'config', 'pnu-course-provenance-2026-2.json'), 'utf8'));
const applicationManifest = JSON.parse(readFileSync(join(backendRoot, 'config', 'pnu-course-application-manifest.json'), 'utf8'));
const metadataManifestPath = join(backendRoot, 'config', 'pnu-course-metadata-2026-2.json');
const metadataManifest = JSON.parse(readFileSync(metadataManifestPath, 'utf8'));
const offeringSource = getSource(2026, '2');
const offeringPath = join(backendRoot, 'data', 'source', '2026-2', offeringSource.localFileName);
const restrictionPath = join(backendRoot, 'data', 'source', '2026-2', SOURCE_FILE);
const originalsPresent = existsSync(offeringPath) && existsSync(restrictionPath);
const sourceTest = (name, callback) => originalsPresent
  ? test(name, callback)
  : test.skip(`SKIP: ignored original XLSX files are absent - ${name}`, callback);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

describe('reviewed official PNU 2026-2 sources', () => {
  test('tracked provenance pins the complete normalized reviewed payload', () => {
    expect(provenance.schemaVersion).toBe(2);
    expect(provenance.applicationDatasetSha256).toBe(applicationManifest.datasetSha256);
    expect(provenance.applicationPackageFileSha256).toBe(applicationManifest.applicationPackageFileSha256);
    expect(provenance.reviewedMetadataPackage.manifestSha256).toBe(sha256(readFileSync(metadataManifestPath)));
    expect(provenance.sources.offeringWorkbook.sha256).toBe(applicationManifest.sourceOfferingWorkbookSha256);
    expect(provenance.sources.restrictionWorkbook.sha256).toBe(applicationManifest.sourceRestrictionWorkbookSha256);
    expect(provenance.reviewedBasePackage.courseAssignments).toHaveLength(57);
    expect(provenance.reviewedBasePackage.courseOfferings).toHaveLength(82);
    expect(provenance.reviewedBasePackage.courseRestrictions).toHaveLength(18);
    expect(provenance.reviewedBasePackage.courseRestrictionExceptions).toHaveLength(2);
    expect(provenance.reviewedBasePackage.exclusions.crossDepartmentOfficialNumbers).toBe(3);
    const payloadHash = sha256(Buffer.from(JSON.stringify({
      reviewedBasePackage: provenance.reviewedBasePackage,
      reviewedMetadataPackage: provenance.reviewedMetadataPackage,
    }), 'utf8'));
    expect(payloadHash).toBe('52fdce4ae0447a3e4a5146ba5d2610f5f66d73df42d30ab8f619b75b55561d55');
    expect(provenance.normalizedPayloadSha256).toBe(payloadHash);
  });

  sourceTest('restriction workbook parsing and checksum match tracked provenance', async () => {
    expect(sha256(readFileSync(restrictionPath))).toBe(provenance.sources.restrictionWorkbook.sha256);
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

  test('tracked metadata provenance preserves reviewed identities and explicit unknowns', () => {
    expect(provenance.reviewedMetadataPackage.identities).toHaveLength(9);
    expect(provenance.reviewedMetadataPackage).toMatchObject({ additionalOfferingIdentities: 7, metadataRows: 9 });
    expect(provenance.reviewedMetadataPackage.identities.find((row) => row.officialCourseNumber === 'CB2001111').metadata.examInformation).toBeNull();
    expect(provenance.reviewedMetadataPackage.identities.map((row) => row.officialCourseNumber).sort())
      .toEqual(metadataManifest.entries.map((row) => row.officialCourseNumber).sort());
    expect(provenance.reviewedMetadataPackage.identities.every((row) => row.evidence.sourcePdfSha256 && row.evidence.evidenceText)).toBe(true);
  });

  sourceTest('optional offering workbook verification uses the tracked aggregate', async () => {
    expect(sha256(readFileSync(offeringPath))).toBe(provenance.sources.offeringWorkbook.sha256);
    const report = await readLocalPnuCourseOfferings({ backendRoot, academicYear: 2026, semester: '2', now: () => new Date('2026-08-05T00:00:00.000Z') });
    expect(report.offeringCount).toBe(applicationManifest.counts.officialOfferings);
    expect(report.offerings.filter((row) => row.originalLanguageCode === 'E')).toHaveLength(applicationManifest.counts.sourceExplicitEnglishOfferings);
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
