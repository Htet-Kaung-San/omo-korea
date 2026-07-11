const supabase = require('../supabaseClient');
const jwt = require('jsonwebtoken');
const {
  getCareerOpportunitiesPage,
} = require('../services/jobKoreaScraperService');
const { getEmergencyGuide } = require('../services/emergencyGuideService');
const { getCampusFacilities } = require('../services/campusFacilitiesService');
const { localizeRow } = require('../middleware/languageMiddleware');

function formatScholarshipDeadline(deadline) {
  if (!deadline) {
    return '';
  }

  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) {
    return String(deadline);
  }

  const days = Math.ceil((parsed.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days >= 0) {
    return `D-${days}`;
  }

  return parsed.toISOString().slice(0, 10);
}

function mapScholarshipRow(row, language = 'en') {
  const localized = localizeRow(row, language, ['title', 'description', 'eligibility']);

  return {
    id: String(row.scholarship_id ?? row.id),
    title: localized.title ?? 'Scholarship',
    description: localized.description ?? '',
    deadline: formatScholarshipDeadline(row.deadline),
    eligibility: localized.eligibility ?? row.provider ?? '',
    amount: row.amount ?? null,
    provider: row.provider ?? null,
  };
}

const testConnection = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('major').select('*').limit(1);

    if (error) {
      error.statusCode = 500;
      error.message = 'Failed to query MAJOR table';
      return next(error);
    }

    res.json({
      success: true,
      message: 'Database connection successful',
      count: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const loginStudent = async (req, res, next) => {
  try {
    const { student_id } = req.body;

    const { data, error } = await supabase
      .from('student')
      .select(`
        *,
        major:major_id (
          major_name,
          department
        )
      `)
      .eq('student_id', student_id)
      .single();

    if (error || !data) {
      if (error?.code === 'PGRST116' || !data) {
        const customErr = new Error('Student ID not registered');
        customErr.statusCode = 404;
        return next(customErr);
      }

      error.statusCode = 500;
      error.message = 'Failed to fetch student profile';
      return next(error);
    }

    const { major, ...studentProfile } = data;

    const token = jwt.sign(
      { student_id: studentProfile.student_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return res.status(200).json({
      success: true,
      token,
      data: {
        ...studentProfile,
        major_name: major?.major_name ?? null,
        department: major?.department ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getStudentChecklist = async (req, res, next) => {
  try {
    const { student_id } = req.params;

    const { data, error } = await supabase
      .from('checklist_item')
      .select('*')
      .eq('student_id', student_id);

    if (error) {
      error.statusCode = 500;
      error.message = 'Failed to fetch checklist';
      return next(error);
    }

    const language = req.language || 'en';

    res.json({
      success: true,
      data: (data || []).map((row) => {
        const localized = localizeRow(row, language, ['title', 'description']);
        return {
          ...row,
          title: localized.title ?? row.title,
          description: localized.description ?? row.description,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
};

const updateChecklistItem = async (req, res, next) => {
  try {
    const { checklist_id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('checklist_item')
      .update({ status })
      .eq('checklist_id', checklist_id)
      .select()
      .single();

    if (error || !data) {
      if (error?.code === 'PGRST116' || !data) {
        const customErr = new Error('Checklist item not found');
        customErr.statusCode = 404;
        return next(customErr);
      }

      error.statusCode = 500;
      error.message = 'Failed to update checklist item';
      return next(error);
    }

    const language = req.language || 'en';
    const localized = localizeRow(data, language, ['title', 'description']);

    res.json({
      success: true,
      data: {
        ...data,
        title: localized.title ?? data.title,
        description: localized.description ?? data.description,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getAllScholarships = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('scholarship')
      .select('*')
      .order('deadline', { ascending: true });

    if (error) {
      error.statusCode = 500;
      error.message = 'Failed to fetch scholarships';
      return next(error);
    }

    const language = req.language || 'en';

    res.json({
      success: true,
      data: (data || []).map((row) => mapScholarshipRow(row, language)),
    });
  } catch (err) {
    next(err);
  }
};

const applyForScholarship = async (req, res, next) => {
  try {
    const { student_id, scholarship_id } = req.body;

    const { data, error } = await supabase
      .from('scholarship_application')
      .insert({
        student_id,
        scholarship_id,
        status: 'Pending',
      })
      .select()
      .single();

    if (error) {
      error.statusCode = 500;
      error.message = 'Failed to submit scholarship application';
      return next(error);
    }

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getBoardPosts = async (req, res, next) => {
  try {
    const { board_id } = req.params;

    const { data, error } = await supabase
      .from('post')
      .select(`
        *,
        student:student_id (
          name,
          nationality
        )
      `)
      .eq('board_id', board_id)
      .order('created_at', { ascending: false });

    if (error) {
      error.statusCode = 500;
      error.message = 'Failed to fetch board posts';
      return next(error);
    }

    const posts = data.map(({ student, ...post }) => ({
      ...post,
      name: student?.name ?? null,
      nationality: student?.nationality ?? null,
    }));

    res.json({
      success: true,
      data: posts,
    });
  } catch (err) {
    next(err);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { board_id, student_id, title, content } = req.body;

    const { data, error } = await supabase
      .from('post')
      .insert({
        board_id,
        student_id,
        title,
        content,
      })
      .select()
      .single();

    if (error) {
      error.statusCode = 500;
      error.message = 'Failed to create post';
      return next(error);
    }

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getPostComments = async (req, res, next) => {
  try {
    const { post_id } = req.params;

    const { data, error } = await supabase
      .from('comment')
      .select(`
        *,
        student:student_id (
          name,
          nationality
        )
      `)
      .eq('post_id', post_id)
      .order('created_at', { ascending: true });

    if (error) {
      error.statusCode = 500;
      error.message = 'Failed to fetch post comments';
      return next(error);
    }

    const comments = data.map(({ student, ...comment }) => ({
      ...comment,
      name: student?.name ?? null,
      nationality: student?.nationality ?? null,
    }));

    res.json({
      success: true,
      data: comments,
    });
  } catch (err) {
    next(err);
  }
};

const createComment = async (req, res, next) => {
  try {
    const { post_id } = req.params;
    const { student_id, content } = req.body;

    const { data, error } = await supabase
      .from('comment')
      .insert({
        post_id,
        student_id,
        content,
      })
      .select()
      .single();

    if (error) {
      error.statusCode = 500;
      error.message = 'Failed to create comment';
      return next(error);
    }

    res.status(201).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getEmergencyGuideHandler = async (req, res, next) => {
  try {
    const data = await getEmergencyGuide(req.language || 'en');

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

const getCampusFacilitiesHandler = async (req, res, next) => {
  try {
    const menuDate = typeof req.query.menu_date === 'string' ? req.query.menu_date : '';
    const data = await getCampusFacilities(req.language || 'en', { menuDate });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

const updateStudentProfile = async (req, res, next) => {
  try {
    const studentId = req.user.student_id;
    const {
      name,
      nationality,
      interests,
      language_pref,
      visa_status,
      mbti,
      phone,
    } = req.body;

    const updates = {};

    if (name !== undefined) updates.name = name;
    if (nationality !== undefined) updates.nationality = nationality;
    if (interests !== undefined) updates.interests = interests;
    if (language_pref !== undefined) updates.language_pref = language_pref;
    if (visa_status !== undefined) updates.visa_status = visa_status;
    if (mbti !== undefined) updates.mbti = mbti;
    if (phone !== undefined) updates.phone = phone;

    const { data, error } = await supabase
      .from('student')
      .update(updates)
      .eq('student_id', studentId)
      .select(`
        *,
        major:major_id (
          major_name,
          department
        )
      `)
      .single();

    if (error || !data) {
      if (error?.code === 'PGRST116' || !data) {
        const customErr = new Error('Student profile not found');
        customErr.statusCode = 404;
        return next(customErr);
      }

      error.statusCode = 500;
      error.message = 'Failed to update student profile';
      return next(error);
    }

    const { major, ...studentProfile } = data;

    return res.status(200).json({
      success: true,
      data: {
        ...studentProfile,
        major_name: major?.major_name ?? null,
        department: major?.department ?? null,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const getCareerOpportunities = async (req, res, next) => {
  try {
    const requestedPage = Number(req.query.page);
    const requestedLimit = Number(req.query.limit);

    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 50)
        : 10;

    const data = await getCareerOpportunitiesPage({ page, limit });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  testConnection,
  loginStudent,
  getStudentChecklist,
  updateChecklistItem,
  getAllScholarships,
  applyForScholarship,
  getBoardPosts,
  createPost,
  getPostComments,
  createComment,
  getCareerOpportunities,
  getEmergencyGuideHandler,
  getCampusFacilitiesHandler,
  updateStudentProfile,
};