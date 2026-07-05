const { recommendMajors } = require('./recommendationEngine');
const { analyzeMajorGap } = require('./gapAnalysisEngine');
const { recommendCourses } = require('./courseRecommendationEngine');
const { recommendPrograms } = require('./programRecommendationEngine');
const { recommendScholarships } = require('./scholarshipRecommendationEngine');
const { recommendCareers } = require('./careerRecommendationEngine');
const { adaptStudentProfile } = require('./studentProfileAdapter');

const { recommendNotices } = require('./noticeRecommendationEngine');
const DEFAULT_LIMIT = 3;
const MAX_ACTION_PRIORITIES = 5;

const PRIORITY_ORDER = {
  high: 0,
  medium: 1,
  low: 2,
};

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasOwnProperty(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function getLimit(options = {}) {
  return Number.isInteger(options.limit) && options.limit > 0
    ? options.limit
    : DEFAULT_LIMIT;
}

function getCategoryLimit(options = {}, key) {
  return Number.isInteger(options[key]) && options[key] > 0
    ? options[key]
    : getLimit(options);
}

function getMajorLimit(options = {}, adaptedProfile = null) {
  if (Number.isInteger(options.majorLimit) && options.majorLimit > 0) {
    return options.majorLimit;
  }

  const questionnaireTopN =
    adaptedProfile?.majorRecommendationProfile?.topN;

  if (Number.isInteger(questionnaireTopN) && questionnaireTopN > 0) {
    return questionnaireTopN;
  }

  return getLimit(options);
}

function buildRecommendationOptions(
  options = {},
  limitKey,
  excludeKey,
  fallbackExcludedIds = []
) {
  return {
    ...options,
    limit: getCategoryLimit(options, limitKey),
    [excludeKey]: hasOwnProperty(options, excludeKey)
      ? normalizeArray(options[excludeKey])
      : normalizeArray(fallbackExcludedIds),
  };
}

function buildActionPriorities(gapAnalysis) {
  if (!gapAnalysis || !Array.isArray(gapAnalysis.gaps)) {
    return [];
  }

  return gapAnalysis.gaps
    .filter((gap) => gap.priority === 'high' || gap.priority === 'medium')
    .map((gap, index) => ({ ...gap, originalIndex: index }))
    .sort((a, b) => {
      const priorityDifference =
        (PRIORITY_ORDER[a.priority] ?? 99) -
        (PRIORITY_ORDER[b.priority] ?? 99);

      return priorityDifference || a.originalIndex - b.originalIndex;
    })
    .map((gap) => ({
      priority: gap.priority,
      category: gap.category,
      action: gap.suggestedAction || `Improve preparation for ${gap.category}.`,
      reason: `Missing ${gap.category}: ${normalizeArray(gap.missing).join(', ')}`,
    }))
    .slice(0, MAX_ACTION_PRIORITIES);
}

function buildStudentDashboard(input = {}) {
  const options = input.options || {};
  const majors = normalizeArray(input.majors || input.departmentProfiles);
  const targetMajor = input.targetMajor || null;

  const hasRawStudentInput =
    input.rawStudentInput &&
    typeof input.rawStudentInput === 'object' &&
    !Array.isArray(input.rawStudentInput);

  const adaptedProfile = hasRawStudentInput
    ? adaptStudentProfile(input.rawStudentInput)
    : null;

  const majorRecommendationProfile = adaptedProfile
    ? adaptedProfile.majorRecommendationProfile
    : input.studentProfile || {};

  const recommendationProfile = adaptedProfile
    ? adaptedProfile.recommendationProfile
    : input.studentProfile || {};

  const completedCourseIds = adaptedProfile
    ? adaptedProfile.completedCourseIds
    : [];

  const targetMajorGap = targetMajor
    ? analyzeMajorGap(recommendationProfile, targetMajor)
    : null;

  return {
    topMajors:
      majors.length > 0
        ? recommendMajors(
            majorRecommendationProfile,
            majors,
            getMajorLimit(options, adaptedProfile)
          )
        : [],

    targetMajorGap,

    recommendedCourses: recommendCourses(
      recommendationProfile,
      normalizeArray(input.courses),
      buildRecommendationOptions(
        options,
        'courseLimit',
        'completedCourseIds',
        completedCourseIds
      )
    ),

    recommendedPrograms: recommendPrograms(
      recommendationProfile,
      normalizeArray(input.programs),
      buildRecommendationOptions(options, 'programLimit', 'excludeProgramIds')
    ),

    recommendedScholarships: recommendScholarships(
      recommendationProfile,
      normalizeArray(input.scholarships),
      buildRecommendationOptions(
        options,
        'scholarshipLimit',
        'excludeScholarshipIds'
      )
    ),

    recommendedNotices: recommendNotices(
  recommendationProfile,
  normalizeArray(input.notices),
  buildRecommendationOptions(options, 'noticeLimit', 'excludeNoticeIds')
),

    recommendedCareers: recommendCareers(
      recommendationProfile,
      normalizeArray(input.careers),
      buildRecommendationOptions(options, 'careerLimit', 'excludeCareerIds')
    ),

    actionPriorities: buildActionPriorities(targetMajorGap),
  };
}

module.exports = {
  buildStudentDashboard,
};