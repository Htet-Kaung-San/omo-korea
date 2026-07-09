const supabase = require('../supabaseClient');
const { normalizeCourseRow } = require('./courseDataAdapter');

async function fetchNormalizedCoursesByMajor(majorId, options = {}) {
  if (!majorId) {
    return [];
  }

  const { data, error } = await supabase
    .from('course')
    .select('course_id, course_name, credit, major_id, category, major:major_id(major_name)')
    .eq('major_id', majorId)
    .order('course_id', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || [])
    .map((row) => normalizeCourseRow(row, { ...options, includeCategoryTag: true }))
    .filter(Boolean);
}

async function fetchStudentCourseHistory(studentId) {
  const emptyHistory = {
    completedCourseIds: [],
    enrolledCourseIds: [],
    excludedCourseIds: [],
  };

  if (!studentId) {
    return emptyHistory;
  }

  const { data, error } = await supabase
    .from('enrollment')
    .select('course_id, status, semester')
    .eq('student_id', studentId);

  if (error) {
    throw error;
  }

  const completedCourseIds = [];
  const enrolledCourseIds = [];

  (data || []).forEach((row) => {
    const status = String(row.status || '').toLowerCase();

    if (status.includes('completed')) {
      completedCourseIds.push(row.course_id);
    }

    if (
      status.includes('enrolled') ||
      status.includes('in_progress') ||
      status.includes('in progress')
    ) {
      enrolledCourseIds.push(row.course_id);
    }
  });

  return {
    completedCourseIds,
    enrolledCourseIds,
    excludedCourseIds: Array.from(new Set([...completedCourseIds, ...enrolledCourseIds])),
  };
}

module.exports = {
  fetchNormalizedCoursesByMajor,
  fetchStudentCourseHistory,
};
