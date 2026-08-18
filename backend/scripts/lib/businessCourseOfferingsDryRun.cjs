const ALLOWED_REMOTE_STATUSES = new Set(['REMOTE', 'NOT_REMOTE', 'MIXED', 'OTHER']);

function text(value) {
  return value === null || value === undefined ? null : String(value).trim();
}

function number(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function officialKey(row, year, semester) {
  return [year, semester, text(row.officialCourseNumber ?? row.official_course_number), text(row.section)].join('|');
}

function courseKey(row, year, semester) {
  return [year, semester, number(row.courseId ?? row.course_id), text(row.section)].join('|');
}

function validateDataset(dataset) {
  const errors = [];
  if (dataset?.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!Number.isInteger(dataset?.academicYear)) errors.push('academicYear must be an integer');
  if (!['1', '2', 'SUMMER', 'WINTER'].includes(dataset?.semester)) errors.push('semester is invalid');
  if (!Number.isInteger(dataset?.department?.majorId)) errors.push('department.majorId must be an integer');
  if (!Array.isArray(dataset?.offerings)) errors.push('offerings must be an array');
  if (errors.length) throw new Error(`Invalid Business offering dataset: ${errors.join('; ')}`);

  const officialKeys = new Set();
  const courseKeys = new Set();
  const courseIds = new Set();
  for (const [index, row] of dataset.offerings.entries()) {
    const prefix = `offerings[${index}]`;
    for (const field of ['courseId', 'courseName', 'officialCourseNumber', 'section', 'professor', 'yearLevel', 'schedule', 'classroom']) {
      if (row[field] === null || row[field] === undefined || String(row[field]).trim() === '') errors.push(`${prefix}.${field} is required`);
    }
    if (!Number.isInteger(row.courseId)) errors.push(`${prefix}.courseId must be an integer`);
    if (number(row.credits) !== 3) errors.push(`${prefix}.credits must be 3`);
    if (!ALLOWED_REMOTE_STATUSES.has(row.remoteCourseStatus)) errors.push(`${prefix}.remoteCourseStatus is invalid`);
    if (row.originalLanguageCode !== null || row.teachingLanguage !== null) errors.push(`${prefix} must preserve unverified language fields as null`);
    const oKey = officialKey(row, dataset.academicYear, dataset.semester);
    const cKey = courseKey(row, dataset.academicYear, dataset.semester);
    if (officialKeys.has(oKey)) errors.push(`${prefix} duplicates official identity ${oKey}`);
    if (courseKeys.has(cKey)) errors.push(`${prefix} duplicates course identity ${cKey}`);
    officialKeys.add(oKey);
    courseKeys.add(cKey);
    courseIds.add(row.courseId);
  }
  if (dataset.offerings.length !== dataset.expectedOfferingCount) errors.push(`expectedOfferingCount is ${dataset.expectedOfferingCount}, found ${dataset.offerings.length}`);
  if (courseIds.size !== dataset.expectedCourseCount) errors.push(`expectedCourseCount is ${dataset.expectedCourseCount}, found ${courseIds.size}`);
  if (errors.length) throw new Error(`Invalid Business offering dataset: ${errors.join('; ')}`);
  return { courseIds: [...courseIds].sort((a, b) => a - b) };
}

function proposedRow(dataset, offering) {
  return {
    course_id: offering.courseId,
    official_course_number: offering.officialCourseNumber,
    academic_year: dataset.academicYear,
    semester: dataset.semester,
    section: offering.section,
    professor: offering.professor,
    year_level: offering.yearLevel,
    theory_hours: null,
    practical_hours: null,
    schedule: offering.schedule,
    classroom: offering.classroom,
    remote_course_status: offering.remoteCourseStatus,
    original_language_code: offering.originalLanguageCode,
    teaching_language: offering.teachingLanguage,
    source_url: dataset.sourceUrl,
    retrieved_at: dataset.retrievedAt,
  };
}

const COMPARED_FIELDS = [
  'course_id', 'official_course_number', 'academic_year', 'semester', 'section',
  'professor', 'year_level', 'theory_hours', 'practical_hours', 'schedule',
  'classroom', 'remote_course_status', 'original_language_code',
  'teaching_language', 'source_url',
];

function differingFields(existing, proposed) {
  return COMPARED_FIELDS.filter((field) => text(existing[field]) !== text(proposed[field]));
}

function buildDryRunReport({ dataset, productionCourses, productionOfferings, now = () => new Date() }) {
  const { courseIds } = validateDataset(dataset);
  const blocked = [];
  const coursesById = new Map();
  for (const row of productionCourses || []) {
    const id = number(row.course_id);
    if (!coursesById.has(id)) coursesById.set(id, []);
    coursesById.get(id).push(row);
  }
  const representativeByCourse = new Map();
  for (const offering of dataset.offerings) {
    if (!representativeByCourse.has(offering.courseId)) representativeByCourse.set(offering.courseId, offering);
  }

  const proposedCourseNumberBackfills = [];
  for (const id of courseIds) {
    const expected = representativeByCourse.get(id);
    const rows = coursesById.get(id) || [];
    if (rows.length !== 1) {
      blocked.push({ identity: `course:${id}`, reasons: [rows.length ? 'PRODUCTION_COURSE_ID_NOT_UNIQUE' : 'PRODUCTION_COURSE_MISSING'] });
      continue;
    }
    const current = rows[0];
    const reasons = [];
    if (text(current.course_name) !== text(expected.courseName)) reasons.push('COURSE_NAME_MISMATCH');
    if (number(current.major_id) !== dataset.department.majorId) reasons.push('MAJOR_MISMATCH');
    if (number(current.credit) !== number(expected.credits)) reasons.push('CREDIT_MISMATCH');
    const currentNumber = text(current.official_course_number);
    if (currentNumber && currentNumber !== expected.officialCourseNumber) reasons.push('OFFICIAL_NUMBER_MISMATCH');
    if (reasons.length) blocked.push({ identity: `course:${id}`, reasons });
    else if (!currentNumber) proposedCourseNumberBackfills.push({ course_id: id, official_course_number: expected.officialCourseNumber });
  }

  const existingByOfficial = new Map();
  const existingByCourse = new Map();
  for (const row of productionOfferings || []) {
    const oKey = officialKey(row, row.academic_year, text(row.semester));
    const cKey = courseKey(row, row.academic_year, text(row.semester));
    if (!existingByOfficial.has(oKey)) existingByOfficial.set(oKey, []);
    if (!existingByCourse.has(cKey)) existingByCourse.set(cKey, []);
    existingByOfficial.get(oKey).push(row);
    existingByCourse.get(cKey).push(row);
  }

  const proposedOfferingInserts = [];
  const noops = [];
  for (const offering of dataset.offerings) {
    const proposed = proposedRow(dataset, offering);
    const oKey = officialKey(offering, dataset.academicYear, dataset.semester);
    const cKey = courseKey(offering, dataset.academicYear, dataset.semester);
    const byOfficial = existingByOfficial.get(oKey) || [];
    const byCourse = existingByCourse.get(cKey) || [];
    const identity = `${offering.officialCourseNumber}-${offering.section}`;
    const conflicts = [];
    if (byOfficial.length > 1 || byCourse.length > 1) conflicts.push('PRODUCTION_IDENTITY_NOT_UNIQUE');
    if (byOfficial.some((row) => number(row.course_id) !== offering.courseId)) conflicts.push('OFFICIAL_IDENTITY_OWNED_BY_ANOTHER_COURSE');
    if (byCourse.some((row) => text(row.official_course_number) !== offering.officialCourseNumber)) conflicts.push('COURSE_SECTION_HAS_ANOTHER_OFFICIAL_NUMBER');
    const existing = byOfficial.find((row) => number(row.course_id) === offering.courseId) || null;
    if (existing) {
      const fields = differingFields(existing, proposed);
      if (fields.length) conflicts.push(`EXISTING_OFFERING_DRIFT:${fields.join(',')}`);
      else noops.push({ identity, courseOfferingId: existing.course_offering_id ?? null });
    } else if (!conflicts.length) {
      proposedOfferingInserts.push(proposed);
    }
    if (conflicts.length) blocked.push({ identity, reasons: [...new Set(conflicts)] });
  }

  return {
    generatedAt: now().toISOString(),
    mode: 'STRICT_READ_ONLY_DRY_RUN',
    source: { url: dataset.sourceUrl, retrievedAt: dataset.retrievedAt, academicYear: dataset.academicYear, semester: dataset.semester },
    summary: {
      reviewedCourses: courseIds.length,
      reviewedOfferings: dataset.offerings.length,
      productionCoursesFound: productionCourses.length,
      productionTermOfferingsInspected: productionOfferings.length,
      proposedCourseNumberBackfills: proposedCourseNumberBackfills.length,
      proposedOfferingInserts: proposedOfferingInserts.length,
      noops: noops.length,
      blocked: blocked.length,
      writesPerformed: 0,
    },
    proposedCourseNumberBackfills,
    proposedOfferingInserts,
    noops,
    blocked,
  };
}

module.exports = { validateDataset, buildDryRunReport };
