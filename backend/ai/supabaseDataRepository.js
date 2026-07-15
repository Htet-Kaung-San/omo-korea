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

function mapCourseRow(row, language = 'en') {
  const localized = localizeRow(row, language, ['course_name', 'course_name_en']);
  const title = localized.course_name_en || localized.course_name || localized.title || '';
  const name = localized.course_name || localized.course_name_en || title || '';

  return {
    id: normalizeId(row.course_id ?? row.id),
    title,
    name,
    nameKo: localized.course_name || name,
    nameEn: localized.course_name_en || title,
    type: (row.course_type || row.type || 'ELECTIVE').toUpperCase(),
    credits: row.credits ?? row.credit ?? 3,
    department: row.department || row.major_name || '',
    tags: normalizeArray(row.tags || row.tag_list || []),
    raw: row,
  };
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
  const localized = localizeRow(row, language, ['title', 'content', 'body']);
  const title = localized.title || row.title || '';
  const body = localized.content || localized.body || row.content || row.body || '';

  return {
    id: normalizeId(row.notice_id ?? row.id),
    title,
    body,
    category: row.category || 'NOTICE',
    priority: row.priority || 'NORMAL',
    deadline: row.deadline || row.posted_date || '',
    targetMajors: normalizeArray(row.target_majors || row.targetMajors || []),
    targetNationalities: normalizeArray(row.target_nationalities || row.targetNationalities || []),
    minYear: row.min_year ?? row.minYear ?? null,
    maxYear: row.max_year ?? row.maxYear ?? null,
    tags: normalizeArray(row.tags || []),
    languages: normalizeArray(row.languages || []),
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

async function fetchDashboardCatalogs(supabaseClient, options = {}) {
  const language = options.language || 'en';

  const [coursesResult, scholarshipsResult, programsResult, noticesResult, majorsResult] = await Promise.all([
    supabaseClient.from('course').select('*'),
    supabaseClient.from('scholarship').select('*'),
    supabaseClient.from('extracurricular_program').select('*'),
    supabaseClient.from('notice').select('*'),
    supabaseClient.from('major').select('*'),
  ]);

  const courseRows = (coursesResult.data || []).map((row) => mapCourseRow(row, language));
  const scholarshipRows = (scholarshipsResult.data || []).map((row) => mapScholarshipRow(row, language));
  const programRows = (programsResult.data || []).map((row) => mapProgramRow(row, language));
  const noticeRows = (noticesResult.data || []).map((row) => mapNoticeRow(row, language));
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
  fetchDashboardCatalogs,
  mapCourseRow,
  mapScholarshipRow,
  mapProgramRow,
  mapNoticeRow,
  mapMajorRow,
};
