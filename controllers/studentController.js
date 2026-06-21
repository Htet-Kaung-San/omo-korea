const supabase = require('../supabaseClient');

const testConnection = async (req, res) => {
  try {
    const { data, error } = await supabase.from('major').select('*').limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to query MAJOR table',
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: 'Database connection successful',
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Unexpected server error',
      error: err.message,
    });
  }
};

const loginStudent = async (req, res) => {
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
        return res.status(404).json({
          success: false,
          message: 'Student ID not registered',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch student profile',
        error: error.message,
      });
    }

    const { major, ...studentProfile } = data;

    res.json({
      success: true,
      data: {
        ...studentProfile,
        major_name: major?.major_name ?? null,
        department: major?.department ?? null,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Unexpected server error',
      error: err.message,
    });
  }
};

const getStudentChecklist = async (req, res) => {
  try {
    const { student_id } = req.params;

    const { data, error } = await supabase
      .from('checklist_item')
      .select('*')
      .eq('student_id', student_id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch checklist',
        error: error.message,
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Unexpected server error',
      error: err.message,
    });
  }
};

const updateChecklistItem = async (req, res) => {
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
        return res.status(404).json({
          success: false,
          message: 'Checklist item not found',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to update checklist item',
        error: error.message,
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Unexpected server error',
      error: err.message,
    });
  }
};

const getAllScholarships = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scholarship')
      .select('*')
      .order('deadline', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch scholarships',
        error: error.message,
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Unexpected server error',
      error: err.message,
    });
  }
};

const applyForScholarship = async (req, res) => {
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
      return res.status(500).json({
        success: false,
        message: 'Failed to submit scholarship application',
        error: error.message,
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Unexpected server error',
      error: err.message,
    });
  }
};

module.exports = {
  testConnection,
  loginStudent,
  getStudentChecklist,
  updateChecklistItem,
  getAllScholarships,
  applyForScholarship,
};
