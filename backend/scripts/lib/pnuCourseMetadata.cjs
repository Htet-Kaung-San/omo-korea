const { createHash } = require('crypto');
const { readFile } = require('fs/promises');
const { join } = require('path');

const REQUIREMENT_VALUES = new Set(['REQUIRED', 'OPTIONAL', 'NONE']);
const METADATA_FIELDS = [
  'presentationRequirement',
  'groupProjectRequirement',
  'assignmentRequirement',
  'examInformation',
];

function metadataIdentity(entry, manifest) {
  return [
    entry.officialCourseNumber,
    manifest.academicYear,
    manifest.semester,
    entry.section,
  ].join('|');
}

function validateManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object') return ['manifest must be an object'];
  if (manifest.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!Number.isInteger(manifest.academicYear)) errors.push('academicYear must be an integer');
  if (typeof manifest.semester !== 'string' || !manifest.semester.trim()) {
    errors.push('semester must be a non-empty string');
  }
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
    errors.push('entries must be a non-empty array');
    return errors;
  }

  const identities = new Set();
  for (const [index, entry] of manifest.entries.entries()) {
    const prefix = `entries[${index}]`;
    for (const field of [
      'officialCourseNumber',
      'section',
      'courseName',
      'sourcePdfFilename',
      'sourcePdfSha256',
      'evidenceText',
      'verifiedAt',
    ]) {
      if (typeof entry[field] !== 'string' || !entry[field].trim()) {
        errors.push(`${prefix}.${field} must be a non-empty string`);
      }
    }
    if (!/^[a-f0-9]{64}$/.test(entry.sourcePdfSha256 || '')) {
      errors.push(`${prefix}.sourcePdfSha256 must be lowercase SHA-256`);
    }
    for (const field of [
      'presentationRequirement',
      'groupProjectRequirement',
      'assignmentRequirement',
    ]) {
      if (entry[field] !== null && !REQUIREMENT_VALUES.has(entry[field])) {
        errors.push(`${prefix}.${field} has an invalid requirement value`);
      }
    }
    if (entry.examInformation !== null && typeof entry.examInformation !== 'string') {
      errors.push(`${prefix}.examInformation must be text or null`);
    }
    const identity = metadataIdentity(entry, manifest);
    if (identities.has(identity)) errors.push(`duplicate metadata identity: ${identity}`);
    identities.add(identity);
  }
  return errors;
}

function validateResolutionPlan(plan, manifest) {
  const errors = [];
  if (!plan || typeof plan !== 'object') return ['resolution plan must be an object'];
  if (plan.schemaVersion !== 1) errors.push('resolution plan schemaVersion must be 1');
  if (plan.academicYear !== manifest.academicYear || String(plan.semester) !== String(manifest.semester)) {
    errors.push('resolution plan term must match the metadata manifest');
  }
  if (!Number.isInteger(plan.productionMajor?.majorId)) {
    errors.push('resolution plan productionMajor.majorId must be an integer');
  }
  if (!/^[a-f0-9]{64}$/.test(plan.sourceOfferingSnapshotSha256 || '')) {
    errors.push('resolution plan sourceOfferingSnapshotSha256 must be lowercase SHA-256');
  }
  if (!Array.isArray(plan.entries)) return [...errors, 'resolution plan entries must be an array'];

  const manifestIdentities = new Set(manifest.entries.map((entry) => metadataIdentity(entry, manifest)));
  const identities = new Set();
  const courseIds = new Set();
  for (const [index, entry] of plan.entries.entries()) {
    const prefix = `resolution entries[${index}]`;
    const identity = [entry.officialCourseNumber, plan.academicYear, String(plan.semester), plan.section].join('|');
    if (!manifestIdentities.has(identity)) errors.push(`${prefix} does not identify a manifest row`);
    if (identities.has(identity)) errors.push(`duplicate resolution identity: ${identity}`);
    identities.add(identity);
    if (!Number.isInteger(entry.courseId)) errors.push(`${prefix}.courseId must be an integer`);
    if (courseIds.has(entry.courseId)) errors.push(`duplicate resolution courseId: ${entry.courseId}`);
    courseIds.add(entry.courseId);
    for (const field of ['productionCourseName', 'syllabusCourseName', 'officialCourseName', 'category']) {
      if (typeof entry[field] !== 'string' || !entry[field].trim()) {
        errors.push(`${prefix}.${field} must be a non-empty string`);
      }
    }
    if (typeof entry.credit !== 'number') errors.push(`${prefix}.credit must be numeric`);
  }
  return errors;
}

async function sha256File(path) {
  const bytes = await readFile(path);
  return createHash('sha256').update(bytes).digest('hex');
}

