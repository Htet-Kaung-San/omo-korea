const WEIGHTED_CATEGORIES = [
  { key: 'academicAreas', label: 'academic areas', weight: 30 },
  { key: 'activities', label: 'activities', weight: 15 },
  { key: 'strengths', label: 'strengths', weight: 20 },
  { key: 'careerAreas', label: 'career areas', weight: 20 },
  { key: 'learningStyles', label: 'learning styles', weight: 10 },
  { key: 'interests', label: 'interests', weight: 5 },
];

const DETAIL_CATEGORIES = [
  ...WEIGHTED_CATEGORIES,
  { key: 'languages', label: 'languages', weight: 0 },
];

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

function getMatches(studentValues, careerValues) {
  const studentSet = new Set(normalizeArray(studentValues).map(normalizeValue));

  return normalizeArray(careerValues).filter((value) =>
    studentSet.has(normalizeValue(value))
  );
}

function getMissingValues(studentValues, careerValues) {
  const studentSet = new Set(normalizeArray(studentValues).map(normalizeValue));

  return normalizeArray(careerValues).filter(
    (value) => !studentSet.has(normalizeValue(value))
  );
}

function scoreCategory(studentValues, careerValues, weight) {
  const targetValues = normalizeArray(careerValues);

  if (targetValues.length === 0) {
    return 0;
  }

  return (getMatches(studentValues, targetValues).length / targetValues.length) * weight;
}

function buildAreaDetails(studentProfile, career) {
  return DETAIL_CATEGORIES.reduce(
    (details, category) => {
      const matches = getMatches(
        studentProfile[category.key],
        career[category.key]
      );
      const missingValues = getMissingValues(
        studentProfile[category.key],
        career[category.key]
      );

      if (matches.length > 0) {
        details.matchedAreas[category.key] = matches;
      }

      if (missingValues.length > 0) {
        details.developmentAreas[category.key] = missingValues;
      }

      return details;
    },
    { matchedAreas: {}, developmentAreas: {} }
  );
}

function buildMatchHint(matchedAreas) {
  const matchingCategories = DETAIL_CATEGORIES.filter(
    (category) => normalizeArray(matchedAreas[category.key]).length > 0
  );

  if (matchingCategories.length === 0) {
    return 'No strong career alignment found yet';
  }

  const topCategoryHints = matchingCategories
    .slice(0, 3)
    .map((category) => {
      const examples = matchedAreas[category.key].slice(0, 2).join(', ');
      return `${category.label}: ${examples}`;
    });

  return `Matches ${topCategoryHints.join('; ')}`;
}

function scoreCareer(studentProfile, career) {
  const rawScore = WEIGHTED_CATEGORIES.reduce(
    (total, category) =>
      total +
      scoreCategory(
        studentProfile[category.key],
        career[category.key],
        category.weight
      ),
    0
  );
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const { matchedAreas, developmentAreas } = buildAreaDetails(
    studentProfile,
    career
  );

  return {
    score,
    matchHint: buildMatchHint(matchedAreas),
    matchedAreas,
    developmentAreas,
  };
}

function compareCareers(a, b) {
  if (b.score !== a.score) return b.score - a.score;

  return String(a.title || '').localeCompare(String(b.title || ''));
}

function recommendCareers(studentProfile = {}, careers = [], options = {}) {
  const normalizedCareers = normalizeArray(careers);
  const excludedCareerIds = new Set(
    normalizeArray(options.excludeCareerIds).map(String)
  );
  const limit =
    Number.isInteger(options.limit) && options.limit > 0
      ? options.limit
      : normalizedCareers.length;

  return normalizedCareers
    .filter((career) => !excludedCareerIds.has(String(career.id)))
    .map((career) => ({
      ...career,
      ...scoreCareer(studentProfile, career),
    }))
    .filter((career) => career.score > 0)
    .sort(compareCareers)
    .slice(0, limit);
}

module.exports = {
  recommendCareers,
};
