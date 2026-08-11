const { createHash } = require('node:crypto');
const { mkdir, writeFile } = require('node:fs/promises');
const { dirname, join, resolve, sep } = require('node:path');

const EXPECTED_COUNTS = Object.freeze({
  productionCourses: 1875,
  courseAssignments: 57,
  courseOfferings: 82,
  explicitEnglishOfferings: 13,
  courseRestrictions: 18,
  courseRestrictionExceptions: 2,
  ambiguousSubjectsExcluded: 94,
  unmatchedSubjectsExcluded: 2448,
  crossDepartmentNumbersExcluded: 3,
});

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

function sha256(value) {
  const hash = createHash('sha256');
  hash.end(Buffer.from(value, 'utf8'));
  return hash.digest('hex');
}

function datasetChecksum(dataset) {
  return sha256(stableStringify(dataset));
}

function explicitEnglishStatus(originalLanguageCode, teachingLanguage) {
  if (originalLanguageCode === 'E' || teachingLanguage === 'ENGLISH') return true;
  if (
    ['C', 'J', 'F', 'G', 'R'].includes(originalLanguageCode) ||
    ['KOREAN', 'OTHER'].includes(teachingLanguage)
  ) {
    return false;
  }
  return null;
}

function duplicateKeys(rows, keyFor) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFor(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key);
}