async function verifyResolutionOfferings(plan, offeringSnapshotPath) {
  const parsed = JSON.parse(await readFile(offeringSnapshotPath, 'utf8'));
  const offerings = Array.isArray(parsed) ? parsed : parsed.offerings;
  if (!Array.isArray(offerings)) throw new Error('offering snapshot must contain an offerings array');
  return plan.entries.map((entry) => {
    const identity = [entry.officialCourseNumber, plan.academicYear, String(plan.semester), plan.section].join('|');
    const matches = offerings.filter((offering) => (
      offering.officialCourseNumber === entry.officialCourseNumber
      && offering.academicYear === plan.academicYear
      && String(offering.semester) === String(plan.semester)
      && String(offering.section) === String(plan.section)
    ));
    const offering = matches.length === 1 ? matches[0] : null;
    const expected = {
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
    };
    const mismatchedFields = offering
      ? Object.entries(expected).filter(([field, value]) => offering[field] !== value).map(([field]) => field)
      : [];
    return {
      identity,
      exactSourceRows: matches.length,
      valid: matches.length === 1 && mismatchedFields.length === 0,
      mismatchedFields,
    };
  });
}

async function verifySourceChecksums(manifest, sourceDirectory) {
  const results = [];
  for (const entry of manifest.entries) {
    const sourcePath = join(sourceDirectory, entry.sourcePdfFilename);
    try {
      const actualSha256 = await sha256File(sourcePath);
      results.push({
        identity: metadataIdentity(entry, manifest),
        sourcePdfFilename: entry.sourcePdfFilename,
        expectedSha256: entry.sourcePdfSha256,
        actualSha256,
        valid: actualSha256 === entry.sourcePdfSha256,
        error: actualSha256 === entry.sourcePdfSha256 ? null : 'source-checksum-mismatch',
      });
    } catch (error) {
      results.push({
        identity: metadataIdentity(entry, manifest),
        sourcePdfFilename: entry.sourcePdfFilename,
        expectedSha256: entry.sourcePdfSha256,
        actualSha256: null,
        valid: false,
        error: error && error.code === 'ENOENT' ? 'source-file-missing' : 'source-read-failed',
      });
    }
  }
  return results;
}

function sameMetadata(entry, existing) {
  if (!existing) return false;
  return (
    (existing.presentation_requirement ?? null) === entry.presentationRequirement &&
    (existing.group_project_requirement ?? null) === entry.groupProjectRequirement &&
    (existing.assignment_requirement ?? null) === entry.assignmentRequirement &&
    (existing.exam_information ?? null) === entry.examInformation
  );
}

async function fetchExactOfferingRows(supabase, manifest) {
  const officialNumbers = [...new Set(manifest.entries.map((entry) => entry.officialCourseNumber))];
  const result = await supabase
    .from('course_offering')
    .select('course_offering_id,course_id,official_course_number,academic_year,semester,section')
    .eq('academic_year', manifest.academicYear)
    .eq('semester', manifest.semester)
    .in('official_course_number', officialNumbers);
  if (result.error) throw new Error(`course_offering read failed: ${result.error.message}`);
  return Array.isArray(result.data) ? result.data : [];
}

async function fetchExistingMetadata(supabase, offeringIds) {
  if (offeringIds.length === 0) return [];
  const result = await supabase
    .from('course_metadata')
    .select('course_metadata_id,course_offering_id,presentation_requirement,group_project_requirement,assignment_requirement,exam_information,source_url,source_updated_at,verified_at')
    .in('course_offering_id', offeringIds);
  if (result.error) throw new Error(`course_metadata read failed: ${result.error.message}`);
  return Array.isArray(result.data) ? result.data : [];
}

async function readRows(query, label) {
  const result = await query;
  if (result.error) throw new Error(`${label} read failed: ${result.error.message}`);
  return Array.isArray(result.data) ? result.data : [];
}

