const DIMENSION_WEIGHTS = {
  academicAreas: 0.35,
  activities: 0.2,
  strengths: 0.2,
  careerAreas: 0.15,
  learningStyles: 0.1,
};

function calculateDimensionScore(selectedOptions = [], departmentTags = {}) {
  const selectedSet = new Set(selectedOptions);
  const totalWeight = Object.values(departmentTags).reduce(
    (sum, weight) => sum + weight,
    0,
  );

  if (totalWeight === 0) {
    return 0;
  }

  const matchedWeight = Object.entries(departmentTags).reduce(
    (sum, [optionId, weight]) =>
      selectedSet.has(optionId) ? sum + weight : sum,
    0,
  );

  return Number(((matchedWeight / totalWeight) * 100).toFixed(1));
}

function getEligibilityNote(department, topikLevel) {
  if (!topikLevel) {
    return `Verify Korean-language requirement. Standard requirement: TOPIK ${department.minTopik}.`;
  }

  if (topikLevel >= department.minTopik) {
    return `Korean requirement appears met: TOPIK ${department.minTopik} or above.`;
  }

  return `Korean requirement may not be met: this department normally requires TOPIK ${department.minTopik} or above.`;
}

function buildReason(scores) {
  const matchedAreas = [];

  if (scores.academicAreas >= 70) matchedAreas.push("academic interests");
  if (scores.activities >= 70) matchedAreas.push("preferred activities");
  if (scores.strengths >= 70) matchedAreas.push("strengths");
  if (scores.careerAreas >= 70) matchedAreas.push("career goals");
  if (scores.learningStyles >= 70) matchedAreas.push("learning style");

  if (matchedAreas.length === 0) {
    return "This department has a partial match with your current questionnaire answers.";
  }

  return `Strong match based on ${matchedAreas.join(", ")}.`;
}

function recommendMajors(userProfile, departmentProfiles, topN = 3) {
  const results = departmentProfiles.map((department) => {
    const scores = {
      academicAreas: calculateDimensionScore(
        userProfile.academicAreas,
        department.tags.academicAreas,
      ),
      activities: calculateDimensionScore(
        userProfile.activities,
        department.tags.activities,
      ),
      strengths: calculateDimensionScore(
        userProfile.strengths,
        department.tags.strengths,
      ),
      careerAreas: calculateDimensionScore(
        userProfile.careerAreas,
        department.tags.careerAreas,
      ),
      learningStyles: calculateDimensionScore(
        userProfile.learningStyles,
        department.tags.learningStyles,
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
      score: Number(finalScore.toFixed(1)),
      categoryScores: scores,
      reason: buildReason(scores),
      eligibilityNote: getEligibilityNote(department, userProfile.topikLevel),
    };
  });

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((result, index) => ({
      ...result,
      rank: index + 1,
    }));
}

module.exports = {
  recommendMajors,
};
