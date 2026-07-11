const supabase = require('../supabaseClient');
const { localizeRow } = require('../middleware/languageMiddleware');
const departmentProfiles = require('../ai/departmentProfiles');
const { recommendMajors } = require('../ai/recommendationEngine');
const { buildStudentDashboard } = require('../ai/studentDashboardEngine');
const { analyzeMajorGap } = require('../ai/gapAnalysisEngine');
const { recommendCourses } = require('../ai/courseRecommendationEngine');
const { adaptStudentProfile } = require('../ai/studentProfileAdapter');
const {
  pilotCourses,
  pilotPrograms,
  pilotScholarships,
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

    const dashboard = buildStudentDashboard({
      rawStudentInput: context.rawStudentInput,
      targetMajor,
      majors: departmentProfiles,
      courses: pilotCourses,
      programs: pilotPrograms,
      scholarships: pilotScholarships,
      careers: pilotCareers,
      notices: pilotNotices,
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
    const recommendations = recommendCourses(
      adaptedProfile.recommendationProfile,
      pilotCourses,
      {
        completedCourseIds: adaptedProfile.completedCourseIds,
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

function mapRecommendedScholarship(scholarship) {
  return {
    id: String(scholarship.id),
    title: scholarship.title,
    description: scholarship.description ?? '',
    deadline: scholarship.deadline ?? '',
    eligibility: scholarship.eligibility ?? scholarship.provider ?? '',
    amount: scholarship.amount ?? null,
    provider: scholarship.provider ?? null,
    score: scholarship.score,
    matchHint: scholarship.matchHint,
  };
}

function mapRecommendedProgram(program) {
  return {
    id: String(program.id),
    title: program.title,
    description: program.description ?? '',
    date: program.date ?? '',
    category: program.category ?? null,
    score: program.score,
    matchHint: program.matchHint,
  };
}

async function getAiDashboard(req, res, next) {
  try {
    const language = req.language || 'en';
    const context = await fetchStudentContext(req.user.student_id);
    if (!context) {
      const err = new Error('Student profile not found');
      err.statusCode = 404;
      return next(err);
    }

    const dashboard = buildStudentDashboard({
      rawStudentInput: context.rawStudentInput,
      targetMajor: null,
      majors: departmentProfiles,
      courses: pilotCourses,
      programs: pilotPrograms,
      scholarships: pilotScholarships,
      careers: pilotCareers,
      notices: pilotNotices,
      options: {
        courseLimit: 20,
        programLimit: 20,
        scholarshipLimit: 20,
      },
    });

    const { data: scholarshipRows } = await supabase.from('scholarship').select('*');
    const localizedScholarships = new Map(
      (scholarshipRows || []).map((row) => [
        String(row.scholarship_id ?? row.id),
        localizeRow(row, language, ['title', 'description', 'eligibility']),
      ]),
    );

    const eligibleScholarships = dashboard.recommendedScholarships
      .map(mapRecommendedScholarship)
      .map((item) => {
        const localized = localizedScholarships.get(item.id);
        if (!localized) return item;
        return {
          ...item,
          title: localized.title ?? item.title,
          description: localized.description ?? item.description,
          eligibility: localized.eligibility ?? item.eligibility,
        };
      });

    return res.status(200).json({
      success: true,
      data: {
        recommendedCourses: dashboard.recommendedCourses,
        eligibleScholarships,
        matchedPrograms: dashboard.recommendedPrograms.map(mapRecommendedProgram),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getStudentNotifications(req, res, next) {
  try {
    const language = req.language || 'en';
    const studentId = req.user.student_id;
    const context = await fetchStudentContext(studentId);

    if (!context) {
      const err = new Error('Student profile not found');
      err.statusCode = 404;
      return next(err);
    }

    const { data: checklistItems, error: checklistError } = await supabase
      .from('checklist_item')
      .select('*')
      .eq('student_id', studentId);

    if (checklistError) {
      checklistError.statusCode = 500;
      checklistError.message = 'Failed to fetch checklist notifications';
      return next(checklistError);
    }

    const checklistNotifications = (checklistItems || [])
      .filter((item) => String(item.status ?? '').toLowerCase() !== 'completed')
      .map((item) => {
        const localized = localizeRow(item, language, ['title', 'description']);
        return {
          id: `checklist-${item.checklist_id}`,
          title: localized.title ?? item.title ?? 'Checklist item',
          body: localized.description ?? item.description ?? '',
          date: item.due_date ?? item.updated_at ?? '',
          category: 'DEADLINE',
          priority: 'NORMAL',
        };
      });

    const dashboard = buildStudentDashboard({
      rawStudentInput: context.rawStudentInput,
      targetMajor: null,
      majors: departmentProfiles,
      courses: pilotCourses,
      programs: pilotPrograms,
      scholarships: pilotScholarships,
      careers: pilotCareers,
      notices: pilotNotices,
      options: {
        noticeLimit: 10,
      },
    });

    const noticeNotifications = (dashboard.recommendedNotices || []).map((notice) => ({
      id: notice.id,
      title: notice.title,
      body: notice.body,
      date: notice.deadline ?? '',
      category: notice.category,
      priority: notice.priority,
    }));

    const notifications = [...noticeNotifications, ...checklistNotifications].sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return (Number.isNaN(aTime) ? 0 : aTime) - (Number.isNaN(bTime) ? 0 : bTime);
    });

    return res.status(200).json({
      success: true,
      data: notifications,
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
  getAiDashboard,
  getStudentNotifications,
};
