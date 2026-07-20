const TYPE_PRIORITY = {
  REQUIRED: 0,
  GEN_ED: 1,
  ELECTIVE: 2,
};

const MBTI_COURSE_HINTS = {
  I: ['research', 'reading', 'writing', 'analysis', 'self-study', 'theory'],
  E: ['presentation', 'discussion', 'team', 'communication', 'project'],
  S: ['practice', 'lab', 'field', 'hands-on', 'basic', 'applied'],
  N: ['ai', 'startup', 'design', 'innovation', 'strategy', 'creative'],
  T: ['data', 'programming', 'engineering', 'logic', 'analysis', 'system'],
  F: ['culture', 'counseling', 'communication', 'community', 'education'],
  J: ['required', 'planning', 'management', 'structured', 'basic'],
  P: ['elective', 'creative', 'project', 'startup', 'exploration'],
};

function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeId(value) {
  if (value === null || value === undefined || value === '') return '';
  return String(value).trim();
}

function getCourseType(course = {}) {
  return String(
    course.raw?.category ||
    course.category ||
    course.course_type ||
    course.type ||
    ''
  ).toUpperCase();
}

function getCourseMajorId(course = {}) {
  return normalizeId(
    course.raw?.major_id ||
    course.major_id ||
    course.majorId ||
    ''
  );
}

