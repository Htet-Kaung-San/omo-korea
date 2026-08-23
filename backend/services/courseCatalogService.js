const {
  attachCourseCurriculum,
  fetchAllCourses,
  fetchCourseCurriculum,
  fetchCourseMetadata,
  fetchCourseOfferings,
} = require('../ai/supabaseDataRepository');
const { parseOfferingSchedule } = require('./timetableService');

function normalizeText(value) {
  return String(value || '').normalize('NFKC').trim().toLowerCase();
}

function positiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

function mapRestriction(row) {
  return {
    id: Number(row.course_offering_restriction_id),
    kind: row.source_kind,
    ruleType: row.source_rule_type || null,
    permission: row.permission || null,
    departmentCondition: row.department_condition || null,
    yearLevelCondition: row.year_level_condition || null,
    domesticForeignCondition: row.domestic_foreign_condition || null,
    nationalityCondition: row.nationality_condition || null,
    curriculumYearCondition: row.curriculum_year_condition || null,
    completedSemestersCondition: row.completed_semesters_condition || null,
    academicStatusCondition: row.academic_status_condition || null,
    degreeProgramCondition: row.degree_program_condition || null,
    reason: row.reason || null,
    exceptionText: row.exception_text || null,
  };
}

function mapOffering(row, metadata = null, restrictions = []) {
  return {
    courseOfferingId: Number(row.course_offering_id),
    officialCourseNumber: row.official_course_number || null,
    academicYear: Number(row.academic_year),
    semester: String(row.semester),
    section: row.section || null,
    professor: row.professor || null,
    schedule: row.schedule || null,
    classroom: row.classroom || null,
    teachingLanguage: row.teaching_language || null,
    remoteCourseStatus: row.remote_course_status || null,
    enrollmentLimit: row.enrollment_limit == null ? null : Number(row.enrollment_limit),
    teamTeachingStatus: row.team_teaching_status || null,
    generalEducationArea: row.general_education_area || null,
    remarks: row.remarks || null,
    restrictions: restrictions.map(mapRestriction),
    slots: parseOfferingSchedule(row.schedule, row.classroom),
    presentationRequirement: metadata?.presentation_requirement || null,
    groupProjectRequirement: metadata?.group_project_requirement || null,
    assignmentRequirement: metadata?.assignment_requirement || null,
    examInformation: metadata?.exam_information || null,
  };
}

function isMissingOptionalRelation(error) {
  return ['PGRST205', '42P01', '42703'].includes(error?.code)
    || /could not find|does not exist|schema cache/i.test(error?.message || '');
}

async function fetchOfferingRestrictions(supabase, offeringIds) {
  if (!offeringIds.length) return [];
  const { data, error } = await supabase
    .from('course_offering_restriction')
    .select(`
      course_offering_restriction_id,course_offering_id,source_kind,
      source_rule_type,permission,department_condition,year_level_condition,
      domestic_foreign_condition,nationality_condition,curriculum_year_condition,
      completed_semesters_condition,academic_status_condition,
      degree_program_condition,reason,exception_text
    `)
    .in('course_offering_id', offeringIds)
    .order('course_offering_restriction_id', { ascending: true });
  if (error) {
    if (isMissingOptionalRelation(error)) return [];
    const failure = new Error(`Failed to fetch course restrictions: ${error.message}`);
    failure.statusCode = 502;
    failure.code = 'SUPABASE_COURSE_RESTRICTION_QUERY_FAILED';
    throw failure;
  }
  return data || [];
}

async function fetchCourseSourceDetails(supabase, courseIds) {
  if (!courseIds.length) return { details: [], prerequisites: [] };
  const [detailResult, prerequisiteResult] = await Promise.all([
    supabase
      .from('course_source_detail')
      .select('course_id,description_ko,description_en,source_url,syllabus_url,source_kind,retrieved_at')
      .in('course_id', courseIds),
    supabase
      .from('course_prerequisite')
      .select(`
        course_prerequisite_id,course_id,prerequisite_course_id,
        requirement_text,source_url,source_kind,
        prerequisite:prerequisite_course_id(course_id,course_name,course_name_en,official_course_number)
      `)
      .in('course_id', courseIds)
      .order('course_prerequisite_id', { ascending: true }),
  ]);
  const nonOptionalError = [detailResult.error, prerequisiteResult.error]
    .find((error) => error && !isMissingOptionalRelation(error));
  if (nonOptionalError) {
    const failure = new Error(`Failed to fetch sourced course details: ${nonOptionalError.message}`);
    failure.statusCode = 502;
    failure.code = 'SUPABASE_COURSE_DETAIL_QUERY_FAILED';
    throw failure;
  }
  return {
    details: detailResult.error ? [] : (detailResult.data || []),
    prerequisites: prerequisiteResult.error ? [] : (prerequisiteResult.data || []),
  };
}

