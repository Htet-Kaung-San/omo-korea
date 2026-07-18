const TYPE_PRIORITY = {
  REQUIRED: 0,
  ELECTIVE: 1,
  GEN_ED: 2,
};

function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getCourseType(course) {
  return String(
    course.type ||
    course.course_type ||
    course.category ||
    course.raw?.category ||
    ''
  ).toUpperCase();
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
  isGenEdInterestMatch,
}) {
  const hints = [];

  if (isMajorCourse) hints.push('Same department as your major');
  if (interestMatches.length > 0) {
    hints.push(`Matches interest tags: ${interestMatches.slice(0, 2).join(', ')}`);
  }
  if (isRequiredInMajor) hints.push('Required course in your major');
  if (isElectiveInMajor) hints.push('Elective course in your major');
  if (isGenEdInterestMatch) hints.push('General education course aligned with your interests');

  return hints.join('; ');
}

function scoreCourse(studentProfile = {}, course = {}) {
  const major = normalizeValue(studentProfile.major);
  const courseDepartment = normalizeValue(course.department || course.major || '');
  const isMajorCourse = major !== '' && courseDepartment === major;
  const courseTags = course.tags || course.tag_list || [];
  const interestMatches = getMatchingInterestTags(
    studentProfile.interests,
    courseTags
  );
  const cappedInterestMatches = Math.min(interestMatches.length, 2);
  const normalizedType = getCourseType(course);
  const isRequiredInMajor = normalizedType === 'REQUIRED' && isMajorCourse;
  const isElectiveInMajor = normalizedType === 'ELECTIVE' && isMajorCourse;
  const isGenEdInterestMatch =
    normalizedType === 'GEN_ED' && interestMatches.length > 0;

  let score = 0;

  if (isMajorCourse) score += 40;
  score += cappedInterestMatches * 15;
  if (isRequiredInMajor) score += 20;
  if (isElectiveInMajor) score += 10;
  if (isGenEdInterestMatch) score += 8;

  return {
    score: Math.min(score, 100),
    matchHint: buildMatchHint({
      isMajorCourse,
      interestMatches,
      isRequiredInMajor,
      isElectiveInMajor,
      isGenEdInterestMatch,
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

function buildFallbackCourse(course) {
  const normalizedType = getCourseType(course);

  return {
    ...course,
    type: course.type || normalizedType || 'ELECTIVE',
    score: 10,
    matchHint: 'General course recommendation. Add interests or academic profile details to improve matching.',
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
      ...scoreCourse(studentProfile, course),
    }))
    .sort(compareCourses);

  const matchedCourses = scoredCourses.filter((course) => course.score > 0);

  if (matchedCourses.length > 0) {
    return matchedCourses.slice(0, limit);
  }

  return availableCourses
    .map(buildFallbackCourse)
    .sort(compareCourses)
    .slice(0, limit);
}

module.exports = {
  recommendCourses,
};
