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

function isYearEligible(studentYear, minYear, maxYear) {
  if (!Number.isFinite(studentYear)) {
    return false;
  }

  const minimumYear = Number.isFinite(minYear) ? minYear : studentYear;
  const maximumYear = Number.isFinite(maxYear) ? maxYear : studentYear;

  return studentYear >= minimumYear && studentYear <= maximumYear;
}

function isMajorEligible(studentMajor, eligibleMajors) {
  const majors = normalizeArray(eligibleMajors);

  if (majors.length === 0) {
    return true;
  }

  return majors.map(normalizeValue).includes(normalizeValue(studentMajor));
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

function passesEligibility(studentProfile, program) {
  return (
    isMajorEligible(studentProfile.major, program.eligibleMajors) &&
    passesYearEligibility(studentProfile.year, program.minYear, program.maxYear)
  );
}

function buildMatchHint({
  interestMatches,
  careerMatches,
  isMajorEligible,
  languageMatches,
  isEligibleYear,
}) {
  const hints = [];

  if (interestMatches.length > 0) {
    hints.push(`Matches interests: ${interestMatches.slice(0, 2).join(', ')}`);
  }
  if (careerMatches.length > 0) {
    hints.push(`Matches career areas: ${careerMatches.slice(0, 2).join(', ')}`);
  }
  if (isMajorEligible) hints.push('Eligible for your major');
  if (languageMatches.length > 0) {
    hints.push(`Available in your language: ${languageMatches[0]}`);
  }
  if (isEligibleYear) hints.push('Available for your year');

  return hints.join('; ');
}

function scoreProgram(studentProfile, program) {
  const interestMatches = getMatches(studentProfile.interests, program.tags);
  const careerMatches = getMatches(
    studentProfile.careerAreas,
    program.careerTags
  );
  const eligibleMajors = normalizeArray(program.eligibleMajors);
  const receivesMajorScore = eligibleMajors
    .map(normalizeValue)
    .includes(normalizeValue(studentProfile.major));
  const languageMatches = getMatches(studentProfile.languages, program.languages);
  const isEligibleYear = isYearEligible(
    Number(studentProfile.year),
    Number(program.minYear),
    Number(program.maxYear)
  );

  let score = 0;

  score += Math.min(interestMatches.length, 2) * 20;
  score += Math.min(careerMatches.length, 2) * 15;
  if (receivesMajorScore) score += 20;
  if (languageMatches.length > 0) score += 10;
  if (isEligibleYear) score += 10;

  return {
    score: Math.min(score, 100),
    matchHint: buildMatchHint({
      interestMatches,
      careerMatches,
      isMajorEligible: receivesMajorScore,
      languageMatches,
      isEligibleYear,
    }),
  };
}

function comparePrograms(a, b) {
  if (b.score !== a.score) return b.score - a.score;

  const dateComparison = String(a.date || '').localeCompare(String(b.date || ''));
  if (dateComparison !== 0) return dateComparison;

  return String(a.title || '').localeCompare(String(b.title || ''));
}

function recommendPrograms(studentProfile = {}, programs = [], options = {}) {
  const normalizedPrograms = normalizeArray(programs);
  const excludeProgramIds = new Set(
    normalizeArray(options.excludeProgramIds).map(String)
  );
  const limit =
    Number.isInteger(options.limit) && options.limit > 0
      ? options.limit
      : normalizedPrograms.length;

  return normalizedPrograms
    .filter((program) => !excludeProgramIds.has(String(program.id)))
    .filter((program) => passesEligibility(studentProfile, program))
    .map((program) => ({
      ...program,
      ...scoreProgram(studentProfile, program),
    }))
    .filter((program) => program.score > 0)
    .sort(comparePrograms)
    .slice(0, limit);
}

module.exports = {
  recommendPrograms,
};
