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

function scoreCourse(studentProfile, course) {
  const major = normalizeValue(studentProfile.major);
  const courseDepartment = normalizeValue(course.department);
  const isMajorCourse = major !== '' && courseDepartment === major;
  const interestMatches = getMatchingInterestTags(
    studentProfile.interests,
    course.tags
  );
  const cappedInterestMatches = Math.min(interestMatches.length, 2);
  const isRequiredInMajor = course.type === 'REQUIRED' && isMajorCourse;
  const isElectiveInMajor = course.type === 'ELECTIVE' && isMajorCourse;
  const isGenEdInterestMatch =
    course.type === 'GEN_ED' && interestMatches.length > 0;

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
    (TYPE_PRIORITY[a.type] ?? Number.MAX_SAFE_INTEGER) -
    (TYPE_PRIORITY[b.type] ?? Number.MAX_SAFE_INTEGER);

  if (typeDifference !== 0) return typeDifference;

  return String(a.nameEn || '').localeCompare(String(b.nameEn || ''));
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

  return courses
    .filter((course) => !completedCourseIds.has(String(course.id)))
    .filter((course) => requestedType === 'ALL' || course.type === requestedType)
    .map((course) => ({
      ...course,
      ...scoreCourse(studentProfile, course),
    }))
    .filter((course) => course.score > 0)
    .sort(compareCourses)
    .slice(0, limit);
}

module.exports = {
  recommendCourses,
};
