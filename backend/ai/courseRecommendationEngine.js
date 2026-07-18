const TYPE_PRIORITY = {
  REQUIRED: 0,
  GEN_ED: 1,
  ELECTIVE: 2,
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

function buildMatchHint({
  isMajorCourse,
  interestMatches,
  isRequiredInMajor,
  isElectiveInMajor,
  isGenEdCourse,
}) {
  const hints = [];

  if (isMajorCourse) hints.push('Same department as your major');
  if (interestMatches.length > 0) {
    hints.push(`Matches interest tags: ${interestMatches.slice(0, 2).join(', ')}`);
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

  let score = 0;

  if (isMajorCourse) score += 40;
  score += cappedInterestMatches * 15;
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
        'General education course. Same-major courses are not available in the current course dataset.'
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