function assertCount(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

function createApplicationDataset({ phase5Report, productionCourses, restrictionSnapshot, priorDataset = null }) {
  if (!phase5Report?.ready) throw new Error('Phase 5 reviewed proposal is not ready');
  const assignments = phase5Report.reviewedProposal?.courseNumberAssignments || [];
  const offerings = phase5Report.reviewedProposal?.courseOfferingRows || [];
  const productionById = new Map();
  const priorAssignmentsById = new Map(
    (priorDataset?.courseAssignments || []).map((row) => [String(row.course_id), row]),
  );
  for (const row of productionCourses || []) {
    const key = String(row.course_id);
    if (!productionById.has(key)) productionById.set(key, []);
    productionById.get(key).push(row);
  }

  assertCount(productionCourses.length, EXPECTED_COUNTS.productionCourses, 'Production course count');
  assertCount(assignments.length, EXPECTED_COUNTS.courseAssignments, 'Reviewed assignment count');
  assertCount(offerings.length, EXPECTED_COUNTS.courseOfferings, 'Reviewed offering count');
  assertCount(
    phase5Report.counts?.explicitEnglishOfferingRows,
    EXPECTED_COUNTS.explicitEnglishOfferings,
    'Reviewed English offering count',
  );
  assertCount(
    phase5Report.counts?.untouchedAmbiguousOfficialSubjects,
    EXPECTED_COUNTS.ambiguousSubjectsExcluded,
    'Ambiguous exclusion count',
  );
  assertCount(
    phase5Report.counts?.untouchedUnmatchedOfficialSubjects,
    EXPECTED_COUNTS.unmatchedSubjectsExcluded,
    'Unmatched exclusion count',
  );
  assertCount(
    phase5Report.counts?.excludedCrossDepartmentOfficialNumbers,
    EXPECTED_COUNTS.crossDepartmentNumbersExcluded,
    'Cross-department exclusion count',
  );
  for (const [name, value] of Object.entries(phase5Report.checks || {})) {
    if (name !== 'strictApprovedCandidates' && value !== 0) {
      throw new Error(`Phase 5 safety check is not zero: ${name}=${value}`);
    }
  }

  const courseAssignments = assignments
    .map((assignment) => {
      const current = productionById.get(String(assignment.course_id)) || [];
      if (current.length !== 1) {
        throw new Error(
          `Production course ${assignment.course_id} resolved to ${current.length} rows`,
        );
      }
      const row = current[0];
      return {
        course_id: Number(assignment.course_id),
        official_course_number: assignment.official_course_number,
        expected_course_name: row.course_name,
        expected_credit: Number(row.credit),
        expected_category: row.category,
        expected_major_id: Number(row.major_id),
        previous_official_course_number: priorAssignmentsById.has(String(assignment.course_id))
          ? priorAssignmentsById.get(String(assignment.course_id)).previous_official_course_number
          : row.official_course_number ?? null,
      };
    })
    .sort((a, b) => a.course_id - b.course_id);

  const courseOfferings = offerings
    .map((row) => ({
      course_id: Number(row.course_id),
      official_course_number: row.official_course_number,
      academic_year: Number(row.academic_year),
      semester: String(row.semester),
      section: String(row.section),
      professor: row.professor ?? null,
      year_level: row.year_level ?? null,
      theory_hours: row.theory_hours ?? null,
      practical_hours: row.practical_hours ?? null,
      enrollment_limit: row.enrollment_limit ?? null,
      schedule: row.schedule ?? null,
      classroom: row.classroom ?? null,
      remote_course_status: row.remote_course_status ?? null,
      team_teaching_status: row.team_teaching_status ?? null,
      general_education_area: row.general_education_area ?? null,
      remarks: row.remarks ?? null,
      original_language_code: row.original_language_code ?? null,
      teaching_language: row.teaching_language ?? null,
      is_english_taught: explicitEnglishStatus(
        row.original_language_code ?? null,
        row.teaching_language ?? null,
      ),
      source_url: row.source_url ?? null,
      retrieved_at: row.retrieved_at ?? null,
    }))
    .sort((a, b) =>
      [a.academic_year, a.semester, a.official_course_number, a.section]
        .join('|')
        .localeCompare(
          [b.academic_year, b.semester, b.official_course_number, b.section].join('|'),
        ),
    );

  const offeringKeys = new Set(courseOfferings.map((row) => [row.official_course_number, row.section].join('|')));
  const mapRestriction = (row, sourceKind) => ({
    restriction_key: row.restrictionKey,
    academic_year: Number(row.academicYear),
    semester: String(row.semester),
    official_course_number: row.officialCourseNumber,
    section: row.section,
    source_kind: sourceKind,
    source_rule_type: row.sourceRuleType ?? null,
    permission: row.permission ?? null,
    department_condition: row.departmentCondition ?? null,
    year_level_condition: row.yearLevelCondition ?? null,
    domestic_foreign_condition: row.domesticForeignCondition ?? null,
    nationality_condition: row.nationalityCondition ?? null,
    curriculum_year_condition: row.curriculumYearCondition ?? null,
    completed_semesters_condition: row.completedSemestersCondition ?? null,
    academic_status_condition: row.academicStatusCondition ?? null,
    degree_program_condition: row.degreeProgramCondition ?? null,
    reason: row.reason ?? null,
    exception_text: row.exceptionText ?? null,
    source_file_name: row.sourceFileName ?? null,
    duplicate_source_count: row.duplicateSourceCount ?? 1,
  });
  const courseRestrictions = (restrictionSnapshot?.restrictions || [])
    .filter((row) => offeringKeys.has([row.officialCourseNumber, row.section].join('|')))
    .map((row) => mapRestriction(row, 'RESTRICTION'));
  const courseRestrictionExceptions = (restrictionSnapshot?.exceptions || [])
    .filter((row) => offeringKeys.has([row.officialCourseNumber, row.section].join('|')))
    .map((row) => mapRestriction(row, 'EXCEPTION'));
  const duplicateRestrictionKeys = duplicateKeys(
    [...courseRestrictions, ...courseRestrictionExceptions],
    (row) => row.restriction_key,
  );
  if (duplicateRestrictionKeys.length) {
    throw new Error(`Duplicate restriction keys are forbidden: ${duplicateRestrictionKeys.join(', ')}`);
  }
  assertCount(courseRestrictions.length, EXPECTED_COUNTS.courseRestrictions, 'Linked restriction count');
  assertCount(courseRestrictionExceptions.length, EXPECTED_COUNTS.courseRestrictionExceptions, 'Linked exception count');

  const dataset = {
    schemaVersion: 1,
    mode: 'REVIEWED_PNU_COURSE_APPLICATION_DATASET',
    source: {
      phase5FinalReviewedProposalSha256:
        phase5Report.checksums.finalReviewedProposalSha256,
    },
    expectedCounts: { ...EXPECTED_COUNTS },
    exclusions: {
      ambiguousSubjects: EXPECTED_COUNTS.ambiguousSubjectsExcluded,
      unmatchedSubjects: EXPECTED_COUNTS.unmatchedSubjectsExcluded,
      crossDepartmentOfficialNumbers: EXPECTED_COUNTS.crossDepartmentNumbersExcluded,
    },
    courseAssignments,
    courseOfferings,
    courseRestrictions,
    courseRestrictionExceptions,
  };
  validateDataset(dataset);
  return dataset;
}

function validateDataset(dataset) {
  if (!dataset || dataset.schemaVersion !== 1) throw new Error('Unsupported dataset schema');
  const assignments = dataset.courseAssignments || [];
  const offerings = dataset.courseOfferings || [];
  assertCount(assignments.length, EXPECTED_COUNTS.courseAssignments, 'Application assignment count');
  assertCount(offerings.length, EXPECTED_COUNTS.courseOfferings, 'Application offering count');
  assertCount((dataset.courseRestrictions || []).length, EXPECTED_COUNTS.courseRestrictions, 'Application restriction count');
  assertCount((dataset.courseRestrictionExceptions || []).length, EXPECTED_COUNTS.courseRestrictionExceptions, 'Application restriction exception count');
  assertCount(
    offerings.filter((row) => row.is_english_taught === true).length,
    EXPECTED_COUNTS.explicitEnglishOfferings,
    'Application English offering count',
  );
  assertCount(dataset.exclusions?.ambiguousSubjects, EXPECTED_COUNTS.ambiguousSubjectsExcluded, 'Ambiguous exclusion count');
  assertCount(dataset.exclusions?.unmatchedSubjects, EXPECTED_COUNTS.unmatchedSubjectsExcluded, 'Unmatched exclusion count');
  assertCount(
    dataset.exclusions?.crossDepartmentOfficialNumbers,
    EXPECTED_COUNTS.crossDepartmentNumbersExcluded,
    'Cross-department exclusion count',
  );
  const duplicateCourseIds = duplicateKeys(assignments, (row) => String(row.course_id));
  const duplicateOfficialNumbers = duplicateKeys(
    assignments,
    (row) => row.official_course_number,
  );
  const duplicateOfficialOfferingKeys = duplicateKeys(
    offerings,
    (row) =>
      [row.academic_year, row.semester, row.official_course_number, row.section].join('|'),
  );
  const duplicateCourseOfferingKeys = duplicateKeys(
    offerings,
    (row) => [row.course_id, row.academic_year, row.semester, row.section].join('|'),
  );
  const duplicateRestrictionKeys = duplicateKeys(
    [...(dataset.courseRestrictions || []), ...(dataset.courseRestrictionExceptions || [])],
    (row) => row.restriction_key,
  );
  if (
    duplicateCourseIds.length ||
    duplicateOfficialNumbers.length ||
    duplicateOfficialOfferingKeys.length ||
    duplicateCourseOfferingKeys.length ||
    duplicateRestrictionKeys.length
  ) {
    throw new Error('Duplicate application identity detected');
  }
  const assignmentsByNumber = new Map(
    assignments.map((row) => [row.official_course_number, row.course_id]),
  );
  for (const row of offerings) {
    if (assignmentsByNumber.get(row.official_course_number) !== row.course_id) {
      throw new Error(`Offering ${row.official_course_number}/${row.section} lacks its reviewed assignment`);
    }
    const expectedEnglish = explicitEnglishStatus(
      row.original_language_code,
      row.teaching_language,
    );
    if (row.is_english_taught !== expectedEnglish) {
      throw new Error(`Offering ${row.official_course_number}/${row.section} has invalid English status`);
    }
    if (row.original_language_code === null && row.teaching_language !== null) {
      throw new Error(`Offering ${row.official_course_number}/${row.section} corrupts null language`);
    }
  }
  const serialized = JSON.stringify(dataset);
  if (/workbookCourseId|workbook_course_id|workbook row/i.test(serialized)) {
    throw new Error('Workbook identifiers are forbidden in the application dataset');
  }
  return true;
}

function validatePackage(wrapper, expectedChecksum) {
  if (!/^[a-f0-9]{64}$/i.test(expectedChecksum || '')) {
    throw new Error('A reviewed 64-character SHA-256 checksum is required');
  }
  validateDataset(wrapper?.dataset);
  const actual = datasetChecksum(wrapper.dataset);
  if (wrapper.datasetSha256 !== actual || expectedChecksum.toLowerCase() !== actual) {
    throw new Error('Application dataset checksum mismatch');
  }
  return actual;
}

function revalidateProductionCourses(dataset, productionCourses) {
  assertCount(productionCourses.length, EXPECTED_COUNTS.productionCourses, 'Production course count');
  const currentById = new Map();
  for (const row of productionCourses) {
    const key = String(row.course_id);
    if (!currentById.has(key)) currentById.set(key, []);
    currentById.get(key).push(row);
  }
  const drift = [];
  const conflicts = [];
  for (const expected of dataset.courseAssignments) {
    const rows = currentById.get(String(expected.course_id)) || [];
    if (rows.length !== 1) {
      drift.push({ course_id: expected.course_id, fields: ['course_id'] });
      continue;
    }
    const current = rows[0];
    const fields = [];
    if (current.course_name !== expected.expected_course_name) fields.push('course_name');
    if (Number(current.credit) !== Number(expected.expected_credit)) fields.push('credit');
    if (current.category !== expected.expected_category) fields.push('category');
    if (Number(current.major_id) !== Number(expected.expected_major_id)) fields.push('major_id');
    if (fields.length) drift.push({ course_id: expected.course_id, fields });
    const currentOfficial = current.official_course_number ?? null;
    if (
      currentOfficial !== expected.previous_official_course_number &&
      currentOfficial !== expected.official_course_number
    ) {
      conflicts.push({
        course_id: expected.course_id,
        expected: expected.official_course_number,
        current: currentOfficial,
      });
    }
  }
  if (drift.length) throw new Error(`Production course drift detected for ${drift.length} records`);
  if (conflicts.length) {
    throw new Error(`Conflicting official course numbers detected for ${conflicts.length} records`);
  }
  return {
    productionCourseCount: productionCourses.length,
    revalidatedAssignments: dataset.courseAssignments.length,
    drift: 0,
    conflicts: 0,
  };
}

function parseApplicationArguments(argv) {
  const result = {
    apply: false,
    operation: 'apply',
    academicYear: 2026,
    semester: '2',
    expectedChecksum: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--apply') result.apply = true;
    else if (argument === '--rollback') result.operation = 'rollback';
    else if (argument === '--expected-checksum') result.expectedChecksum = argv[++index] || null;
    else if (argument === '--year') result.academicYear = Number(argv[++index]);
    else if (argument === '--semester') result.semester = argv[++index] || null;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!Number.isInteger(result.academicYear) || result.academicYear < 2000 || result.academicYear > 2100) {
    throw new Error('Academic year must be an integer between 2000 and 2100');
  }
  if (!result.semester) throw new Error('Semester is required');
  return result;
}

function authorizeOperation(options, environment = process.env) {
  if (!options.apply) return { dryRun: true, writeAuthorized: false };
  if (environment.COURSE_BACKFILL_APPROVED !== 'true') {
    throw new Error('--apply requires COURSE_BACKFILL_APPROVED=true');
  }
  return { dryRun: false, writeAuthorized: true };
}

function applicationDatasetPath(backendRoot, academicYear, semester) {
  return join(
    backendRoot,
    'data',
    'local',
    'pnu-course-application',
    `${academicYear}-${semester}.json`,
  );
}

function applicationResultPath(backendRoot, academicYear, semester, operation) {
  return join(
    backendRoot,
    'data',
    'local',
    'pnu-course-application-results',
    `${academicYear}-${semester}-${operation}.json`,
  );
}

async function writeLocalJson(path, value, allowedRoot) {
  const outputPath = resolve(path);
  const outputRoot = resolve(allowedRoot);
  if (outputPath !== outputRoot && !outputPath.startsWith(`${outputRoot}${sep}`)) {
    throw new Error('Refusing to write outside the gitignored application directory');
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return outputPath;
}

module.exports = {
  EXPECTED_COUNTS,
  applicationDatasetPath,
  applicationResultPath,
  authorizeOperation,
  createApplicationDataset,
  datasetChecksum,
  explicitEnglishStatus,
  parseApplicationArguments,
  revalidateProductionCourses,
  stableStringify,
  validateDataset,
  validatePackage,
  writeLocalJson,
};
