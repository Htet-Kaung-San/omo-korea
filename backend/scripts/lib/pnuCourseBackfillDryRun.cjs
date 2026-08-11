const { mkdir, writeFile } = require('node:fs/promises');
const { createHash } = require('node:crypto');
const { dirname, join, resolve, sep } = require('node:path');

const {
  buildOfficialSubjects,
  canonicalCategory,
  normalizeExactText,
} = require('./pnuCourseMatching.cjs');

function normalizeCredit(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function candidateIdentity(candidate) {
  return {
    officialCourseNumber: candidate?.official?.officialCourseNumber ?? null,
    courseId: candidate?.target?.courseId ?? null,
    courseName: candidate?.official?.courseName ?? null,
    credit: normalizeCredit(candidate?.official?.credit),
    category: canonicalCategory(candidate?.official?.category),
    majorId: candidate?.target?.majorId ?? null,
  };
}

function reason(code, detail) {
  return { code, detail };
}

function reviewBackfillCandidates({ matchingReport, officialSnapshot, productionCourses }) {
  const candidates =
    matchingReport?.dryRunBackfillPlan?.productionCourseOfficialNumberBackfills || [];
  const crossDepartmentNumbers = new Set(
    (matchingReport?.officialIdentityAudit?.managingDepartmentVariations || []).map(
      (item) => item.officialCourseNumber,
    ),
  );
  const currentOfficialAudit = officialSnapshot
    ? buildOfficialSubjects(officialSnapshot.offerings || [])
    : null;
  const currentOfficialByNumber = new Map(
    (currentOfficialAudit?.subjects || []).map((subject) => [
      subject.officialCourseNumber,
      subject,
    ]),
  );
  for (const subject of currentOfficialAudit?.managingDepartmentVariations || []) {
    crossDepartmentNumbers.add(subject.officialCourseNumber);
  }
  const productionById = new Map();
  for (const row of productionCourses) {
    const courseId = String(row.course_id);
    if (!productionById.has(courseId)) productionById.set(courseId, []);
    productionById.get(courseId).push(row);
  }

  const candidatesByOfficial = new Map();
  const candidatesByCourse = new Map();
  for (const candidate of candidates) {
    const identity = candidateIdentity(candidate);
    const officialKey = String(identity.officialCourseNumber);
    const courseKey = String(identity.courseId);
    if (!candidatesByOfficial.has(officialKey)) candidatesByOfficial.set(officialKey, []);
    if (!candidatesByCourse.has(courseKey)) candidatesByCourse.set(courseKey, []);
    candidatesByOfficial.get(officialKey).push(candidate);
    candidatesByCourse.get(courseKey).push(candidate);
  }

  const approvedCandidates = [];
  const rejectedCandidates = [];
  const ambiguousCandidates = [];
  const changedProductionRecords = [];

  for (const candidate of candidates) {
    const identity = candidateIdentity(candidate);
    const rejectionReasons = [];
    const ambiguityReasons = [];
    const officialCandidates = candidatesByOfficial.get(String(identity.officialCourseNumber)) || [];
    const courseCandidates = candidatesByCourse.get(String(identity.courseId)) || [];

    if (!identity.officialCourseNumber || !identity.courseId) {
      rejectionReasons.push(reason('MISSING_IDENTITY', 'Candidate lacks an official number or production course ID.'));
    }
    if (officialCandidates.length !== 1) {
      ambiguityReasons.push(
        reason(
          'OFFICIAL_NUMBER_MULTIPLE_PRODUCTION_CANDIDATES',
          `${officialCandidates.length} candidates share this official number.`,
        ),
      );
    }
    if (courseCandidates.length !== 1) {
      ambiguityReasons.push(
        reason(
          'PRODUCTION_COURSE_COMPETING_OFFICIAL_NUMBERS',
          `${courseCandidates.length} official-number candidates target this production course.`,
        ),
      );
    }
    if (crossDepartmentNumbers.has(identity.officialCourseNumber)) {
      ambiguityReasons.push(
        reason(
          'CROSS_DEPARTMENT_IDENTITY_CONFLICT',
          'The official number occurs under multiple managing departments.',
        ),
      );
    }

    if (currentOfficialAudit) {
      const currentOfficial = currentOfficialByNumber.get(identity.officialCourseNumber);
      if (!currentOfficial) {
        rejectionReasons.push(
          reason('OFFICIAL_SUBJECT_MISSING', 'The official number is absent from the current saved snapshot.'),
        );
      } else if (Object.keys(currentOfficial.conflictFields).length) {
        ambiguityReasons.push(
          reason('OFFICIAL_PERMANENT_FIELDS_CONFLICT', 'The current official snapshot has conflicting permanent fields.'),
        );
      } else {
        const changedOfficialFields = [];
        if (normalizeExactText(currentOfficial.courseName) !== normalizeExactText(identity.courseName)) {
          changedOfficialFields.push('course_name');
        }
        if (normalizeCredit(currentOfficial.credit) !== identity.credit) {
          changedOfficialFields.push('credit');
        }
        if (canonicalCategory(currentOfficial.category) !== identity.category) {
          changedOfficialFields.push('category');
        }
        if (changedOfficialFields.length) {
          rejectionReasons.push(
            reason(
              'OFFICIAL_SNAPSHOT_CHANGED_SINCE_MATCH_REPORT',
              `Changed fields: ${changedOfficialFields.join(', ')}.`,
            ),
          );
        }
      }
    }

    const currentRows = productionById.get(String(identity.courseId)) || [];
    if (currentRows.length !== 1) {
      rejectionReasons.push(
        reason(
          currentRows.length === 0 ? 'PRODUCTION_COURSE_MISSING' : 'PRODUCTION_COURSE_ID_NOT_UNIQUE',
          `Current production query returned ${currentRows.length} rows for course ID ${identity.courseId}.`,
        ),
      );
    } else {
      const current = currentRows[0];
      const expected = candidate.target;
      const changedFields = [];
      if (normalizeExactText(current.course_name) !== normalizeExactText(expected.courseName)) {
        changedFields.push('course_name');
      }
      if (normalizeCredit(current.credit) !== normalizeCredit(expected.credit)) {
        changedFields.push('credit');
      }
      if (canonicalCategory(current.category) !== canonicalCategory(expected.category)) {
        changedFields.push('category');
      }
      if (Number(current.major_id) !== Number(expected.majorId)) {
        changedFields.push('major_id');
      }
      if (changedFields.length) {
        const change = {
          courseId: identity.courseId,
          officialCourseNumber: identity.officialCourseNumber,
          changedFields,
          expected: {
            courseName: expected.courseName,
            credit: expected.credit,
            category: expected.category,
            majorId: expected.majorId,
          },
          current: {
            courseName: current.course_name,
            credit: current.credit,
            category: current.category,
            majorId: current.major_id,
          },
        };
        changedProductionRecords.push(change);
        rejectionReasons.push(
          reason(
            'PRODUCTION_RECORD_CHANGED_SINCE_MATCH_REPORT',
            `Changed fields: ${changedFields.join(', ')}.`,
          ),
        );
      }

      if (normalizeExactText(current.course_name) !== normalizeExactText(identity.courseName)) {
        rejectionReasons.push(reason('COURSE_NAME_MISMATCH', 'Official and current production names do not match exactly after normalization.'));
      }
      if (normalizeCredit(current.credit) !== identity.credit) {
        rejectionReasons.push(reason('CREDIT_MISMATCH', 'Official and current production credits differ.'));
      }
      if (canonicalCategory(current.category) !== identity.category) {
        rejectionReasons.push(reason('CATEGORY_MISMATCH', 'Official and current production categories differ.'));
      }
      if (Number(current.major_id) !== Number(identity.majorId)) {
        rejectionReasons.push(reason('MAJOR_MISMATCH', 'The reviewed production major does not match the current course.'));
      }
    }

    const reviewed = {
      ...identity,
      method: candidate.method ?? null,
      rejectionReasons,
      ambiguityReasons,
    };
    if (ambiguityReasons.length) ambiguousCandidates.push(reviewed);
    else if (rejectionReasons.length) rejectedCandidates.push(reviewed);
    else approvedCandidates.push(reviewed);
  }

  return {
    candidateCount: candidates.length,
    approvedCandidates,
    rejectedCandidates,
    ambiguousCandidates,
    changedProductionRecords,
  };
}

function proposedOfferingRow(offering, courseId) {
  return {
    course_id: courseId,
    official_course_number: offering.officialCourseNumber,
    academic_year: offering.academicYear,
    semester: offering.semester,
    section: offering.section,
    professor: offering.professor ?? null,
    year_level: offering.yearLevel ?? null,
    theory_hours: offering.theoryHours ?? null,
    practical_hours: offering.practicalHours ?? null,
    enrollment_limit: offering.enrollmentLimit ?? null,
    schedule: offering.schedule ?? offering.scheduleAndClassroom ?? null,
    classroom: offering.classroom ?? null,
    remote_course_status: offering.remoteCourseStatus ?? null,
    team_teaching_status: offering.teamTeachingStatus ?? null,
    general_education_area: offering.generalEducationArea ?? null,
    remarks: offering.remarks ?? null,
    original_language_code: offering.originalLanguageCode ?? null,
    teaching_language: offering.teachingLanguage ?? null,
    source_url: offering.sourceUrl ?? null,
    retrieved_at: offering.retrievedAt ?? null,
  };
}

function createBackfillDryRunReport({ matchingReport, officialSnapshot, productionCourses, now }) {
  const review = reviewBackfillCandidates({
    matchingReport,
    officialSnapshot,
    productionCourses,
  });
  const approvedCourseByOfficial = new Map(
    review.approvedCandidates.map((candidate) => [
      candidate.officialCourseNumber,
      candidate.courseId,
    ]),
  );
  const proposedCourseOfferingRows = (officialSnapshot.offerings || [])
    .filter((offering) => approvedCourseByOfficial.has(offering.officialCourseNumber))
    .map((offering) =>
      proposedOfferingRow(
        offering,
        approvedCourseByOfficial.get(offering.officialCourseNumber),
      ),
    );
  const proposedCourseNumberAssignments = review.approvedCandidates.map((candidate) => ({
    course_id: candidate.courseId,
    official_course_number: candidate.officialCourseNumber,
  }));

  return {
    generatedAt: (now || (() => new Date()))().toISOString(),
    mode: 'STRICT_READ_ONLY_DRY_RUN',
    source: {
      academicYear: officialSnapshot.academicYear,
      semester: officialSnapshot.semester,
      matchingReportGeneratedAt: matchingReport.generatedAt ?? null,
      officialSnapshotRetrievedAt: officialSnapshot.retrievedAt ?? null,
    },
    summary: {
      inputCandidates: review.candidateCount,
      approvedCandidates: review.approvedCandidates.length,
      rejectedCandidates: review.rejectedCandidates.length,
      ambiguousCandidates: review.ambiguousCandidates.length,
      changedProductionRecords: review.changedProductionRecords.length,
      proposedCourseNumberAssignments: proposedCourseNumberAssignments.length,
      proposedCourseOfferingRows: proposedCourseOfferingRows.length,
      proposedEnglishOfferingRows: proposedCourseOfferingRows.filter(
        (row) => row.teaching_language === 'ENGLISH',
      ).length,
    },
    strictReview: review,
    proposedCourseNumberAssignments,
    proposedCourseOfferingRows,
  };
}

function localDryRunOutputPath(backendRoot, academicYear, semester) {
  return join(
    backendRoot,
    'data',
    'local',
    'pnu-course-backfill-dry-run',
    `${academicYear}-${semester}.json`,
  );
}

async function writeLocalDryRunReport(report, backendRoot) {
  const outputRoot = resolve(backendRoot, 'data', 'local', 'pnu-course-backfill-dry-run');
  const outputPath = resolve(
    localDryRunOutputPath(backendRoot, report.source.academicYear, report.source.semester),
  );
  if (outputPath !== outputRoot && !outputPath.startsWith(`${outputRoot}${sep}`)) {
    throw new Error('Refusing to write outside the gitignored dry-run directory');
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return outputPath;
}

function sha256(value) {
  const hash = createHash('sha256');
  hash.end(Buffer.from(value, 'utf8'));
  return hash.digest('hex');
}

function duplicateCount(items, keyFor) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFor(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.values()].filter((count) => count > 1).length;
}

function createProductionReadinessReview({
  officialSnapshotText,
  matchingReportText,
  dryRunReportText,
  productionCourses,
  now,
}) {
  const officialSnapshot = JSON.parse(officialSnapshotText);
  const matchingReport = JSON.parse(matchingReportText);
  const dryRunReport = JSON.parse(dryRunReportText);
  const strictReview = reviewBackfillCandidates({
    matchingReport,
    officialSnapshot,
    productionCourses,
  });
  const assignments = dryRunReport.proposedCourseNumberAssignments || [];
  const offerings = dryRunReport.proposedCourseOfferingRows || [];
  const assignmentNumbers = new Set(
    assignments.map((item) => item.official_course_number),
  );
  const officialAudit = require('./pnuCourseMatching.cjs').buildOfficialSubjects(
    officialSnapshot.offerings || [],
  );
  const crossDepartmentNumbers = new Set(
    officialAudit.managingDepartmentVariations.map(
      (item) => item.officialCourseNumber,
    ),
  );
  const ambiguousNumbers = new Set(
    (matchingReport.matches?.production?.ambiguous || []).map(
      (item) => item.official.officialCourseNumber,
    ),
  );
  const unmatchedNumbers = new Set(
    (matchingReport.matches?.production?.unmatched || []).map(
      (item) => item.official.officialCourseNumber,
    ),
  );
  const sourceOfferingByKey = new Map(
    (officialSnapshot.offerings || []).map((item) => [
      [item.academicYear, item.semester, item.officialCourseNumber, item.section].join('|'),
      item,
    ]),
  );

  const languageDrift = offerings.filter((item) => {
    const source = sourceOfferingByKey.get(
      [item.academic_year, item.semester, item.official_course_number, item.section].join('|'),
    );
    return (
      !source ||
      (source.originalLanguageCode ?? null) !== (item.original_language_code ?? null) ||
      (source.teachingLanguage ?? null) !== (item.teaching_language ?? null)
    );
  });
  const explicitEnglishOfferings = (officialSnapshot.offerings || []).filter(
    (item) => item.isEnglishTaught === true,
  );
  const invalidEnglish = (officialSnapshot.offerings || []).filter(
    (item) =>
      (item.isEnglishTaught === true &&
        (item.originalLanguageCode !== 'E' || item.teachingLanguage !== 'ENGLISH')) ||
      (item.originalLanguageCode === 'E' && item.isEnglishTaught !== true),
  );
  const nullLanguageCorruption = (officialSnapshot.offerings || []).filter(
    (item) =>
      item.originalLanguageCode === null &&
      (item.teachingLanguage !== null || item.isEnglishTaught !== null),
  );

  const checks = {
    strictApprovedCandidates: strictReview.approvedCandidates.length,
    strictRejectedCandidates: strictReview.rejectedCandidates.length,
    strictAmbiguousCandidates: strictReview.ambiguousCandidates.length,
    changedProductionRecords: strictReview.changedProductionRecords.length,
    duplicateProductionCourseAssignments: duplicateCount(
      assignments,
      (item) => String(item.course_id),
    ),
    duplicateOfficialNumberAssignments: duplicateCount(
      assignments,
      (item) => item.official_course_number,
    ),
    duplicateOfferingOfficialKeys: duplicateCount(
      offerings,
      (item) =>
        [item.academic_year, item.semester, item.official_course_number, item.section].join('|'),
    ),
    duplicateOfferingCourseKeys: duplicateCount(
      offerings,
      (item) => [item.course_id, item.academic_year, item.semester, item.section].join('|'),
    ),
    offeringsWithoutApprovedAssignment: offerings.filter(
      (item) => !assignmentNumbers.has(item.official_course_number),
    ).length,
    crossDepartmentAssignments: assignments.filter((item) =>
      crossDepartmentNumbers.has(item.official_course_number),
    ).length,
    ambiguousAssignments: assignments.filter((item) =>
      ambiguousNumbers.has(item.official_course_number),
    ).length,
    unmatchedAssignments: assignments.filter((item) =>
      unmatchedNumbers.has(item.official_course_number),
    ).length,
    languageDrift: languageDrift.length,
    invalidExplicitEnglish: invalidEnglish.length,
    nullLanguageCorruption: nullLanguageCorruption.length,
  };
  const expectedZeroChecks = Object.entries(checks).filter(
    ([name]) => name !== 'strictApprovedCandidates',
  );
  const ready =
    checks.strictApprovedCandidates === assignments.length &&
    expectedZeroChecks.every(([, value]) => value === 0);
  const reviewedProposal = {
    courseNumberAssignments: assignments,
    courseOfferingRows: offerings,
  };

  return {
    generatedAt: (now || (() => new Date()))().toISOString(),
    mode: 'READ_ONLY_PRODUCTION_READINESS_REVIEW',
    ready,
    checksums: {
      sourceOfferingSnapshotSha256: sha256(officialSnapshotText),
      phase3MatchReportSha256: sha256(matchingReportText),
      phase4DryRunReportSha256: sha256(dryRunReportText),
      finalReviewedProposalSha256: sha256(JSON.stringify(reviewedProposal)),
    },
    counts: {
      productionCourses: productionCourses.length,
      approvedCourseNumberAssignments: assignments.length,
      approvedCourseOfferingRows: offerings.length,
      explicitEnglishOfferingRows: offerings.filter(
        (item) => item.teaching_language === 'ENGLISH',
      ).length,
      untouchedAmbiguousOfficialSubjects: ambiguousNumbers.size,
      untouchedUnmatchedOfficialSubjects: unmatchedNumbers.size,
      excludedCrossDepartmentOfficialNumbers: crossDepartmentNumbers.size,
      sourceExplicitEnglishOfferings: explicitEnglishOfferings.length,
    },
    checks,
    reviewedProposal,
  };
}

function localProductionReviewPath(backendRoot, academicYear, semester) {
  return join(
    backendRoot,
    'data',
    'local',
    'pnu-course-production-review',
    `${academicYear}-${semester}.json`,
  );
}

async function writeLocalProductionReview(report, backendRoot, academicYear, semester) {
  const outputRoot = resolve(backendRoot, 'data', 'local', 'pnu-course-production-review');
  const outputPath = resolve(
    localProductionReviewPath(backendRoot, academicYear, semester),
  );
  if (outputPath !== outputRoot && !outputPath.startsWith(`${outputRoot}${sep}`)) {
    throw new Error('Refusing to write outside the gitignored production-review directory');
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return outputPath;
}

module.exports = {
  candidateIdentity,
  createBackfillDryRunReport,
  createProductionReadinessReview,
  localDryRunOutputPath,
  localProductionReviewPath,
  proposedOfferingRow,
  reviewBackfillCandidates,
  writeLocalDryRunReport,
  writeLocalProductionReview,
};
