const { localizeRow } = require('../middleware/languageMiddleware');

function normalizeId(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return String(value);
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return value == null ? '' : String(value);
}

function normalizeNullableText(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeNullableNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function emptyCourseOffering() {
  return {
    academicYear: null,
    semester: null,
    section: null,
    professor: null,
    schedule: null,
    remoteCourseStatus: null,
    originalLanguageCode: null,
    teachingLanguage: null,
    isEnglishTaught: null,
    theoryHours: null,
    practicalHours: null,
  };
}

function explicitEnglishStatus(originalLanguageCode, teachingLanguage) {
  const code = normalizeNullableText(originalLanguageCode)?.toUpperCase() || null;
  const language = normalizeNullableText(teachingLanguage)?.toUpperCase() || null;
  if (code === 'E' || language === 'ENGLISH') return true;
  if (['C', 'J', 'F', 'G', 'R'].includes(code)) return false;
  if (['KOREAN', 'OTHER'].includes(language)) return false;
  return null;
}

function mapCourseOfferingRow(row) {
  const originalLanguageCode = normalizeNullableText(row?.original_language_code);
  const teachingLanguage = normalizeNullableText(row?.teaching_language);
  return {
    officialCourseNumber: normalizeNullableText(row?.official_course_number),
    academicYear: normalizeNullableNumber(row?.academic_year),
    semester: normalizeNullableText(row?.semester),
    section: normalizeNullableText(row?.section),
    professor: normalizeNullableText(row?.professor),
    schedule: normalizeNullableText(row?.schedule),
    remoteCourseStatus: normalizeNullableText(row?.remote_course_status),
    originalLanguageCode,
    teachingLanguage,
    isEnglishTaught: explicitEnglishStatus(originalLanguageCode, teachingLanguage),
    theoryHours: normalizeNullableNumber(row?.theory_hours),
    practicalHours: normalizeNullableNumber(row?.practical_hours),
  };
}

function mapCourseRow(row, language = 'en') {
  const localized = localizeRow(row, language, ['course_name', 'course_name_en']);
  const title = localized.course_name_en || localized.course_name || localized.title || '';
  const name = localized.course_name || localized.course_name_en || title || '';

  const type = String(
  row.category ||
  row.course_type ||
  row.type ||
  'ELECTIVE'
).toUpperCase();

return {
  id: normalizeId(row.course_id ?? row.id),
  title,
  name,
  nameKo: localized.course_name || name,
  nameEn: localized.course_name_en || title,

  officialCourseNumber: normalizeNullableText(row.official_course_number),
  ...emptyCourseOffering(),

  majorId: normalizeId(row.major_id ?? row.majorId),
  type,
  category: type,

  credits: row.credits ?? row.credit ?? 3,
  department: row.department || row.major_name || '',

  year:
    row.recommended_year ??
    row.course_year ??
    row.year ??
    null,

  dayOfWeek: row.day_of_week ?? row.dayOfWeek ?? null,
  startTime: row.start_time ?? row.startTime ?? null,
  endTime: row.end_time ?? row.endTime ?? null,

  description:
    row.description ||
    row.course_description ||
    '',

  tags: normalizeArray(row.tags || row.tag_list || []),

  raw: row,
};
}

function attachCourseOffering(course, offeringRow) {
  if (!offeringRow) return course;
  const offering = mapCourseOfferingRow(offeringRow);
  return {
    ...course,
    ...offering,
    officialCourseNumber:
      offering.officialCourseNumber ?? course.officialCourseNumber ?? null,
  };
}

function chooseUnambiguousOffering(rows, requestedSection) {
  const candidates = Array.isArray(rows) ? rows : [];
  if (requestedSection) {
    const sectionMatches = candidates.filter(
      (row) => normalizeNullableText(row.section) === requestedSection,
    );
    return sectionMatches.length === 1 ? sectionMatches[0] : null;
  }
  return candidates.length === 1 ? candidates[0] : null;
}

async function fetchCourseOfferings(supabaseClient, options) {
  const pageSize =
    Number.isInteger(options.pageSize) && options.pageSize > 0
      ? options.pageSize
      : 1000;
  const rows = [];
  let pageStart = 0;
  while (true) {
    const pageEnd = pageStart + pageSize - 1;
    const result = await supabaseClient
      .from('course_offering')
      .select(
        'course_id,official_course_number,academic_year,semester,section,professor,schedule,remote_course_status,original_language_code,teaching_language,theory_hours,practical_hours'
      )
      .eq('academic_year', options.academicYear)
      .eq('semester', options.semester)
      .order('course_id', { ascending: true })
      .order('section', { ascending: true })
      .range(pageStart, pageEnd);
    if (result.error) {
      const error = new Error(`Optional course_offering query failed: ${result.error.message}`);
      error.code = 'OPTIONAL_COURSE_OFFERING_QUERY_FAILED';
      error.cause = result.error;
      throw error;
    }
    const pageRows = Array.isArray(result.data) ? result.data : [];
    rows.push(...pageRows);
    if (pageRows.length < pageSize) break;
    pageStart += pageSize;
  }
  return rows;
}

function mapScholarshipRow(row, language = 'en') {
  const localized = localizeRow(row, language, ['title', 'description', 'eligibility']);
  const title = localized.title || localized.title_en || row.title || row.name || '';

  return {
    id: normalizeId(row.scholarship_id ?? row.id),
    title,
    description: localized.description || row.description || '',
    deadline: row.deadline || '',
    eligibility: localized.eligibility || row.eligibility || row.provider || '',
    amount: row.amount || null,
    provider: row.provider || null,
    eligibleMajors: normalizeArray(row.eligible_majors || row.eligibleMajors || []),
    eligibleNationalities: normalizeArray(row.eligible_nationalities || row.eligibleNationalities || []),
    minGpa: row.min_gpa ?? row.minGpa ?? null,
    minTopikLevel: row.min_topik_level ?? row.minTopikLevel ?? null,
    minYear: row.min_year ?? row.minYear ?? null,
    maxYear: row.max_year ?? row.maxYear ?? null,
    tags: normalizeArray(row.tags || []),
    raw: row,
  };
}

function mapProgramRow(row, language = 'en') {
  const localized = localizeRow(row, language, ['title', 'description']);
  const title = localized.title || localized.title_en || row.title || row.name || '';
  const description = localized.description || localized.description_en || row.description || '';

  return {
    id: normalizeId(row.program_id ?? row.id),
    title,
    description,
    date: row.date || row.posted_date || '',
    category: row.category || 'Program',
    tags: normalizeArray(row.tags || []),
    careerTags: normalizeArray(row.career_tags || row.careerTags || []),
    eligibleMajors: normalizeArray(row.eligible_majors || row.eligibleMajors || []),
    languages: normalizeArray(row.languages || []),
    minYear: row.min_year ?? row.minYear ?? null,
    maxYear: row.max_year ?? row.maxYear ?? null,
    raw: row,
  };
}

function mapNoticeRow(row, language = 'en') {
  const localized = localizeRow(row, language, [
    'title',
    'content',
    'body',
    'description',
  ]);
  const title = localized.title || row.title || '';
  const body =
    localized.content ||
    localized.body ||
    localized.description ||
    row.content ||
    row.body ||
    row.description ||
    '';
  const languages = [
    ...normalizeArray(row.languages),
    ...(row.language ? [row.language] : []),
  ].filter((value, index, values) => {
    const normalized = String(value || '').trim().toLowerCase();
    return (
      normalized &&
      values.findIndex(
        (candidate) =>
          String(candidate || '').trim().toLowerCase() === normalized
      ) === index
    );
  });

  return {
    id: normalizeId(row.notice_id ?? row.id),
    title,
    body,
    postedDate: row.posted_date ?? row.postedDate ?? null,
    deadline: row.deadline ?? null,
    category: row.category ?? null,
    priority: row.priority ?? null,
    targetMajors: normalizeArray(row.target_majors || row.targetMajors || []),
    targetNationalities: normalizeArray(row.target_nationalities || row.targetNationalities || []),
    minYear: row.min_year ?? row.minYear ?? null,
    maxYear: row.max_year ?? row.maxYear ?? null,
    tags: normalizeArray(row.tags || []),
    languages,
    source: row.source ?? null,
    sourceUrl: row.source_url ?? row.sourceUrl ?? null,
    raw: row,
  };
}

function mapMajorRow(row) {
  return {
    id: normalizeId(row.major_id ?? row.id),
    name: row.major_name || row.name || '',
    nameKo: row.major_name || row.name || '',
    department: row.department || '',
    minTopik: row.min_topik ?? row.minTopik ?? null,
    raw: row,
  };
}

async function fetchAllNotices(supabaseClient, options = {}) {
  const language = options.language || 'en';
  const pageSize =
    Number.isInteger(options.pageSize) && options.pageSize > 0
      ? options.pageSize
      : 1000;
  const notices = [];
  let pageStart = 0;

  while (true) {
    const pageEnd = pageStart + pageSize - 1;
    const result = await supabaseClient
      .from('notice')
      .select('*')
      .order('notice_id', { ascending: true })
      .range(pageStart, pageEnd);

    if (result.error) {
      const error = new Error(
        `Failed to fetch notices from Supabase: ${result.error.message}`
      );
      error.statusCode = 502;
      error.code = 'SUPABASE_NOTICE_QUERY_FAILED';
      error.cause = result.error;
      throw error;
    }

    const pageRows = Array.isArray(result.data) ? result.data : [];
    notices.push(...pageRows.map((row) => mapNoticeRow(row, language)));

    if (pageRows.length < pageSize) {
      break;
    }

    pageStart += pageSize;
  }

  return notices;
}

async function fetchAllCourses(supabaseClient, options = {}) {
  const language = options.language || 'en';
  const pageSize =
    Number.isInteger(options.pageSize) && options.pageSize > 0
      ? options.pageSize
      : 1000;
  const courses = [];
  let pageStart = 0;

  while (true) {
    const pageEnd = pageStart + pageSize - 1;
    const result = await supabaseClient
      .from('course')
      .select('*')
      .order('course_id', { ascending: true })
      .range(pageStart, pageEnd);

    if (result.error) {
      const error = new Error(
        `Failed to fetch courses from Supabase: ${result.error.message}`
      );
      error.statusCode = 502;
      error.code = 'SUPABASE_COURSE_QUERY_FAILED';
      error.cause = result.error;
      throw error;
    }

    const pageRows = Array.isArray(result.data) ? result.data : [];
    courses.push(...pageRows.map((row) => mapCourseRow(row, language)));

    if (pageRows.length < pageSize) {
      break;
    }

    pageStart += pageSize;
  }

  if (options.includeOfferings !== true) return courses;
  const academicYear = Number(options.offeringAcademicYear);
  const semester = normalizeNullableText(options.offeringSemester);
  if (!Number.isInteger(academicYear) || !semester) return courses;

  let offeringRows;
  try {
    offeringRows = await fetchCourseOfferings(supabaseClient, {
      academicYear,
      semester,
      pageSize,
    });
  } catch (_error) {
    return courses;
  }
  const byCourseId = new Map();
  for (const row of offeringRows) {
    const courseId = normalizeId(row.course_id);
    if (!byCourseId.has(courseId)) byCourseId.set(courseId, []);
    byCourseId.get(courseId).push(row);
  }
  const requestedSection = normalizeNullableText(options.offeringSection);
  return courses.map((course) =>
    attachCourseOffering(
      course,
      chooseUnambiguousOffering(byCourseId.get(course.id), requestedSection),
    )
  );
}

async function fetchDashboardCatalogs(supabaseClient, options = {}) {
  const language = options.language || 'en';

  const [coursesResult, scholarshipsResult, programsResult, noticeRows, majorsResult] = await Promise.all([
    supabaseClient.from('course').select('*'),
    supabaseClient.from('scholarship').select('*'),
    supabaseClient.from('extracurricular_program').select('*'),
    fetchAllNotices(supabaseClient, { language }),
    supabaseClient.from('major').select('*'),
  ]);

  const courseRows = (coursesResult.data || []).map((row) => mapCourseRow(row, language));
  const scholarshipRows = (scholarshipsResult.data || []).map((row) => mapScholarshipRow(row, language));
  const programRows = (programsResult.data || []).map((row) => mapProgramRow(row, language));
  const majorRows = (majorsResult.data || []).map((row) => mapMajorRow(row));

  const metadata = {
    source: 'supabase',
    courses: courseRows.length > 0 ? 'loaded' : 'empty',
    programs: programRows.length > 0 ? 'loaded' : 'empty',
    scholarships: scholarshipRows.length > 0 ? 'loaded' : 'empty',
    notices: noticeRows.length > 0 ? 'loaded' : 'empty',
    majors: majorRows.length > 0 ? 'loaded' : 'empty',
  };

  return {
    courses: courseRows,
    scholarships: scholarshipRows,
    programs: programRows,
    notices: noticeRows,
    majors: majorRows,
    metadata,
  };
}

module.exports = {
  attachCourseOffering,
  chooseUnambiguousOffering,
  emptyCourseOffering,
  explicitEnglishStatus,
  fetchAllCourses,
  fetchCourseOfferings,
  fetchAllNotices,
  fetchDashboardCatalogs,
  mapCourseRow,
  mapCourseOfferingRow,
  mapScholarshipRow,
  mapProgramRow,
  mapNoticeRow,
  mapMajorRow,
};
