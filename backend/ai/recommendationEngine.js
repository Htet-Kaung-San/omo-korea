const DIMENSION_WEIGHTS = {
  academicAreas: 0.35,
  activities: 0.2,
  strengths: 0.2,
  careerAreas: 0.15,
  learningStyles: 0.1,
};

function normalizeScoreMap(input) {
  if (!input) return {};

  if (Array.isArray(input)) {
    return input.reduce((acc, value) => {
      const key = String(value || '').trim();
      if (key) acc[key] = 1;
      return acc;
    }, {});
  }

  if (typeof input === 'object') {
    return Object.entries(input).reduce((acc, [key, value]) => {
      const cleanKey = String(key || '').trim();
      const score = Number(value);
      if (cleanKey) acc[cleanKey] = Number.isFinite(score) ? score : 1;
      return acc;
    }, {});
  }

  const key = String(input || '').trim();
  return key ? { [key]: 1 } : {};
}

function calculateDimensionScore(userTags, departmentTags) {
  const userMap = normalizeScoreMap(userTags);
  const targetMap = normalizeScoreMap(departmentTags);

  const targetEntries = Object.entries(targetMap);
  if (targetEntries.length === 0) return 0;

  const totalWeight = targetEntries.reduce(
    (sum, [, weight]) => sum + Math.max(1, Number(weight) || 1),
    0,
  );

  if (totalWeight === 0) return 0;

  const earnedWeight = targetEntries.reduce((sum, [tag, weight]) => {
    return Object.prototype.hasOwnProperty.call(userMap, tag)
      ? sum + Math.max(1, Number(weight) || 1)
      : sum;
  }, 0);

  return Math.round((earnedWeight / totalWeight) * 100);
}

function buildReason(scores) {
  const matchedAreas = [];

  if (scores.academicAreas >= 70) matchedAreas.push('academic interests');
  if (scores.activities >= 70) matchedAreas.push('preferred activities');
  if (scores.strengths >= 70) matchedAreas.push('strengths');
  if (scores.careerAreas >= 70) matchedAreas.push('career goals');
  if (scores.learningStyles >= 70) matchedAreas.push('learning style');

  if (matchedAreas.length === 0) {
    return 'This major is suggested as a possible starting point. Add more profile details to improve accuracy.';
  }

  return `This major matches your ${matchedAreas.join(', ')}.`;
}

function buildSafeProfile(userProfile = {}) {
  return {
    academicAreas: [],
    activities: [],
    strengths: [],
    careerAreas: [],
    learningStyles: [],
    topikLevel: null,
    ...userProfile,
  };
}

function recommendMajors(userProfile = {}, departmentProfiles = [], topN = 3) {
  const safeUserProfile = buildSafeProfile(userProfile);
  const departments = Array.isArray(departmentProfiles) ? departmentProfiles : [];

  const results = departments.map((department) => {
    const tags = department.tags || {};

    const scores = {
      academicAreas: calculateDimensionScore(
        safeUserProfile.academicAreas,
        tags.academicAreas,
      ),
      activities: calculateDimensionScore(
        safeUserProfile.activities,
        tags.activities,
      ),
      strengths: calculateDimensionScore(
        safeUserProfile.strengths,
        tags.strengths,
      ),
      careerAreas: calculateDimensionScore(
        safeUserProfile.careerAreas,
        tags.careerAreas,
      ),
      learningStyles: calculateDimensionScore(
        safeUserProfile.learningStyles,
        tags.learningStyles,
      ),
    };

    const finalScore =
      scores.academicAreas * DIMENSION_WEIGHTS.academicAreas +
      scores.activities * DIMENSION_WEIGHTS.activities +
      scores.strengths * DIMENSION_WEIGHTS.strengths +
      scores.careerAreas * DIMENSION_WEIGHTS.careerAreas +
      scores.learningStyles * DIMENSION_WEIGHTS.learningStyles;

    return {
      id: department.id,
      name: department.name,
      nameKo: department.nameKo,
      minTopik: department.minTopik,
      score: Math.round(finalScore),
      scores,
      reason: buildReason(scores),
    };
  });

  return results
    .sort((a, b) => b.score - a.score || String(a.name || '').localeCompare(String(b.name || '')))
    .slice(0, Number(topN) || 3);
}

module.exports = {
  recommendMajors,
  calculateDimensionScore,
};
