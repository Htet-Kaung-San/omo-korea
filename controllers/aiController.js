const supabase = require('../supabaseClient');
const departmentProfiles = require('../ai/departmentProfiles');
const { recommendMajors } = require('../ai/recommendationEngine');
const { buildStudentDashboard } = require('../ai/studentDashboardEngine');
const { analyzeMajorGap } = require('../ai/gapAnalysisEngine');
const { recommendCourses } = require('../ai/courseRecommendationEngine');
const { adaptStudentProfile } = require('../ai/studentProfileAdapter');
const { fetchNormalizedScholarships } = require('../ai/scholarshipRepository');
const { fetchNormalizedPrograms } = require('../ai/programRepository');
const {
  fetchNormalizedCoursesByMajor,
  fetchStudentCourseHistory,
} = require('../ai/courseRepository');
const {
  pilotCareers,
  pilotNotices,
  gapTargetMajors,
} = require('../ai/pilotCatalog');
const {
  createClaudeMajorAnalysis,
} = require('../services/claudeMajorRecommendationService');

async function fetchStudentContext(studentId) {
  const { data, error } = await supabase
    .from('student')
    .select(`
      *,
      major:major_id (
        major_name,
        department
      )
    `)
    .eq('student_id', studentId)
    .single();

  if (error || !data) {
    return null;
  }

  const questionnaire = data.questionnaire || {};

  return {
    majorId: data.major_id,
    rawStudentInput: {
      questionnaire: {
        academicAreas: questionnaire.academicAreas || [],
        activities: questionnaire.activities || [],
        strengths: questionnaire.strengths || [],
        careerAreas: questionnaire.careerAreas || [],
        learningStyles: questionnaire.learningStyles || [],
        topikLevel: questionnaire.topikLevel ?? data.topik_level ?? null,
        topN: questionnaire.topN ?? 3,
      },
      profile: {
        major: data.major?.major_name ?? null,
        interests: data.interests || [],
        languages: data.languages || [],
        academicAreas: data.academic_areas || [],
        activities: data.activities || [],
        strengths: data.strengths || [],
        careerAreas: data.career_areas || [],
        learningStyles: data.learning_styles || [],
        gpa: data.gpa ?? null,
        nationality: data.nationality ?? null,
        year: data.year ?? null,
        topikLevel: data.topik_level ?? questionnaire.topikLevel ?? null,
      },
      completedCourseIds: data.completed_course_ids || [],
    },
  };
}

function resolveTargetMajor(targetMajorId) {
  if (!targetMajorId) {
    return null;
  }

  return gapTargetMajors[targetMajorId] || null;
}

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

async function getDashboardSummary(req, res, next) {
  try {
    const studentId = req.user.student_id;
    const { targetMajorId } = req.query;

    const context = await fetchStudentContext(studentId);
    if (!context) {
      const err = new Error('Student profile not found');
      err.statusCode = 404;
      return next(err);
    }

    const targetMajor = resolveTargetMajor(targetMajorId);
    if (targetMajorId && !targetMajor) {
      return res.status(400).json({
        success: false,
        message: 'Invalid targetMajorId. Use a pilot department id such as artificial-intelligence.',
      });
    }

    const scholarships = await fetchNormalizedScholarships();
    const programs = await fetchNormalizedPrograms({ includeTitleTag: true });
    const courses = await fetchNormalizedCoursesByMajor(context.majorId);
    const courseHistory = await fetchStudentCourseHistory(studentId);

    const dashboard = buildStudentDashboard({
      rawStudentInput: context.rawStudentInput,
      targetMajor,
      majors: departmentProfiles,
      courses,
      programs,
      scholarships,
      careers: pilotCareers,
      notices: pilotNotices,
      options: {
        completedCourseIds: courseHistory.excludedCourseIds,
      },
    });

    return res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (err) {
    next(err);
  }
}

async function runMajorGapAnalysis(req, res, next) {
  try {
    const { targetMajorId } = req.body || {};

    if (!targetMajorId) {
      return res.status(400).json({
        success: false,
        message: 'targetMajorId is required.',
      });
    }

    const targetMajor = resolveTargetMajor(targetMajorId);
    if (!targetMajor) {
      return res.status(400).json({
        success: false,
        message: 'Invalid targetMajorId. Use a pilot department id such as artificial-intelligence.',
      });
    }

    const context = await fetchStudentContext(req.user.student_id);
    if (!context) {
      const err = new Error('Student profile not found');
      err.statusCode = 404;
      return next(err);
    }

    const adaptedProfile = adaptStudentProfile(context.rawStudentInput);
    const analysis = analyzeMajorGap(
      adaptedProfile.recommendationProfile,
      targetMajor
    );

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    next(err);
  }
}

async function getCourseRecommendations(req, res, next) {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? requestedLimit
        : 5;

    const context = await fetchStudentContext(req.user.student_id);
    if (!context) {
      const err = new Error('Student profile not found');
      err.statusCode = 404;
      return next(err);
    }

    const adaptedProfile = adaptStudentProfile(context.rawStudentInput);
    const courses = await fetchNormalizedCoursesByMajor(context.majorId);
    const courseHistory = await fetchStudentCourseHistory(req.user.student_id);
    const recommendations = recommendCourses(
      adaptedProfile.recommendationProfile,
      courses,
      {
        completedCourseIds: courseHistory.excludedCourseIds,
        limit,
      }
    );

    return res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  recommendMajor,
  getDashboardSummary,
  runMajorGapAnalysis,
  getCourseRecommendations,
};