async function fetchMajors(supabase) {
  const { data, error } = await supabase
    .from('major')
    .select('major_id,major_name,department,college_id')
    .order('major_id', { ascending: true });
  if (error) {
    const failure = new Error(`Failed to fetch majors: ${error.message}`);
    failure.statusCode = 502;
    failure.code = 'SUPABASE_MAJOR_QUERY_FAILED';
    throw failure;
  }
  return data || [];
}

function filterCourses(courses, filters) {
  const search = normalizeText(filters.search);
  const category = String(filters.category || '').toUpperCase();
  const majorIds = Array.isArray(filters.majorId)
    ? filters.majorId.map(id => String(id))
    : (filters.majorId == null || filters.majorId === '' ? null : [String(filters.majorId)]);
  const recommendedYear = Number(filters.recommendedYear);
  const curriculumYear = Number(filters.curriculumYear);
  const courseId = filters.courseId == null || filters.courseId === ''
    ? null
    : String(filters.courseId);
  return courses.filter((course) => {
    if (courseId && String(course.id) !== courseId) return false;
    if (majorIds) {
      const courseMajors = course.majorIds || (course.majorId ? [String(course.majorId)] : []);
      if (!courseMajors.some(id => majorIds.includes(String(id)))) return false;
    }
    if (category && category !== 'ALL') {
      const type = String(course.type).toUpperCase();
      if (category === '전공') {
        if (!['전공기초', '전공필수', '전공선택'].includes(type)) return false;
      } else if (type !== category) {
        return false;
      }
    }
    if (Number.isInteger(recommendedYear) && Number(course.year) !== recommendedYear) return false;
    if (Number.isInteger(curriculumYear)
      && !course.curriculumYears.includes(curriculumYear)) return false;
    if (!search) return true;
    return [
      course.nameKo,
      course.nameEn,
      course.title,
      course.officialCourseNumber,
      course.curriculum?.sourceCourseCode,
      course.department,
    ].some((value) => normalizeText(value).includes(search));
  });
}

function filterCoursesByOffering(courses, offeringRows, offeredOnly) {
  if (!offeredOnly) return courses;
  const offeredCourseIds = new Set(
    (offeringRows || []).map((row) => String(row.course_id)),
  );
  return courses.filter((course) => offeredCourseIds.has(String(course.id)));
}

