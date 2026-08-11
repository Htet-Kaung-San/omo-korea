const { mkdir, writeFile } = require('node:fs/promises');
const { dirname, join, resolve, sep } = require('node:path');

function nullableString(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeExactText(value) {
  const normalized = nullableString(value);
  return normalized ? normalized.normalize('NFKC').replace(/\s+/g, ' ').toLowerCase() : null;
}

function normalizeCredit(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function canonicalCategory(value) {
  const normalized = nullableString(value)?.toUpperCase() || null;
  if (normalized === 'REQUIRED' || normalized === 'ELECTIVE') return normalized;
  if (value === '전공필수' || value === '전공기초') return 'REQUIRED';
  if (value === '전공선택') return 'ELECTIVE';
  return null;
}

function permanentKey(record) {
  return JSON.stringify([
    normalizeExactText(record.courseName ?? record.course_name),
    normalizeCredit(record.credit ?? record.credits),
    canonicalCategory(
      record.category ?? record.canonicalCourseCategory ?? record.courseCategory,
    ),
  ]);
}

function majorPermanentKey(record, majorId) {
  return JSON.stringify([Number(majorId), ...JSON.parse(permanentKey(record))]);
}

function officialNumberOf(record) {
  return nullableString(record.officialCourseNumber ?? record.official_course_number);
}

function publicSubject(subject) {
  return {
    officialCourseNumber: subject.officialCourseNumber,
    courseName: subject.courseName,
    credit: subject.credit,
    category: subject.category,
    sourceCategories: subject.sourceCategories,
    managingDepartments: subject.managingDepartments,
    offeringCount: subject.offerings.length,
  };
}

function buildOfficialSubjects(offerings) {
  const groups = new Map();
  const duplicateOfferingKeys = [];
  const offeringKeys = new Map();

  offerings.forEach((offering, index) => {
    const officialCourseNumber = officialNumberOf(offering);
    if (!officialCourseNumber) return;
    const key = JSON.stringify([
      offering.academicYear,
      offering.semester,
      officialCourseNumber,
      nullableString(offering.section),
    ]);
    if (offeringKeys.has(key)) {
      duplicateOfferingKeys.push({
        academicYear: offering.academicYear,
        semester: offering.semester,
        officialCourseNumber,
        section: nullableString(offering.section),
        indexes: [offeringKeys.get(key), index],
      });
    } else {
      offeringKeys.set(key, index);
    }
    if (!groups.has(officialCourseNumber)) groups.set(officialCourseNumber, []);
    groups.get(officialCourseNumber).push(offering);
  });

  const subjects = [];
  const conflicts = [];
  const managingDepartmentVariations = [];
  const sharedByMultipleSections = [];

  for (const [officialCourseNumber, rows] of groups) {
    const values = (reader) => [...new Set(rows.map(reader).map((value) => JSON.stringify(value)))].map(JSON.parse);
    const names = values((row) => nullableString(row.courseName));
    const credits = values((row) => normalizeCredit(row.credits ?? row.credit));
    const categories = values((row) =>
      canonicalCategory(row.canonicalCourseCategory ?? row.courseCategory ?? row.category),
    );
    const sourceCategories = values((row) => nullableString(row.courseCategory));
    const departments = values((row) => nullableString(row.managingDepartmentName)).filter(Boolean);
    const conflictFields = {};
    if (names.length !== 1) conflictFields.courseName = names;
    if (credits.length !== 1) conflictFields.credit = credits;
    if (categories.length !== 1) conflictFields.category = categories;

    const subject = {
      officialCourseNumber,
      courseName: names.length === 1 ? names[0] : null,
      credit: credits.length === 1 ? credits[0] : null,
      category: categories.length === 1 ? categories[0] : null,
      sourceCategories,
      managingDepartments: departments.sort(),
      offerings: rows,
      conflictFields,
    };
    subjects.push(subject);

    if (Object.keys(conflictFields).length) {
      conflicts.push({ ...publicSubject(subject), conflictFields });
    }
    if (departments.length > 1) {
      managingDepartmentVariations.push(publicSubject(subject));
    }
    if (rows.length > 1) {
      sharedByMultipleSections.push({
        officialCourseNumber,
        courseName: subject.courseName,
        offeringCount: rows.length,
        sections: [...new Set(rows.map((row) => nullableString(row.section)))].sort(),
      });
    }
  }

  return {
    subjects,
    conflicts,
    managingDepartmentVariations,
    sharedByMultipleSections,
    duplicateOfferingKeys,
  };
}

function summarizeTarget(target) {
  return {
    courseId: target.courseId ?? target.course_id ?? null,
    courseName: target.courseName ?? target.course_name ?? null,
    credit: normalizeCredit(target.credit ?? target.credits),
    majorId: target.majorId ?? target.major_id ?? target.productionMajorId ?? null,
    majorName: target.majorName ?? target.workbookMajorName ?? null,
    category: canonicalCategory(target.category),
  };
}

function finalizeOneToOne(provisional, targetIdentity, ambiguous) {
  const byTarget = new Map();
  for (const match of provisional) {
    const key = targetIdentity(match.target);
    if (!byTarget.has(key)) byTarget.set(key, []);
    byTarget.get(key).push(match);
  }

  const accepted = [];
  for (const matches of byTarget.values()) {
    if (matches.length === 1) {
      accepted.push(matches[0]);
      continue;
    }
    for (const match of matches) {
      ambiguous.push({
        official: publicSubject(match.subject),
        reason: 'MULTIPLE_OFFICIAL_SUBJECTS_FOR_ONE_TARGET',
        candidates: [summarizeTarget(match.target)],
        competingOfficialCourseNumbers: matches.map(
          (item) => item.subject.officialCourseNumber,
        ),
      });
    }
  }
  return accepted;
}

function matchCurriculumSubjects(subjects, curriculumRows) {
  const index = new Map();
  curriculumRows.forEach((row, targetIndex) => {
    const key = permanentKey(row);
    if (!index.has(key)) index.set(key, []);
    index.get(key).push({ ...row, _targetIndex: targetIndex });
  });

  const provisional = [];
  const ambiguous = [];
  const unmatched = [];
  const conflicts = [];
  for (const subject of subjects) {
    if (Object.keys(subject.conflictFields).length) {
      conflicts.push({ official: publicSubject(subject), reason: 'OFFICIAL_PERMANENT_FIELDS_CONFLICT' });
      continue;
    }
    const candidates = index.get(permanentKey(subject)) || [];
    if (candidates.length === 1) provisional.push({ subject, target: candidates[0] });
    else if (candidates.length > 1) {
      ambiguous.push({
        official: publicSubject(subject),
        reason: 'MULTIPLE_EXACT_TARGET_CANDIDATES',
        candidates: candidates.map(summarizeTarget),
      });
    } else {
      unmatched.push({ official: publicSubject(subject), reason: 'NO_EXACT_REVIEWED_FIELD_CANDIDATE' });
    }
  }

  const accepted = finalizeOneToOne(
    provisional,
    (target) => String(target._targetIndex),
    ambiguous,
  );
  return {
    safeExactMatches: [],
    deterministicBackfillCandidates: accepted.map(({ subject, target }) => ({
      official: publicSubject(subject),
      target: summarizeTarget(target),
      method: 'EXACT_NORMALIZED_NAME_CREDIT_CATEGORY_ONE_TO_ONE',
    })),
    acceptedByOfficialNumber: new Map(
      accepted.map(({ subject, target }) => [subject.officialCourseNumber, target]),
    ),
    ambiguous,
    unmatched,
    conflicts,
  };
}

function matchMajorScopedTarget(subjects, targets, curriculumByOfficial, options = {}) {
  const idField = options.idField || ((target, index) => target.courseId ?? target.course_id ?? index);
  const ambiguousBridgeOfficialNumbers =
    options.ambiguousBridgeOfficialNumbers || new Set();
  const exactIndex = new Map();
  const fallbackIndex = new Map();
  targets.forEach((target, targetIndex) => {
    const wrapped = { ...target, _targetIndex: targetIndex };
    const officialCourseNumber = officialNumberOf(target);
    if (officialCourseNumber) {
      if (!exactIndex.has(officialCourseNumber)) exactIndex.set(officialCourseNumber, []);
      exactIndex.get(officialCourseNumber).push(wrapped);
    }
    const majorId = target.majorId ?? target.major_id ?? target.productionMajorId;
    if (majorId != null) {
      const key = majorPermanentKey(target, majorId);
      if (!fallbackIndex.has(key)) fallbackIndex.set(key, []);
      fallbackIndex.get(key).push(wrapped);
    }
  });

  const safeExactMatches = [];
  const provisional = [];
  const ambiguous = [];
  const unmatched = [];
  const conflicts = [];

  for (const subject of subjects) {
    if (Object.keys(subject.conflictFields).length) {
      conflicts.push({ official: publicSubject(subject), reason: 'OFFICIAL_PERMANENT_FIELDS_CONFLICT' });
      continue;
    }
    const exact = exactIndex.get(subject.officialCourseNumber) || [];
    if (exact.length === 1) {
      if (permanentKey(exact[0]) === permanentKey(subject)) {
        safeExactMatches.push({
          official: publicSubject(subject),
          target: summarizeTarget(exact[0]),
          method: 'OFFICIAL_COURSE_NUMBER',
        });
      } else {
        conflicts.push({
          official: publicSubject(subject),
          target: summarizeTarget(exact[0]),
          reason: 'OFFICIAL_NUMBER_PERMANENT_FIELDS_CONFLICT',
        });
      }
      continue;
    }
    if (exact.length > 1) {
      ambiguous.push({
        official: publicSubject(subject),
        reason: 'OFFICIAL_NUMBER_MATCHES_MULTIPLE_TARGETS',
        candidates: exact.map(summarizeTarget),
      });
      continue;
    }

    const curriculumTarget = curriculumByOfficial.get(subject.officialCourseNumber);
    if (!curriculumTarget) {
      if (ambiguousBridgeOfficialNumbers.has(subject.officialCourseNumber)) {
        ambiguous.push({
          official: publicSubject(subject),
          reason: 'AMBIGUOUS_CURRICULUM_MAJOR_BRIDGE',
          candidates: [],
        });
      } else {
        unmatched.push({
          official: publicSubject(subject),
          reason: 'NO_CURRICULUM_MAJOR_BRIDGE',
        });
      }
      continue;
    }
    const majorId = curriculumTarget.majorId ?? curriculumTarget.major_id;
    const candidates = fallbackIndex.get(majorPermanentKey(subject, majorId)) || [];
    if (candidates.length === 1) provisional.push({ subject, target: candidates[0] });
    else if (candidates.length > 1) {
      ambiguous.push({
        official: publicSubject(subject),
        reason: 'MULTIPLE_EXACT_MAJOR_SCOPED_CANDIDATES',
        candidates: candidates.map(summarizeTarget),
      });
    } else {
      unmatched.push({ official: publicSubject(subject), reason: 'NO_EXACT_MAJOR_SCOPED_CANDIDATE' });
    }
  }

  const accepted = finalizeOneToOne(
    provisional,
    (target) => String(idField(target, target._targetIndex)),
    ambiguous,
  );
  return {
    safeExactMatches,
    deterministicBackfillCandidates: accepted.map(({ subject, target }) => ({
      official: publicSubject(subject),
      target: summarizeTarget(target),
      method: 'CURRICULUM_MAJOR_BRIDGE_PLUS_EXACT_NAME_CREDIT_CATEGORY_ONE_TO_ONE',
    })),
    ambiguous,
    unmatched,
    conflicts,
  };
}

function prepareEngineeringTargets(workbook, mappingConfig) {
  const majorNames = new Map(
    (workbook.sheets.engineering_courses?.rows || []).map((row) => [
      String(row.major_id),
      row.major_name,
    ]),
  );
  const mappings = new Map(
    (mappingConfig.mappings || []).map((mapping) => [
      String(mapping.workbook_major_id),
      mapping,
    ]),
  );
  return (workbook.sheets.courses?.rows || []).map((row) => {
    const mapping = mappings.get(String(row.major_id));
    const confirmed = mapping?.status === 'CONFIRMED' && mapping.production_major_id != null;
    return {
      courseName: row.course_name,
      credit: row.credit,
      category: row.category,
      workbookMajorName: majorNames.get(String(row.major_id)) ?? null,
      productionMajorId: confirmed ? mapping.production_major_id : null,
      majorMappingStatus: confirmed ? 'CONFIRMED' : 'UNRESOLVED',
    };
  });
}

async function fetchProductionCourses(supabase, pageSize = 1000) {
  async function fetchColumns(columns) {
    const rows = [];
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase.from('course').select(columns)
        .order('course_id', { ascending: true }).range(from, from + pageSize - 1);
      if (error) return { rows: null, error };
      rows.push(...(data || []));
      if (!data || data.length < pageSize) return { rows, error: null };
    }
  }
  const withOfficial = await fetchColumns('course_id,course_name,credit,major_id,category,official_course_number');
  if (!withOfficial.error) return withOfficial.rows;
  const withoutOfficial = await fetchColumns('course_id,course_name,credit,major_id,category');
  if (withoutOfficial.error) throw new Error(`Read-only production course query failed: ${withoutOfficial.error.message}`);
  return withoutOfficial.rows.map((row) => ({ ...row, official_course_number: null }));
}

function counts(result) {
  return {
    safeExactMatches: result.safeExactMatches.length,
    deterministicBackfillCandidates: result.deterministicBackfillCandidates.length,
    ambiguous: result.ambiguous.length,
    unmatched: result.unmatched.length,
    conflicts: result.conflicts.length,
  };
}

function createMatchingReport({ officialSnapshot, productionCourses, curriculumRows, engineeringTargets, reviewedIdentityAssignments = [] }) {
  const official = buildOfficialSubjects(officialSnapshot.offerings || []);
  const curriculum = matchCurriculumSubjects(official.subjects, curriculumRows);
  const reviewedByOfficial = new Map();
  const reviewedIdentityDrift = [];
  for (const assignment of reviewedIdentityAssignments) {
    const number = nullableString(assignment.official_course_number);
    if (!number || reviewedByOfficial.has(number)) {
      if (number) reviewedIdentityDrift.push({ officialCourseNumber: number, reason: 'DUPLICATE_PRIOR_REVIEWED_IDENTITY' });
      continue;
    }
    const current = productionCourses.filter((row) => String(row.course_id) === String(assignment.course_id));
    const bridge = {
      courseName: assignment.expected_course_name,
      credit: assignment.expected_credit,
      category: assignment.expected_category,
      majorId: assignment.expected_major_id,
    };
    if (current.length !== 1 || permanentKey(current[0]) !== permanentKey(bridge) || Number(current[0].major_id) !== Number(bridge.majorId)) {
      reviewedIdentityDrift.push({ officialCourseNumber: number, courseId: assignment.course_id, reason: 'PRIOR_REVIEWED_IDENTITY_PRODUCTION_DRIFT' });
      continue;
    }
    reviewedByOfficial.set(number, bridge);
  }
  const identityBridge = new Map(curriculum.acceptedByOfficialNumber);
  for (const subject of official.subjects) {
    const bridge = reviewedByOfficial.get(subject.officialCourseNumber);
    if (!bridge) continue;
    if (permanentKey(subject) !== permanentKey(bridge)) {
      reviewedIdentityDrift.push({ officialCourseNumber: subject.officialCourseNumber, reason: 'PRIOR_REVIEWED_IDENTITY_OFFICIAL_SNAPSHOT_DRIFT' });
      continue;
    }
    identityBridge.set(subject.officialCourseNumber, bridge);
  }
  const ambiguousBridgeOfficialNumbers = new Set(
    curriculum.ambiguous.map((item) => item.official.officialCourseNumber),
  );
  const production = matchMajorScopedTarget(
    official.subjects,
    productionCourses,
    identityBridge,
    { ambiguousBridgeOfficialNumbers },
  );
  const engineering = matchMajorScopedTarget(
    official.subjects,
    engineeringTargets.filter((row) => row.productionMajorId != null),
    identityBridge,
    {
      idField: (_target, index) => index,
      ambiguousBridgeOfficialNumbers,
    },
  );

  const linkableOfficialNumbers = new Set([
    ...production.safeExactMatches.map((match) => match.official.officialCourseNumber),
    ...production.deterministicBackfillCandidates.map(
      (match) => match.official.officialCourseNumber,
    ),
  ]);
  const linkableOfferings = (officialSnapshot.offerings || []).filter((offering) =>
    linkableOfficialNumbers.has(offering.officialCourseNumber),
  );
  const touchedCourseIds = new Set(
    [
      ...production.safeExactMatches,
      ...production.deterministicBackfillCandidates,
    ].map((match) => match.target.courseId),
  );

  const publicResult = (result) => ({
    safeExactMatches: result.safeExactMatches,
    deterministicBackfillCandidates: result.deterministicBackfillCandidates,
    ambiguous: result.ambiguous,
    unmatched: result.unmatched,
    conflicts: result.conflicts,
  });

  return {
    generatedAt: new Date().toISOString(),
    mode: 'READ_ONLY_DRY_RUN',
    source: {
      academicYear: officialSnapshot.academicYear,
      semester: officialSnapshot.semester,
      sourceUrl: officialSnapshot.sourceUrl,
      retrievedAt: officialSnapshot.retrievedAt,
    },
    summary: {
      officialOfferings: (officialSnapshot.offerings || []).length,
      officialPermanentSubjects: official.subjects.length,
      officialNumbersSharedByMultipleSections: official.sharedByMultipleSections.length,
      duplicateOfficialOfferingKeys: official.duplicateOfferingKeys.length,
      officialPermanentFieldConflicts: official.conflicts.length,
      officialManagingDepartmentVariations: official.managingDepartmentVariations.length,
      reviewedIdentityDrift: reviewedIdentityDrift.length,
      production: counts(production),
      curriculum: counts(curriculum),
      engineeringWorkbook: counts(engineering),
      productionCoursesEligibleForOfficialNumberBackfill:
        production.deterministicBackfillCandidates.length,
      productionCoursesAlreadyLinkedByOfficialNumber: production.safeExactMatches.length,
      officialOfferingsLinkableAfterSafeBackfill: linkableOfferings.length,
      englishOfferingsLinkableAfterSafeBackfill: linkableOfferings.filter(
        (offering) => offering.teachingLanguage === 'ENGLISH',
      ).length,
      productionCoursesUntouched: productionCourses.length - touchedCourseIds.size,
    },
    officialIdentityAudit: {
      conflicts: official.conflicts,
      managingDepartmentVariations: official.managingDepartmentVariations,
      duplicateOfferingKeys: official.duplicateOfferingKeys,
      officialNumbersSharedByMultipleSections: official.sharedByMultipleSections,
      reviewedIdentityDrift,
    },
    matches: {
      production: publicResult(production),
      curriculum: publicResult(curriculum),
      engineeringWorkbook: publicResult(engineering),
    },
    dryRunBackfillPlan: {
      productionCourseOfficialNumberBackfills: production.deterministicBackfillCandidates,
      productionCoursesAlreadyLinked: production.safeExactMatches,
      productionCourseIdsUntouched: productionCourses
        .filter((row) => !touchedCourseIds.has(row.course_id))
        .map((row) => row.course_id),
      linkableOfficialCourseNumbers: [...linkableOfficialNumbers].sort(),
      linkableOfferingCount: linkableOfferings.length,
      englishOfferingCount: linkableOfferings.filter(
        (offering) => offering.teachingLanguage === 'ENGLISH',
      ).length,
    },
  };
}

function localMatchingOutputPath(backendRoot, academicYear, semester) {
  return join(
    backendRoot,
    'data',
    'local',
    'pnu-course-matches',
    `${academicYear}-${semester}.json`,
  );
}

async function writeLocalMatchingReport(report, backendRoot) {
  const outputRoot = resolve(backendRoot, 'data', 'local', 'pnu-course-matches');
  const outputPath = resolve(
    localMatchingOutputPath(
      backendRoot,
      report.source.academicYear,
      report.source.semester,
    ),
  );
  if (outputPath !== outputRoot && !outputPath.startsWith(`${outputRoot}${sep}`)) {
    throw new Error('Refusing to write outside the gitignored local matching-report directory');
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return outputPath;
}

module.exports = {
  buildOfficialSubjects,
  canonicalCategory,
  createMatchingReport,
  fetchProductionCourses,
  localMatchingOutputPath,
  matchCurriculumSubjects,
  matchMajorScopedTarget,
  normalizeExactText,
  prepareEngineeringTargets,
  writeLocalMatchingReport,
};
