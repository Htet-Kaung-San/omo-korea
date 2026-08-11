const { createHash } = require('crypto');
const { mkdtemp, rm, writeFile } = require('fs/promises');
const { readFileSync } = require('fs');
const { join } = require('path');
const { tmpdir } = require('os');
const { execFileSync } = require('child_process');

const {
  createMetadataDryRunReport,
  validateManifest,
  validateResolutionPlan,
  verifySourceChecksums,
} = require('../scripts/lib/pnuCourseMetadata.cjs');
const {
  attachCourseOffering,
  mapCourseMetadataRow,
} = require('../ai/supabaseDataRepository');
const { recommendCourses } = require('../ai/courseRecommendationEngine');

const backendRoot = join(__dirname, '..');
const manifestPath = join(backendRoot, 'config', 'pnu-course-metadata-2026-2.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const resolutionPath = join(backendRoot, 'config', 'pnu-course-metadata-resolutions-2026-2.json');
const resolutionPlan = JSON.parse(readFileSync(resolutionPath, 'utf8'));

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function offeringSnapshotBytes(plan) {
  return Buffer.from(JSON.stringify({
    offerings: plan.entries.map((entry) => ({
      academicYear: plan.academicYear,
      semester: plan.semester,
      officialCourseNumber: entry.officialCourseNumber,
      section: plan.section,
      managingDepartmentName: plan.officialManagingDepartmentName,
      courseName: entry.officialCourseName,
      canonicalCourseCategory: entry.category,
      credits: entry.credit,
      yearLevel: entry.yearLevel,
      theoryHours: entry.theoryHours,
      practicalHours: entry.practicalHours,
      enrollmentLimit: entry.enrollmentLimit,
      professor: entry.professor,
      schedule: entry.schedule,
      classroom: entry.classroom,
      remoteCourseStatus: entry.remoteCourseStatus,
      originalLanguageCode: entry.originalLanguageCode,
      teachingLanguage: entry.teachingLanguage,
      teamTeachingStatus: entry.teamTeachingStatus,
      generalEducationArea: entry.generalEducationArea,
      remarks: entry.remarks,
      sourceUrl: entry.sourceUrl,
      retrievedAt: entry.retrievedAt,
    })),
  }));
}

function readOnlySupabase(fixtures) {
  return {
    from: jest.fn((table) => {
      const filters = [];
      let selected = '';
      const query = {
        select: jest.fn((value) => { selected = value; return query; }),
        eq: jest.fn((field, value) => { filters.push(['eq', field, value]); return query; }),
        in: jest.fn((field, values) => { filters.push(['in', field, values]); return query; }),
        then: (resolve) => {
          const rows = (fixtures[table] || []).filter((row) => filters.every(([kind, field, value]) => (
            kind === 'eq' ? String(row[field]) === String(value) : value.some((item) => String(item) === String(row[field]))
          )));
          return resolve({ data: rows.map((row) => {
            const fields = selected.split(',');
            return Object.fromEntries(fields.map((field) => [field, row[field]]));
          }), error: null });
        },
      };
      return query;
    }),
  };
}

describe('reviewed 2026-2 syllabus metadata manifest', () => {
  test('contains all nine exact official-number, term, and section identities', () => {
    expect(validateManifest(manifest)).toEqual([]);
    expect(manifest.entries).toHaveLength(9);
    expect(manifest.entries.map((entry) => `${entry.officialCourseNumber}|2026|2|${entry.section}`))
      .toEqual([
        'CB1501019|2026|2|059',
        'CB1501022|2026|2|059',
        'CB2001103|2026|2|059',
        'CB2001105|2026|2|059',
        'CB2001106|2026|2|059',
        'CB1501024|2026|2|059',
        'CB2001111|2026|2|059',
        'CB2001610|2026|2|059',
        'CB2001125|2026|2|059',
      ]);
  });

  test('preserves verified requirements and unknown values exactly', () => {
    const byNumber = new Map(manifest.entries.map((entry) => [entry.officialCourseNumber, entry]));
    expect(byNumber.get('CB2001125')).toMatchObject({
      presentationRequirement: 'REQUIRED',
      groupProjectRequirement: 'REQUIRED',
      assignmentRequirement: 'REQUIRED',
    });
    expect(byNumber.get('CB2001103')).toMatchObject({
      presentationRequirement: 'REQUIRED',
      groupProjectRequirement: null,
      assignmentRequirement: 'REQUIRED',
    });
    expect(byNumber.get('CB2001111')).toMatchObject({
      presentationRequirement: null,
      groupProjectRequirement: null,
      assignmentRequirement: null,
      examInformation: null,
    });
    for (const number of [
      'CB1501022',
      'CB2001103',
      'CB2001105',
      'CB2001106',
      'CB1501024',
      'CB2001610',
      'CB2001125',
    ]) {
      expect(byNumber.get(number).assignmentRequirement).toBe('REQUIRED');
    }
  });

  test('rejects duplicate metadata identities', () => {
    const duplicate = { ...manifest, entries: [...manifest.entries, manifest.entries[0]] };
    expect(validateManifest(duplicate)).toContain('duplicate metadata identity: CB1501019|2026|2|059');
  });

  test('pins seven unique reviewed existing-course resolutions without workbook row IDs', () => {
    expect(validateResolutionPlan(resolutionPlan, manifest)).toEqual([]);
    expect(resolutionPlan.entries).toHaveLength(7);
    expect(new Set(resolutionPlan.entries.map((entry) => entry.courseId)).size).toBe(7);
    expect(resolutionPlan.productionMajor).toEqual({
      majorId: 8,
      majorName: 'Computer Science and Engineering',
      department: 'ICE Department',
    });
    expect(JSON.stringify(resolutionPlan)).not.toMatch(/workbook(?:Course)?Id/i);
  });
});

describe('source checksum and production dry-run safety', () => {
  let sourceDirectory;

  beforeEach(async () => {
    sourceDirectory = await mkdtemp(join(tmpdir(), 'pnu-course-metadata-'));
  });

  afterEach(async () => {
    await rm(sourceDirectory, { recursive: true, force: true });
  });

  async function localManifestWithFiles() {
    const entries = [];
    for (const [index, entry] of manifest.entries.entries()) {
      const content = Buffer.from(`reviewed-pdf-${index}`);
      await writeFile(join(sourceDirectory, entry.sourcePdfFilename), content);
      entries.push({ ...entry, sourcePdfSha256: sha256(content) });
    }
    return { ...manifest, entries };
  }

  test('validates source PDF checksums and detects changed sources', async () => {
    const localManifest = await localManifestWithFiles();
    const valid = await verifySourceChecksums(localManifest, sourceDirectory);
    expect(valid.every((row) => row.valid)).toBe(true);
    await writeFile(join(sourceDirectory, localManifest.entries[0].sourcePdfFilename), 'changed');
    const changed = await verifySourceChecksums(localManifest, sourceDirectory);
    expect(changed[0]).toMatchObject({ valid: false, error: 'source-checksum-mismatch' });
  });

  test('projects seven reviewed offerings plus two unchanged exact offerings without writes', async () => {
    const localManifest = await localManifestWithFiles();
    const snapshotPath = join(sourceDirectory, '2026-2.json');
    const snapshotBytes = offeringSnapshotBytes(resolutionPlan);
    await writeFile(snapshotPath, snapshotBytes);
    const localResolution = {
      ...resolutionPlan,
      sourceOfferingSnapshotSha256: sha256(snapshotBytes),
    };
    const supabase = readOnlySupabase({
      course_offering: [
        { course_offering_id: 15, course_id: 5841, official_course_number: 'CB1501022', academic_year: 2026, semester: '2', section: '059' },
        { course_offering_id: 18, course_id: 5757, official_course_number: 'CB2001125', academic_year: 2026, semester: '2', section: '059' },
      ],
      course: localResolution.entries.map((entry) => ({
        course_id: entry.courseId,
        course_name: entry.productionCourseName,
        credit: entry.credit,
        major_id: 8,
        category: entry.category,
        official_course_number: null,
      })),
      major: [{ major_id: 8, major_name: 'Computer Science and Engineering', department: 'ICE Department' }],
      course_metadata: [],
    });
    const report = await createMetadataDryRunReport({
      manifest: localManifest,
      resolutionPlan: localResolution,
      offeringSnapshotPath: snapshotPath,
      sourceDirectory,
      supabase,
      now: () => new Date('2026-08-05T13:00:00.000Z'),
    });
    expect(report.summary).toEqual({
      manifestRows: 9,
      exactProductionOfferings: 2,
      plannedOfferingRows: 7,
      projectedExactProductionOfferings: 9,
      eligibleRows: 9,
      blockedRows: 0,
      writesPerformed: 0,
    });
    expect(report.eligibleRows.filter((row) => row.courseOfferingId === null)).toHaveLength(7);
    expect(report.eligibleRows.filter((row) => row.courseOfferingId !== null)
      .map((row) => row.officialCourseNumber)).toEqual(['CB1501022', 'CB2001125']);
    expect(supabase.insert).toBeUndefined();
    expect(supabase.update).toBeUndefined();
    expect(supabase.upsert).toBeUndefined();
    expect(supabase.rpc).toBeUndefined();
  });

  test('blocks reviewed mappings on production drift or a competing official number', async () => {
    const localManifest = await localManifestWithFiles();
    const snapshotPath = join(sourceDirectory, '2026-2.json');
    const snapshotBytes = offeringSnapshotBytes(resolutionPlan);
    await writeFile(snapshotPath, snapshotBytes);
    const localResolution = {
      ...resolutionPlan,
      sourceOfferingSnapshotSha256: sha256(snapshotBytes),
    };
    const courses = localResolution.entries.map((entry) => ({
      course_id: entry.courseId,
      course_name: entry.productionCourseName,
      credit: entry.credit,
      major_id: 8,
      category: entry.category,
      official_course_number: null,
    }));
    courses[0].credit = 2;
    courses.push({
      course_id: 9999,
      course_name: 'Competing course',
      credit: 3,
      major_id: 7,
      category: 'ELECTIVE',
      official_course_number: localResolution.entries[1].officialCourseNumber,
    });
    const report = await createMetadataDryRunReport({
      manifest: localManifest,
      resolutionPlan: localResolution,
      offeringSnapshotPath: snapshotPath,
      sourceDirectory,
      supabase: readOnlySupabase({
        course: courses,
        major: [{ major_id: 8, major_name: 'Computer Science and Engineering', department: 'ICE Department' }],
        course_offering: [],
        course_metadata: [],
      }),
    });
    expect(report.blockedRows.find((row) => row.officialCourseNumber === 'CB1501019').blockingReasons)
      .toContain('reviewed-production-course-drift');
    expect(report.blockedRows.find((row) => row.officialCourseNumber === 'CB2001103').blockingReasons)
      .toContain('official-number-assigned-to-competing-course');
  });

  test('dry-run implementation has no database mutation path and output is ignored', () => {
    const source = [
      join(backendRoot, 'scripts', 'dry-run-pnu-course-metadata.mjs'),
      join(backendRoot, 'scripts', 'lib', 'pnuCourseMetadata.cjs'),
    ].map((file) => readFileSync(file, 'utf8')).join('\n');
    expect(source).not.toMatch(/\.(insert|delete|upsert|rpc)\s*\(/i);
    expect(source).not.toMatch(/\.from\([^)]*\)[\s\S]*?\.update\s*\(/i);
    const ignored = execFileSync(
      'git',
      ['check-ignore', 'data/local/pnu-course-metadata-dry-run/2026-2.json'],
      { cwd: backendRoot, encoding: 'utf8' },
    );
    expect(ignored).toContain('pnu-course-metadata-dry-run');
  });
});

describe('metadata API mapping and ranking isolation', () => {
  test('maps nullable metadata and attaches it only to the exact offering', () => {
    expect(mapCourseMetadataRow({})).toEqual({
      presentationRequirement: null,
      groupProjectRequirement: null,
      assignmentRequirement: null,
      examInformation: null,
    });
    expect(attachCourseOffering(
      { id: '1', officialCourseNumber: 'CB2001125' },
      { course_offering_id: 18, official_course_number: 'CB2001125', section: '059' },
      {
        presentation_requirement: 'REQUIRED',
        group_project_requirement: 'REQUIRED',
        assignment_requirement: 'REQUIRED',
        exam_information: 'Presentation and final work evaluation',
      },
    )).toMatchObject({
      section: '059',
      presentationRequirement: 'REQUIRED',
      groupProjectRequirement: 'REQUIRED',
      assignmentRequirement: 'REQUIRED',
      examInformation: 'Presentation and final work evaluation',
    });
  });

  test('metadata does not change recommendation order', () => {
    const courses = [
      { id: '2', nameEn: 'Beta', majorId: '46', type: 'ELECTIVE', tags: [] },
      { id: '1', nameEn: 'Alpha', majorId: '46', type: 'ELECTIVE', tags: [] },
    ];
    const profile = { majorId: '46', interests: [] };
    const baseline = recommendCourses(profile, courses).map((course) => course.id);
    const enriched = recommendCourses(profile, courses.map((course, index) => ({
      ...course,
      presentationRequirement: index === 0 ? 'REQUIRED' : null,
      assignmentRequirement: index === 0 ? 'REQUIRED' : null,
      examInformation: index === 0 ? 'Exam' : null,
    }))).map((course) => course.id);
    expect(enriched).toEqual(baseline);
  });
});

describe('protected metadata application RPC', () => {
  const sql = readFileSync(join(backendRoot, 'supabase', 'course_metadata_application_rpc.sql'), 'utf8');

  test('is protected, atomic, and idempotently limited to the seven reviewed identity additions', () => {
    expect(sql).toMatch(/security definer/i);
    expect(sql).toMatch(/revoke all[\s\S]+from public, anon, authenticated/i);
    expect(sql).toMatch(/grant execute[\s\S]+to service_role/i);
    expect(sql).toMatch(/on conflict \(course_offering_id\) do nothing/i);
    expect(sql).toMatch(/insert into public\.course_metadata/i);
    expect(sql).toMatch(/insert into public\.course_offering\s*\(/i);
    expect(sql).toMatch(/update\s+public\.course\s+course/i);
    expect(sql).not.toMatch(/select\s+public\.apply_reviewed_pnu_course_metadata/i);
  });

  test('pins the reviewed checksums and all nine metadata identities', () => {
    expect(sql).toContain('288ff7569cff5494e029b12f14aeddd174bbb7083926984b70a3c159bfaaf051');
    const resolutionSha256 = sha256(readFileSync(resolutionPath));
    expect(sql).toContain(resolutionSha256);
    for (const number of manifest.entries.map((entry) => entry.officialCourseNumber)) {
      expect(sql).toContain(`'${number}'`);
    }
    expect(sql).toMatch(/reviewed_count <> 9/i);
    expect(sql).toMatch(/resolution_count <> 7/i);
  });
});
