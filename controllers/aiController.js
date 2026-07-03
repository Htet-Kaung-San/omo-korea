const departmentProfiles = require('../ai/departmentProfiles');
const { recommendMajors } = require('../ai/recommendationEngine');
const {
createClaudeMajorAnalysis,
} = require('../services/claudeMajorRecommendationService');

async function recommendMajor(req, res) {
try {
const {
academicAreas = [],
activities = [],
strengths = [],
careerAreas = [],
learningStyles = [],
topikLevel,
topN = 3,
} = req.body || {};

const userProfile = {
  academicAreas,
  activities,
  strengths,
  careerAreas,
  learningStyles,
  topikLevel,
};

const requestedTopN = Number(topN);
const safeTopN =
  Number.isInteger(requestedTopN) && requestedTopN > 0
    ? requestedTopN
    : 3;

const ruleBasedRecommendations = recommendMajors(
  userProfile,
  departmentProfiles,
  safeTopN
);

const claudeResult = await createClaudeMajorAnalysis(
  userProfile,
  ruleBasedRecommendations
);

const claudeReasons = new Map(
  (claudeResult.analysis?.recommendations || [])
    .filter((item) => item?.id && item?.claudeReason)
    .map((item) => [item.id, item.claudeReason])
);

const recommendations = ruleBasedRecommendations.map(
  (recommendation) => ({
    ...recommendation,
    claudeReason: claudeReasons.get(recommendation.id) || null,
  })
);

return res.status(200).json({
  success: true,
  recommendationMethod: claudeResult.enabled
    ? 'rule-based + claude'
    : 'rule-based',
  recommendations,
  aiAnalysis: claudeResult.analysis,
  warning: claudeResult.warning,
});

} catch (error) {
console.error('Major recommendation error:', error);

return res.status(500).json({
  success: false,
  message: 'Unable to generate major recommendations.',
});

}
}

module.exports = {
recommendMajor,
};