function getCourseYear(course = {}) {
  const value =
    course.raw?.year ||
    course.raw?.recommended_year ||
    course.year ||
    course.recommendedYear ||
    course.grade ||
    course.course_year;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getStudentYear(studentProfile = {}) {
  const explicitYear = Number(studentProfile.year || studentProfile.studentYear);
  if (Number.isFinite(explicitYear) && explicitYear > 0) {
    return Math.min(4, Math.max(1, explicitYear));
  }

  const studentId = normalizeId(studentProfile.studentId || studentProfile.student_id);
  const admissionYear = Number(studentId.slice(0, 4));
  const currentYear = new Date().getFullYear();

  if (Number.isFinite(admissionYear) && admissionYear >= 2000 && admissionYear <= currentYear) {
    return Math.min(4, Math.max(1, currentYear - admissionYear + 1));
  }

  return null;
}

function isSameMajorCourse(studentProfile = {}, course = {}) {
  const studentMajorId = normalizeId(studentProfile.majorId || studentProfile.major_id);
  const courseMajorId = getCourseMajorId(course);

  if (studentMajorId && courseMajorId && studentMajorId === courseMajorId) {
    return true;
  }

  const major = normalizeValue(studentProfile.major);
  const courseDepartment = normalizeValue(course.department || course.major || '');

  return major !== '' && courseDepartment !== '' && courseDepartment === major;
}

function getMatchingInterestTags(studentInterests = [], courseTags = []) {
  const interestSet = new Set(normalizeArray(studentInterests).map(normalizeValue));

  return normalizeArray(courseTags).filter((tag) =>
    interestSet.has(normalizeValue(tag))
  );
}

function getMbtiMatches(mbti = '', course = {}) {
  const normalizedMbti = String(mbti || '').toUpperCase();
  if (normalizedMbti.length !== 4) return [];

  const text = normalizeValue([
    course.title,
    course.nameEn,
    course.nameKo,
    course.department,
    course.description,
    ...(course.tags || []),
  ].filter(Boolean).join(' '));

  const matches = [];

  for (const letter of normalizedMbti) {
    const hints = MBTI_COURSE_HINTS[letter] || [];
    const matchedHint = hints.find((hint) => text.includes(hint));
    if (matchedHint) matches.push(`${letter}:${matchedHint}`);
  }

  return matches;
}

function buildMatchHint({
  isMajorCourse,
  interestMatches,
  isRequiredInMajor,
  isElectiveInMajor,
  isGenEdCourse,
  yearMatch,
  mbtiMatches,
}) {
  const hints = [];

  if (isMajorCourse) hints.push('Same department as your major');
  if (yearMatch) hints.push(`Recommended for your academic year`);
  if (interestMatches.length > 0) {
    hints.push(`Matches interest tags: ${interestMatches.slice(0, 2).join(', ')}`);
  }
  if (mbtiMatches.length > 0) {
    hints.push(`Matches MBTI learning style: ${mbtiMatches.slice(0, 2).join(', ')}`);
  }
  if (isRequiredInMajor) hints.push('Required course in your major');
  if (isElectiveInMajor) hints.push('Elective course in your major');
  if (isGenEdCourse) hints.push('General education course');

  return hints.join('; ');
}

function scoreCourse(studentProfile = {}, course = {}) {
  const isMajorCourse = isSameMajorCourse(studentProfile, course);
  const courseTags = course.tags || course.tag_list || [];
  const interestMatches = getMatchingInterestTags(
    studentProfile.interests,
    courseTags
  );
  const cappedInterestMatches = Math.min(interestMatches.length, 2);

  const normalizedType = getCourseType(course);
  const isRequiredInMajor = normalizedType === 'REQUIRED' && isMajorCourse;
  const isElectiveInMajor = normalizedType === 'ELECTIVE' && isMajorCourse;
  const isGenEdCourse = normalizedType === 'GEN_ED';

  const studentYear = getStudentYear(studentProfile);
  const courseYear = getCourseYear(course);
  const yearMatch = Boolean(studentYear && courseYear && studentYear === courseYear);

  const mbtiMatches = getMbtiMatches(studentProfile.mbti, course);
  const cappedMbtiMatches = Math.min(mbtiMatches.length, 2);

  let score = 0;

  if (isMajorCourse) score += 40;
  if (yearMatch) score += 18;
  score += cappedInterestMatches * 15;
  score += cappedMbtiMatches * 6;
  if (isRequiredInMajor) score += 20;
  if (isElectiveInMajor) score += 10;
  if (isGenEdCourse) score += 8;

  return {
    score: Math.min(score, 100),
    matchHint: buildMatchHint({
      isMajorCourse,
      interestMatches,
      isRequiredInMajor,
      isElectiveInMajor,
      isGenEdCourse,
      yearMatch,
      mbtiMatches,
    }),
  };
}

function compareCourses(a, b) {
  if (b.score !== a.score) return b.score - a.score;

  const typeDifference =
    (TYPE_PRIORITY[getCourseType(a)] ?? Number.MAX_SAFE_INTEGER) -
    (TYPE_PRIORITY[getCourseType(b)] ?? Number.MAX_SAFE_INTEGER);

  if (typeDifference !== 0) return typeDifference;

  return String(a.nameEn || a.title || '').localeCompare(String(b.nameEn || b.title || ''));
}

function buildFallbackCourse(course, matchHint) {
  const normalizedType = getCourseType(course);

  return {
    ...course,
    type: normalizedType || course.type || 'ELECTIVE',
    score: normalizedType === 'GEN_ED' ? 15 : 10,
    matchHint,
  };
}

function recommendCourses(studentProfile = {}, courses = [], options = {}) {
  const completedCourseIds = new Set(
    normalizeArray(options.completedCourseIds).map(String)
  );
  const requestedType = options.type || 'ALL';
  const limit =
    Number.isInteger(options.limit) && options.limit > 0
      ? options.limit
      : courses.length;

  const availableCourses = normalizeArray(courses)
    .filter((course) => !completedCourseIds.has(String(course.id)))
    .filter((course) => {
      return (
        requestedType === 'ALL' ||
        getCourseType(course) === String(requestedType).toUpperCase()
      );
    });

  const scoredCourses = availableCourses
    .map((course) => ({
      ...course,
      type: getCourseType(course) || course.type || 'ELECTIVE',
      ...scoreCourse(studentProfile, course),
    }))
    .sort(compareCourses);

  const matchedCourses = scoredCourses.filter((course) => course.score >= 40);

  if (matchedCourses.length > 0) {
    return matchedCourses.slice(0, limit);
  }

  const generalEducationCourses = availableCourses
    .filter((course) => getCourseType(course) === 'GEN_ED')
    .map((course) =>
      buildFallbackCourse(
        course,
        'Same-major or year-specific courses are not available in the current dataset, so AI is showing useful general education courses for international students.'
      )
    )
    .sort(compareCourses);

  if (generalEducationCourses.length > 0) {
    return generalEducationCourses.slice(0, limit);
  }

  return [];
}

module.exports = {
  recommendCourses,
};

