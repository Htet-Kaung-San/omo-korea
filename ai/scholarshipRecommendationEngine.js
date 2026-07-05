function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

function getMatches(studentValues, itemValues) {
  const studentSet = new Set(normalizeArray(studentValues).map(normalizeValue));

  return normalizeArray(itemValues).filter((value) =>
    studentSet.has(normalizeValue(value))
  );
}

function listIncludesValue(list, value) {
  return normalizeArray(list).map(normalizeValue).includes(normalizeValue(value));
}

function passesMinimum(studentValue, minimumValue) {
  const parsedMinimum = Number(minimumValue);

  if (!Number.isFinite(parsedMinimum)) {
    return true;
  }

  const parsedStudentValue = Number(studentValue);

  return Number.isFinite(parsedStudentValue) && parsedStudentValue >= parsedMinimum;
}

function passesYearEligibility(studentYear, minYear, maxYear) {
  const parsedStudentYear = Number(studentYear);
  const parsedMinYear = Number(minYear);
  const parsedMaxYear = Number(maxYear);
  const hasMinYear = Number.isFinite(parsedMinYear);
  const hasMaxYear = Number.isFinite(parsedMaxYear);

  if (!hasMinYear && !hasMaxYear) {
    return true;
  }

  if (!Number.isFinite(parsedStudentYear)) {
    return false;
  }

  if (hasMinYear && parsedStudentYear < parsedMinYear) {
    return false;
  }

  if (hasMaxYear && parsedStudentYear > parsedMaxYear) {
    return false;
  }

  return true;
}

function passesListEligibility(studentValue, eligibleValues) {
  const values = normalizeArray(eligibleValues);

  if (values.length === 0) {
    return true;
  }

  return listIncludesValue(values, studentValue);
}

function passesEligibility(studentProfile, scholarship) {
  return (
    passesListEligibility(studentProfile.major, scholarship.eligibleMajors) &&
    passesListEligibility(
      studentProfile.nationality,
      scholarship.eligibleNationalities
    ) &&
    passesMinimum(studentProfile.gpa, scholarship.minGpa) &&
    passesMinimum(studentProfile.topikLevel, scholarship.minTopikLevel) &&
    passesYearEligibility(
      studentProfile.year,
      scholarship.minYear,
      scholarship.maxYear
    )
  );
}

function buildMatchHint({
  majorMatch,
  nationalityMatch,
  hasMinGpa,
  hasMinTopikLevel,
  interestMatches,
}) {
  const hints = ['Eligible scholarship match'];

  if (majorMatch) hints.push('Matches your major');
  if (nationalityMatch) hints.push('Matches your nationality');
  if (hasMinGpa) hints.push('Meets GPA requirement');
  if (hasMinTopikLevel) hints.push('Meets TOPIK requirement');
  if (interestMatches.length > 0) {
    hints.push(`Matches interests: ${interestMatches.slice(0, 2).join(', ')}`);
  }

  return hints.join('; ');
}

function scoreScholarship(studentProfile, scholarship) {
  const majorMatch = listIncludesValue(
    scholarship.eligibleMajors,
    studentProfile.major
  );
  const nationalityMatch = listIncludesValue(
    scholarship.eligibleNationalities,
    studentProfile.nationality
  );
  const hasMinGpa = Number.isFinite(Number(scholarship.minGpa));
  const hasMinTopikLevel = Number.isFinite(Number(scholarship.minTopikLevel));
  const interestMatches = getMatches(studentProfile.interests, scholarship.tags);

  let score = 10;

  if (majorMatch) score += 20;
  if (nationalityMatch) score += 15;
  if (hasMinGpa) score += 10;
  if (hasMinTopikLevel) score += 10;
  score += Math.min(interestMatches.length, 2) * 10;

  return {
    score: Math.min(score, 100),
    matchHint: buildMatchHint({
      majorMatch,
      nationalityMatch,
      hasMinGpa,
      hasMinTopikLevel,
      interestMatches,
    }),
  };
}

function compareScholarships(a, b) {
  if (b.score !== a.score) return b.score - a.score;

  const deadlineComparison = String(a.deadline || '').localeCompare(
    String(b.deadline || '')
  );
  if (deadlineComparison !== 0) return deadlineComparison;

  return String(a.title || '').localeCompare(String(b.title || ''));
}

function recommendScholarships(
  studentProfile = {},
  scholarships = [],
  options = {}
) {
  const normalizedScholarships = normalizeArray(scholarships);
  const excludeScholarshipIds = new Set(
    normalizeArray(options.excludeScholarshipIds).map(String)
  );
  const limit =
    Number.isInteger(options.limit) && options.limit > 0
      ? options.limit
      : normalizedScholarships.length;

  return normalizedScholarships
    .filter((scholarship) => !excludeScholarshipIds.has(String(scholarship.id)))
    .filter((scholarship) => passesEligibility(studentProfile, scholarship))
    .map((scholarship) => ({
      ...scholarship,
      ...scoreScholarship(studentProfile, scholarship),
    }))
    .sort(compareScholarships)
    .slice(0, limit);
}

module.exports = {
  recommendScholarships,
};