async function fetchResolutionEvidence(supabase, plan) {
  if (!plan || plan.entries.length === 0) {
    return { courses: [], majors: [], assignedCourses: [], offeringsByNumber: [], termOfferingsByCourse: [] };
  }
  const courseIds = plan.entries.map((entry) => entry.courseId);
  const officialNumbers = plan.entries.map((entry) => entry.officialCourseNumber);
  const courses = await readRows(
    supabase.from('course')
      .select('course_id,course_name,credit,major_id,category,official_course_number')
      .in('course_id', courseIds),
    'resolution course',
  );
  const majors = await readRows(
    supabase.from('major').select('major_id,major_name,department').eq('major_id', plan.productionMajor.majorId),
    'resolution major',
  );
  const assignedCourses = await readRows(
    supabase.from('course')
      .select('course_id,course_name,major_id,official_course_number')
      .in('official_course_number', officialNumbers),
    'official-number conflict',
  );
  const offeringsByNumber = await readRows(
    supabase.from('course_offering')
      .select('course_offering_id,course_id,official_course_number,academic_year,semester,section')
      .in('official_course_number', officialNumbers),
    'offering official-number conflict',
  );
  const termOfferingsByCourse = await readRows(
    supabase.from('course_offering')
      .select('course_offering_id,course_id,official_course_number,academic_year,semester,section')
      .eq('academic_year', plan.academicYear)
      .eq('semester', String(plan.semester))
      .in('course_id', courseIds),
    'course term offering conflict',
  );
  return { courses, majors, assignedCourses, offeringsByNumber, termOfferingsByCourse };
}

function resolutionBlockingReasons(entry, plan, evidence) {
  const reasons = [];
  const courseMatches = evidence.courses.filter((row) => Number(row.course_id) === entry.courseId);
  if (courseMatches.length !== 1) reasons.push('reviewed-production-course-missing-or-ambiguous');
  const course = courseMatches.length === 1 ? courseMatches[0] : null;
  if (course && (
    course.course_name !== entry.productionCourseName
    || Number(course.credit) !== entry.credit
    || Number(course.major_id) !== plan.productionMajor.majorId
    || course.category !== entry.category
  )) reasons.push('reviewed-production-course-drift');
  if (course && course.official_course_number !== null
    && course.official_course_number !== entry.officialCourseNumber) {
    reasons.push('production-course-has-conflicting-official-number');
  }

  const majorMatches = evidence.majors.filter((row) => Number(row.major_id) === plan.productionMajor.majorId);
  if (majorMatches.length !== 1 || majorMatches[0].major_name !== plan.productionMajor.majorName
    || majorMatches[0].department !== plan.productionMajor.department) {
    reasons.push('reviewed-production-major-drift');
  }
  if (evidence.assignedCourses.some((row) =>
    row.official_course_number === entry.officialCourseNumber && Number(row.course_id) !== entry.courseId)) {
    reasons.push('official-number-assigned-to-competing-course');
  }
  if (evidence.offeringsByNumber.some((row) =>
    row.official_course_number === entry.officialCourseNumber && Number(row.course_id) !== entry.courseId)) {
    reasons.push('cross-course-offering-conflict');
  }
  if (evidence.termOfferingsByCourse.some((row) =>
    Number(row.course_id) === entry.courseId
    && String(row.section) === String(plan.section)
    && row.official_course_number !== entry.officialCourseNumber)) {
    reasons.push('course-term-section-conflict');
  }
  return reasons;
}

