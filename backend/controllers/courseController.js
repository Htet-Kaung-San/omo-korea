const supabase = require('../supabaseClient');
const { listCourseCatalog } = require('../services/courseCatalogService');
const {
  addTimetableEntry,
  deleteTimetableEntry,
  listTimetableEntries,
} = require('../services/timetableService');

function currentAcademicTerm(now = new Date()) {
  const month = now.getMonth() + 1;
  return {
    academicYear: now.getFullYear(),
    semester: month >= 7 ? '2' : '1',
  };
}

async function resolveStudentMajorId(studentId) {
  const { data, error } = await supabase
    .from('student')
    .select('major_id')
    .eq('student_id', Number(studentId))
    .single();
  if (error || !data) {
    const failure = new Error(error?.message || 'Student profile not found');
    failure.statusCode = error?.code === 'PGRST116' ? 404 : 502;
    failure.code = 'STUDENT_PROFILE_QUERY_FAILED';
    throw failure;
  }
  return data.major_id == null ? null : Number(data.major_id);
}

async function getCourseCatalog(req, res, next) {
  try {
    const term = currentAcademicTerm();
    const onlyMyMajor = String(req.query.myMajor || '').toLowerCase() === 'true';
    const majorId = onlyMyMajor
      ? await resolveStudentMajorId(req.user.student_id)
      : req.query.majorId;
    const data = await listCourseCatalog(supabase, {
      page: req.query.page,
      pageSize: req.query.pageSize,
      search: req.query.search,
      courseId: req.query.courseId,
      majorId,
      category: req.query.category,
      recommendedYear: req.query.recommendedYear,
      curriculumYear: req.query.curriculumYear,
      academicYear: req.query.academicYear || term.academicYear,
      semester: req.query.semester || term.semester,
      offeredOnly: String(req.query.offeredOnly || '').toLowerCase() === 'true',
      language: req.language || 'en',
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getTimetable(req, res, next) {
  try {
    const term = currentAcademicTerm();
    const data = await listTimetableEntries(supabase, req.user.student_id, {
      academicYear: req.query.academicYear || term.academicYear,
      semester: req.query.semester || term.semester,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function createTimetableEntry(req, res, next) {
  try {
    const data = await addTimetableEntry(supabase, req.user.student_id, req.body || {});
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function removeTimetableEntry(req, res, next) {
  try {
    const data = await deleteTimetableEntry(
      supabase,
      req.user.student_id,
      req.params.timetable_entry_id,
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTimetableEntry,
  currentAcademicTerm,
  getCourseCatalog,
  getTimetable,
  removeTimetableEntry,
};