async function listCourseCatalog(supabase, options = {}) {
  const page = positiveInteger(options.page, 1);
  const pageSize = positiveInteger(options.pageSize, 50, 100);
  const preferredCurriculumYear = Number(options.curriculumYear);
  const [baseCourses, curriculumRows, majors] = await Promise.all([
    fetchAllCourses(supabase, {
      language: options.language || 'en',
      courseId: options.courseId,
    }),
    fetchCourseCurriculum(supabase, {
      majorId: options.majorId == null || options.majorId === '' ? undefined : options.majorId,
    }),
    fetchMajors(supabase),
  ]);
  const majorById = new Map(majors.map((major) => [String(major.major_id), major]));
  const majorIdsByName = new Map();
  for (const course of baseCourses) {
    if (course.majorId == null) continue;
    const key = normalizeText(course.raw?.course_name || course.nameEn || course.nameKo);
    if (!majorIdsByName.has(key)) majorIdsByName.set(key, new Set());
    majorIdsByName.get(key).add(String(course.majorId));
  }

  const majorIdsByCourseId = new Map();
  for (const row of curriculumRows || []) {
    if (row.major_id == null) continue;
    const courseId = String(row.course_id);
    if (!majorIdsByCourseId.has(courseId)) majorIdsByCourseId.set(courseId, new Set());
    majorIdsByCourseId.get(courseId).add(String(row.major_id));
  }

  let courses = attachCourseCurriculum(baseCourses, curriculumRows, {
    curriculumYear: Number.isInteger(preferredCurriculumYear)
      ? preferredCurriculumYear
      : undefined,
  }).map((course) => {
    const nameKey = normalizeText(course.raw?.course_name || course.nameEn || course.nameKo);
    const matchingMajorIds = [...(majorIdsByName.get(nameKey) || [])];
    const curriculumMajors = majorIdsByCourseId.get(String(course.id));
    
    const allMajorIds = new Set();
    if (course.majorId) allMajorIds.add(String(course.majorId));
    if (curriculumMajors) curriculumMajors.forEach(id => allMajorIds.add(id));
    matchingMajorIds.forEach(id => allMajorIds.add(id));

    const resolvedMajorId = course.majorId ?? (curriculumMajors && curriculumMajors.size > 0 ? Array.from(curriculumMajors)[0] : (matchingMajorIds.length === 1 ? matchingMajorIds[0] : null));
    const major = majorById.get(String(resolvedMajorId));
    return {
      ...course,
      majorId: resolvedMajorId,
      majorIds: Array.from(allMajorIds),
      majorName: major?.major_name || course.department || '',
      department: major?.department || course.department || major?.major_name || '',
      collegeId: major?.college_id == null ? null : Number(major.college_id),
      offerings: [],
      score: 0,
      matchHint: null,
    };
  });

  courses = filterCourses(courses, options);
  // We no longer filter by course_offering rows because the sections are in the course table directly.

  // Map course fields directly onto the object instead of grouping into offerings
  courses = courses.map(course => {
    return {
      ...course,
      courseOfferingId: course.id,
      officialCourseNumber: course.courseCode,
      academicYear: options.academicYear || 2026,
      semester: options.semester || '2',
      schedule: course.dayOfWeek && course.startTime ? `${course.dayOfWeek} ${course.startTime}-${course.endTime}` : null,
      classroom: course.location,
      enrollmentLimit: null,
      restrictions: [],
      slots: parseOfferingSchedule(course.dayOfWeek && course.startTime ? `${course.dayOfWeek} ${course.startTime}-${course.endTime}` : null, course.location),
    };
  });

  courses.sort((a, b) =>
    String(a.nameEn || a.nameKo).localeCompare(String(b.nameEn || b.nameKo))
    || Number(a.id) - Number(b.id));
  const total = courses.length;
  const offset = (page - 1) * pageSize;
  const items = courses.slice(offset, offset + pageSize);

  if (items.length) {
    const courseIds = items.map((course) => Number(course.id));
    const sourced = await fetchCourseSourceDetails(supabase, courseIds);
    const detailByCourseId = new Map(
      sourced.details.map((row) => [String(row.course_id), row]),
    );
    const prerequisiteByCourseId = new Map();
    for (const row of sourced.prerequisites) {
      const key = String(row.course_id);
      if (!prerequisiteByCourseId.has(key)) prerequisiteByCourseId.set(key, []);
      prerequisiteByCourseId.get(key).push({
        id: Number(row.course_prerequisite_id),
        courseId: row.prerequisite_course_id == null ? null : Number(row.prerequisite_course_id),
        officialCourseNumber: row.prerequisite?.official_course_number || null,
        nameKo: row.prerequisite?.course_name || null,
        nameEn: row.prerequisite?.course_name_en || null,
        requirementText: row.requirement_text || null,
        sourceUrl: row.source_url || null,
        sourceKind: row.source_kind,
      });
    }
    for (const course of items) {
      const detail = detailByCourseId.get(String(course.id));
      course.descriptionKo = detail?.description_ko || null;
      course.descriptionEn = detail?.description_en || null;
      course.descriptionSourceUrl = detail?.source_url || null;
      course.syllabusUrl = detail?.syllabus_url || null;
      course.detailSourceKind = detail?.source_kind || null;
      course.prerequisites = prerequisiteByCourseId.get(String(course.id)) || [];
    }
  }

  // Skip old metadata fetching since offerings are natively built from courses now

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasMore: offset + items.length < total,
  };
}

module.exports = {
  filterCourses,
  filterCoursesByOffering,
  fetchCourseSourceDetails,
  fetchOfferingRestrictions,
  isMissingOptionalRelation,
  listCourseCatalog,
  mapOffering,
  mapRestriction,
  normalizeText,
};
