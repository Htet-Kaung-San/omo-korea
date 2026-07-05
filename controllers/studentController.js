const supabase = require('../supabaseClient');
const jwt = require('jsonwebtoken');

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

    res.json({
      success: true,
      data,
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

    res.json({
      success: true,
      data,
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

    res.json({
      success: true,
      data,
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
};