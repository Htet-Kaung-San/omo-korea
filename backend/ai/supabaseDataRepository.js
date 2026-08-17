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

function normalizeCourseYearLevel(value) {
  const text = normalizeNullableText(value);
  if (!text) return null;
  const normalized = text.normalize('NFKC').toLowerCase();
  if (normalized.includes('전학년') || normalized.includes('all')) return 'ALL';
  const match = normalized.match(/[1-8]/);
  return match ? Number(match[0]) : null;
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
    presentationRequirement: null,
    groupProjectRequirement: null,
    assignmentRequirement: null,
    examInformation: null,
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
    year: normalizeCourseYearLevel(row?.year_level),
  };
}

function mapCourseMetadataRow(row) {
  return {
    presentationRequirement: normalizeNullableText(row?.presentation_requirement),
    groupProjectRequirement: normalizeNullableText(row?.group_project_requirement),
    assignmentRequirement: normalizeNullableText(row?.assignment_requirement),
    examInformation: normalizeNullableText(row?.exam_information),
  };
}

function mapCourseRow(row, language = 'en') {
  const storedName = row.course_name || row.course_name_en || '';
  // "English (한국어)" splits into two names, but a trailing parenthetical is
  // only the Korean half when it actually contains Hangul. 492 of the 1,924
  // live course rows end in a sequence marker instead — 재무회계(I),
  // 일반물리학(I), 종합설계과제(Capstone 2) — and splitting those blindly left
  // nameKo as the literal string "I". Since the Korean UI renders nameKo as the
  // card heading, a quarter of the catalog displayed as "I" / "II", and the
  // recommendation engine canonicalised every one of them to the same token.
  const bilingualMatch = String(storedName).match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  const bilingual = bilingualMatch && /[가-힣]/.test(bilingualMatch[2]) ? bilingualMatch : null;
  const nameKo = bilingual?.[2]?.trim() || row.course_name || row.course_name_en || '';
  const nameEn = row.course_name_en || bilingual?.[1]?.trim() || row.course_name || '';
  const title = String(language).toLowerCase().startsWith('ko') ? nameKo : nameEn;
  const name = title || nameKo || nameEn;

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
  nameKo,
  nameEn,

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

function attachCourseOffering(course, offeringRow, metadataRow = null) {
  if (!offeringRow) return course;
  const offering = mapCourseOfferingRow(offeringRow);
  return {
    ...course,
    ...offering,
    ...(metadataRow ? mapCourseMetadataRow(metadataRow) : {}),
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
        'course_offering_id,course_id,official_course_number,academic_year,semester,section,professor,year_level,schedule,classroom,remote_course_status,original_language_code,teaching_language,theory_hours,practical_hours'
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

async function fetchCourseMetadata(supabaseClient, offeringIds) {
  if (!Array.isArray(offeringIds) || offeringIds.length === 0) return [];
  const result = await supabaseClient
    .from('course_metadata')
    .select(
      'course_offering_id,presentation_requirement,group_project_requirement,assignment_requirement,exam_information'
    )
    .in('course_offering_id', offeringIds);
  if (result.error) {
    const error = new Error(`Optional course_metadata query failed: ${result.error.message}`);
    error.code = 'OPTIONAL_COURSE_METADATA_QUERY_FAILED';
    error.cause = result.error;
    throw error;
  }
  return Array.isArray(result.data) ? result.data : [];
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
    sourceUrl: row.source_url || row.sourceUrl || null,
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
  const selectedByCourseId = new Map();
  for (const course of courses) {
    const selected = chooseUnambiguousOffering(byCourseId.get(course.id), requestedSection);
    if (selected) selectedByCourseId.set(course.id, selected);
  }
  let metadataRows = [];
  try {
    metadataRows = await fetchCourseMetadata(
      supabaseClient,
      [...selectedByCourseId.values()].map((row) => row.course_offering_id),
    );
  } catch (_error) {
    metadataRows = [];
  }
  const metadataByOfferingId = new Map(
    metadataRows.map((row) => [String(row.course_offering_id), row]),
  );
  return courses.map((course) => {
    const isOfferedThisTerm = byCourseId.has(course.id);
    const offering = selectedByCourseId.get(course.id);
    const metadata = offering
      ? metadataByOfferingId.get(String(offering.course_offering_id)) || null
      : null;
    return attachCourseOffering(
      { ...course, isOfferedThisTerm },
      offering,
      metadata,
    );
  });
}

async function fetchCourseCurriculum(supabaseClient, options = {}) {
  const pageSize = Number.isInteger(options.pageSize) && options.pageSize > 0
    ? options.pageSize
    : 1000;
  const rows = [];
  let pageStart = 0;

  while (true) {
    const pageEnd = pageStart + pageSize - 1;
    let query = supabaseClient
      .from('course_curriculum')
      .select(
        'course_curriculum_id,course_id,major_id,curriculum_year,source_course_code,category,recommended_year,grade_semester,source_department'
      )
      .order('course_curriculum_id', { ascending: true })
      .range(pageStart, pageEnd);
    if (options.majorId !== null && options.majorId !== undefined) {
      query = query.eq('major_id', Number(options.majorId));
    }
    const result = await query;
    if (result.error) {
      const error = new Error(
        `Failed to fetch course curriculum from Supabase: ${result.error.message}`
      );
      error.statusCode = 502;
      error.code = 'SUPABASE_COURSE_CURRICULUM_QUERY_FAILED';
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

function chooseCurriculumRow(rows, preferredYear) {
  const candidates = Array.isArray(rows) ? [...rows] : [];
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => Number(a.curriculum_year) - Number(b.curriculum_year));
  const requested = Number(preferredYear);
  if (Number.isInteger(requested)) {
    const exact = candidates.find((row) => Number(row.curriculum_year) === requested);
    if (exact) return exact;
    const earlier = candidates.filter((row) => Number(row.curriculum_year) <= requested);
    if (earlier.length) return earlier[earlier.length - 1];
  }
  return candidates[candidates.length - 1];
}

function attachCourseCurriculum(courses, curriculumRows, options = {}) {
  const byCourseId = new Map();
  for (const row of Array.isArray(curriculumRows) ? curriculumRows : []) {
    const key = normalizeId(row.course_id);
    if (!byCourseId.has(key)) byCourseId.set(key, []);
    byCourseId.get(key).push(row);
  }
  return (Array.isArray(courses) ? courses : []).map((course) => {
    const rows = byCourseId.get(String(course.id)) || [];
    const selected = chooseCurriculumRow(rows, options.curriculumYear);
    if (!selected) return { ...course, curriculumYears: [], curriculum: null };
    return {
      ...course,
      type: String(selected.category || course.type || 'ELECTIVE').toUpperCase(),
      category: String(selected.category || course.category || 'ELECTIVE').toUpperCase(),
      year: selected.recommended_year ?? course.year ?? null,
      officialCourseNumber:
        course.officialCourseNumber || selected.source_course_code || null,
      curriculumYears: rows
        .map((row) => Number(row.curriculum_year))
        .filter(Number.isInteger)
        .sort((a, b) => a - b),
      curriculum: {
        curriculumYear: Number(selected.curriculum_year),
        sourceCourseCode: selected.source_course_code || null,
        category: selected.category || null,
        recommendedYear: selected.recommended_year ?? null,
        gradeSemester: selected.grade_semester || null,
        sourceDepartment: selected.source_department || null,
      },
    };
  });
}

async function fetchStudentCourseHistory(supabaseClient, studentId, options = {}) {
  const pageSize = Number.isInteger(options.pageSize) && options.pageSize > 0
    ? options.pageSize
    : 1000;
  const rows = [];
  let pageStart = 0;

  while (true) {
    const pageEnd = pageStart + pageSize - 1;
    const result = await supabaseClient
      .from('enrollment')
      .select('course_id,status,semester')
      .eq('student_id', studentId)
      .order('enrollment_id', { ascending: true })
      .range(pageStart, pageEnd);

    if (result.error) {
      const error = new Error(
        `Failed to fetch student course history from Supabase: ${result.error.message}`
      );
      error.statusCode = 502;
      error.code = 'SUPABASE_ENROLLMENT_QUERY_FAILED';
      error.cause = result.error;
      throw error;
    }

    const pageRows = Array.isArray(result.data) ? result.data : [];
    rows.push(...pageRows.map((row) => ({
      courseId: normalizeId(row.course_id),
      status: normalizeNullableText(row.status),
      semester: normalizeNullableText(row.semester),
    })));
    if (pageRows.length < pageSize) break;
    pageStart += pageSize;
  }

  return rows;
}

async function fetchDashboardCatalogs(supabaseClient, options = {}) {
  const language = options.language || 'en';

  const [courseRows, scholarshipsResult, programsResult, noticeRows, majorsResult] = await Promise.all([
    fetchAllCourses(supabaseClient, { language }),
    supabaseClient.from('scholarship').select('*'),
    supabaseClient.from('extracurricular_program').select('*'),
    fetchAllNotices(supabaseClient, { language }),
    supabaseClient.from('major').select('*'),
  ]);

  const scholarshipRows = scholarshipsResult.error?.code === 'PGRST205'
    ? noticeRows
      .filter((row) => /장학|scholarship|학자금|등록금\s*지원/i.test(`${row.title} ${row.body}`))
      .map((row) => ({
        id: `notice-${row.id}`,
        title: row.title,
        description: row.body,
        deadline: '',
        eligibility: 'See the official notice for eligibility and application requirements.',
        amount: null,
        provider: row.source || 'PNU',
        sourceUrl: row.sourceUrl || null,
        eligibleMajors: [],
        eligibleNationalities: [],
        minGpa: null,
        minTopikLevel: null,
        minYear: null,
        maxYear: null,
      }))
    : (scholarshipsResult.data || []).map((row) => mapScholarshipRow(row, language));
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
  fetchCourseCurriculum,
  attachCourseCurriculum,
  chooseCurriculumRow,
  fetchStudentCourseHistory,
  fetchCourseMetadata,
  fetchCourseOfferings,
  fetchAllNotices,
  fetchDashboardCatalogs,
  mapCourseRow,
  mapCourseOfferingRow,
  mapCourseMetadataRow,
  mapScholarshipRow,
  mapProgramRow,
  mapNoticeRow,
  mapMajorRow,
};