async function createMetadataDryRunReport({
  manifest,
  resolutionPlan = null,
  offeringSnapshotPath = null,
  sourceDirectory,
  supabase,
  now = () => new Date(),
}) {
  const validationErrors = validateManifest(manifest);
  if (validationErrors.length) {
    throw new Error(`Invalid metadata manifest: ${validationErrors.join('; ')}`);
  }
  const resolutionErrors = resolutionPlan ? validateResolutionPlan(resolutionPlan, manifest) : [];
  if (resolutionErrors.length) {
    throw new Error(`Invalid metadata resolution plan: ${resolutionErrors.join('; ')}`);
  }
  let resolutionSourceChecksum = null;
  let resolutionOfferingResults = [];
  if (resolutionPlan) {
    if (!offeringSnapshotPath) throw new Error('offeringSnapshotPath is required with a resolution plan');
    const actualSha256 = await sha256File(offeringSnapshotPath);
    resolutionSourceChecksum = {
      expectedSha256: resolutionPlan.sourceOfferingSnapshotSha256,
      actualSha256,
      valid: actualSha256 === resolutionPlan.sourceOfferingSnapshotSha256,
    };
    resolutionOfferingResults = await verifyResolutionOfferings(resolutionPlan, offeringSnapshotPath);
  }
  const checksumResults = await verifySourceChecksums(manifest, sourceDirectory);
  const checksumByIdentity = new Map(checksumResults.map((row) => [row.identity, row]));
  const offeringRows = await fetchExactOfferingRows(supabase, manifest);
  const exactByIdentity = new Map();
  for (const offering of offeringRows) {
    const identity = [
      offering.official_course_number,
      offering.academic_year,
      String(offering.semester),
      offering.section,
    ].join('|');
    if (!exactByIdentity.has(identity)) exactByIdentity.set(identity, []);
    exactByIdentity.get(identity).push(offering);
  }
  const exactOfferingIds = offeringRows.map((row) => row.course_offering_id);
  const existingMetadataRows = await fetchExistingMetadata(supabase, exactOfferingIds);
  const metadataByOfferingId = new Map(
    existingMetadataRows.map((row) => [String(row.course_offering_id), row]),
  );
  const resolutionEvidence = await fetchResolutionEvidence(supabase, resolutionPlan);
  const resolutionByIdentity = new Map((resolutionPlan?.entries || []).map((entry) => [
    [entry.officialCourseNumber, resolutionPlan.academicYear, String(resolutionPlan.semester), resolutionPlan.section].join('|'),
    entry,
  ]));
  const resolutionOfferingByIdentity = new Map(
    resolutionOfferingResults.map((row) => [row.identity, row]),
  );

  const eligibleRows = [];
  const blockedRows = [];
  for (const entry of manifest.entries) {
    const identity = metadataIdentity(entry, manifest);
    const reasons = [];
    const checksum = checksumByIdentity.get(identity);
    if (!checksum?.valid) reasons.push(checksum?.error || 'source-checksum-unverified');
    const matches = exactByIdentity.get(identity) || [];
    const resolution = resolutionByIdentity.get(identity) || null;
    if (matches.length === 0 && !resolution) reasons.push('exact-production-offering-missing');
    if (matches.length > 1) reasons.push('exact-production-offering-ambiguous');
    const offering = matches.length === 1 ? matches[0] : null;
    if (offering && resolution && Number(offering.course_id) !== resolution.courseId) {
      reasons.push('exact-production-offering-course-conflict');
    }
    if (!offering && resolution) {
      if (!resolutionSourceChecksum?.valid) reasons.push('offering-snapshot-checksum-mismatch');
      if (!resolutionOfferingByIdentity.get(identity)?.valid) {
        reasons.push('official-offering-source-mismatch');
      }
      reasons.push(...resolutionBlockingReasons(resolution, resolutionPlan, resolutionEvidence));
    }
    const existing = offering
      ? metadataByOfferingId.get(String(offering.course_offering_id)) || null
      : null;
    if (existing && !sameMetadata(entry, existing)) reasons.push('existing-metadata-conflict');

    const reviewedRow = {
      identity,
      officialCourseNumber: entry.officialCourseNumber,
      academicYear: manifest.academicYear,
      semester: manifest.semester,
      section: entry.section,
      courseName: entry.courseName,
      presentationRequirement: entry.presentationRequirement,
      groupProjectRequirement: entry.groupProjectRequirement,
      assignmentRequirement: entry.assignmentRequirement,
      examInformation: entry.examInformation,
      sourcePdfFilename: entry.sourcePdfFilename,
      sourcePdfSha256: entry.sourcePdfSha256,
      verifiedAt: entry.verifiedAt,
      courseOfferingId: offering?.course_offering_id ?? null,
      reviewedCourseId: offering?.course_id ?? resolution?.courseId ?? null,
    };
    if (reasons.length) {
      blockedRows.push({ ...reviewedRow, blockingReasons: reasons });
    } else {
      eligibleRows.push({
        ...reviewedRow,
        action: existing
          ? 'NO_OP'
          : offering
            ? 'INSERT_METADATA'
            : 'ASSIGN_OFFICIAL_NUMBER_INSERT_OFFERING_AND_METADATA',
      });
    }
  }

  const exactProductionOfferings = eligibleRows.concat(blockedRows)
    .filter((row) => row.courseOfferingId !== null).length;
  const plannedOfferingRows = eligibleRows.filter((row) => row.courseOfferingId === null).length;

  return {
    dryRun: true,
    generatedAt: now().toISOString(),
    academicYear: manifest.academicYear,
    semester: manifest.semester,
    summary: {
      manifestRows: manifest.entries.length,
      exactProductionOfferings,
      plannedOfferingRows,
      projectedExactProductionOfferings: exactProductionOfferings + plannedOfferingRows,
      eligibleRows: eligibleRows.length,
      blockedRows: blockedRows.length,
      writesPerformed: 0,
    },
    checksumResults,
    resolutionSourceChecksum,
    resolutionOfferingResults,
    eligibleRows,
    blockedRows,
  };
}

module.exports = {
  METADATA_FIELDS,
  createMetadataDryRunReport,
  fetchExactOfferingRows,
  fetchResolutionEvidence,
  metadataIdentity,
  sameMetadata,
  sha256File,
  validateManifest,
  validateResolutionPlan,
  verifyResolutionOfferings,
  verifySourceChecksums,
};
