const CATEGORY_CONFIG = [
  {
    key: 'academicAreas',
    label: 'academicAreas',
    weight: 35,
    priority: 'high',
    suggestedAction: 'Build experience with the missing academic topics.',
  },
  {
    key: 'activities',
    label: 'activities',
    weight: 20,
    priority: 'medium',
    suggestedAction: 'Join activities that match this major more closely.',
  },
  {
    key: 'strengths',
    label: 'strengths',
    weight: 20,
    priority: 'medium',
    suggestedAction: 'Practice the missing strengths through projects or coursework.',
  },
  {
    key: 'careerAreas',
    label: 'careerAreas',
    weight: 15,
    priority: 'medium',
    suggestedAction: 'Explore career paths connected to the missing areas.',
  },
  {
    key: 'learningStyles',
    label: 'learningStyles',
    weight: 10,
    priority: 'medium',
    suggestedAction: 'Try learning formats used often in this major.',
  },
];

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

function compareCategory(studentValues, targetValues) {
  const studentSet = new Set(normalizeArray(studentValues).map(normalizeValue));
  const targetList = normalizeArray(targetValues);

  const matched = targetList.filter((value) =>
    studentSet.has(normalizeValue(value))
  );
  const missing = targetList.filter(
    (value) => !studentSet.has(normalizeValue(value))
  );

  return {
    matched,
    missing,
    coverage: targetList.length === 0 ? null : matched.length / targetList.length,
  };
}

function getTopikEligibility(studentProfile, targetMajor) {
  const currentLevel = Number(studentProfile.topikLevel);
  const requiredLevel = Number(targetMajor.minTopikLevel);
  const hasRequirement = Number.isFinite(requiredLevel);

  return {
    currentLevel: Number.isFinite(currentLevel) ? currentLevel : null,
    requiredLevel: hasRequirement ? requiredLevel : null,
    isMet: !hasRequirement || (Number.isFinite(currentLevel) && currentLevel >= requiredLevel),
  };
}

function analyzeMajorGap(studentProfile = {}, targetMajor = {}) {
  const matchedAreas = {};
  const gaps = [];
  let earnedWeight = 0;
  let availableWeight = 0;

  CATEGORY_CONFIG.forEach((category) => {
    const comparison = compareCategory(
      studentProfile[category.key],
      targetMajor[category.key]
    );

    matchedAreas[category.key] = comparison.matched;

    if (comparison.coverage !== null) {
      earnedWeight += comparison.coverage * category.weight;
      availableWeight += category.weight;
    }

    if (comparison.missing.length > 0) {
      gaps.push({
        category: category.label,
        missing: comparison.missing,
        priority: category.priority,
        suggestedAction: category.suggestedAction,
      });
    }
  });

  const topikEligibility = getTopikEligibility(studentProfile, targetMajor);

  if (!topikEligibility.isMet) {
    gaps.push({
      category: 'topikLevel',
      missing: [`TOPIK ${topikEligibility.requiredLevel}`],
      priority: 'high',
      suggestedAction: 'Improve Korean language preparation to meet the target requirement.',
    });
  }

  return {
    targetMajor: targetMajor.name || '',
    readinessScore:
      availableWeight === 0
        ? 0
        : Number(((earnedWeight / availableWeight) * 100).toFixed(1)),
    matchedAreas,
    gaps,
    topikEligibility,
  };
}

module.exports = {
  analyzeMajorGap,
};
