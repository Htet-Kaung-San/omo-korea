const { validateDataset, buildDryRunReport } = require('../scripts/lib/businessCourseOfferingsDryRun.cjs');

function dataset() {
  return {
    schemaVersion: 1,
    academicYear: 2026,
    semester: '2',
    department: { majorId: 73 },
    sourceUrl: 'https://example.test/catalog',
    retrievedAt: '2026-08-16T00:00:00.000Z',
    expectedCourseCount: 1,
    expectedOfferingCount: 1,
    offerings: [{ courseId: 6152, courseName: 'AI비즈니스', officialCourseNumber: 'DB2003066', section: '091', professor: '홍태호', yearLevel: '3', credits: 3, schedule: '월 15:00-18:00 514-313', classroom: '514-313', remoteCourseStatus: 'NOT_REMOTE', originalLanguageCode: null, teachingLanguage: null }],
  };
}

function course(overrides = {}) {
  return { course_id: 6152, course_name: 'AI비즈니스', credit: 3, major_id: 73, official_course_number: null, ...overrides };
}

function dryRun(overrides = {}) {
  return buildDryRunReport({ dataset: dataset(), productionCourses: [course()], productionOfferings: [], now: () => new Date('2026-08-17T00:00:00.000Z'), ...overrides });
}

test('valid reviewed row proposes one insert and one official-number backfill without writing', () => {
  const report = dryRun();
  expect(report.summary).toMatchObject({ proposedCourseNumberBackfills: 1, proposedOfferingInserts: 1, blocked: 0, writesPerformed: 0 });
});

test('an exact existing offering is a no-op', () => {
  const proposed = dryRun().proposedOfferingInserts[0];
  const report = dryRun({ productionCourses: [course({ official_course_number: 'DB2003066' })], productionOfferings: [{ course_offering_id: 10, ...proposed }] });
  expect(report.summary).toMatchObject({ proposedCourseNumberBackfills: 0, proposedOfferingInserts: 0, noops: 1, blocked: 0 });
});

test('blocks an official identity owned by another course', () => {
  const proposed = dryRun().proposedOfferingInserts[0];
  const report = dryRun({ productionOfferings: [{ ...proposed, course_id: 9999 }] });
  expect(report.blocked[0].reasons).toContain('OFFICIAL_IDENTITY_OWNED_BY_ANOTHER_COURSE');
});

test.each([
  ['course_name', 'Different', 'COURSE_NAME_MISMATCH'],
  ['major_id', 99, 'MAJOR_MISMATCH'],
  ['credit', 2, 'CREDIT_MISMATCH'],
])('blocks production %s drift', (field, value, reason) => {
  const report = dryRun({ productionCourses: [course({ [field]: value })] });
  expect(report.blocked[0].reasons).toContain(reason);
});

test('rejects duplicate reviewed identities', () => {
  const invalid = dataset();
  invalid.offerings.push({ ...invalid.offerings[0] });
  invalid.expectedOfferingCount = 2;
  expect(() => validateDataset(invalid)).toThrow(/duplicates official identity/);
});
