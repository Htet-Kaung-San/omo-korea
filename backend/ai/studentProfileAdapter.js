function normalizeQuestionnaireArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();
  const normalized = [];

  value.forEach((item) => {
    const text = String(item || '').trim().toUpperCase();

    if (text && !seen.has(text)) {
      seen.add(text);
      normalized.push(text);
    }
  });

  return normalized;
}

function normalizeReadableArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();
  const normalized = [];

  value.forEach((item) => {
    const text = String(item || '').trim();
    const key = text.toLowerCase();

    if (text && !seen.has(key)) {
      seen.add(key);
      normalized.push(text);
    }
  });

  return normalized;
}

function normalizeString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const text = value.trim();
  return text || null;
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeTopN(value) {
  const number = normalizeNumber(value);

  if (Number.isInteger(number) && number > 0) {
    return number;
  }

  return 3;
}

function normalizeCompletedCourseIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();
  const normalized = [];

  value.forEach((item) => {
    const text = String(item || '').trim();

    if (text && !seen.has(text)) {
      seen.add(text);
      normalized.push(text);
    }
  });

  return normalized;
}

function adaptStudentProfile(rawInput = {}) {
  const questionnaire = rawInput.questionnaire || {};
  const profile = rawInput.profile || {};

  const questionnaireTopikLevel = normalizeNumber(questionnaire.topikLevel);
  const profileTopikLevel = normalizeNumber(profile.topikLevel);
  const topikLevel = questionnaireTopikLevel ?? profileTopikLevel;

  return {
    majorRecommendationProfile: {
      academicAreas: normalizeQuestionnaireArray(questionnaire.academicAreas),
      activities: normalizeQuestionnaireArray(questionnaire.activities),
      strengths: normalizeQuestionnaireArray(questionnaire.strengths),
      careerAreas: normalizeQuestionnaireArray(questionnaire.careerAreas),
      learningStyles: normalizeQuestionnaireArray(questionnaire.learningStyles),
      topikLevel,
      topN: normalizeTopN(questionnaire.topN),
    },
    recommendationProfile: {
      major: normalizeString(profile.major),
      interests: normalizeReadableArray(profile.interests),
      languages: normalizeReadableArray(profile.languages),
      gpa: normalizeNumber(profile.gpa),
      nationality: normalizeString(profile.nationality),
      year: normalizeNumber(profile.year),
      academicAreas: normalizeReadableArray(profile.academicAreas),
      activities: normalizeReadableArray(profile.activities),
      strengths: normalizeReadableArray(profile.strengths),
      careerAreas: normalizeReadableArray(profile.careerAreas),
      learningStyles: normalizeReadableArray(profile.learningStyles),
      topikLevel,
    },
    completedCourseIds: normalizeCompletedCourseIds(rawInput.completedCourseIds),
  };
}
module.exports = {
  adaptStudentProfile,
};
