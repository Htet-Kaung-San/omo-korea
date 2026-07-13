const { recommendCourses } = require('./courseRecommendationEngine');

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePositiveNumber(value, fallback) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
}

function buildSkippedCourse(course, reason) {
  return {
    courseId: course.id,
    nameEn: course.nameEn,
    reason,
  };
}

function buildSemesterPlan(studentProfile = {}, courses = [], options = {}) {
  const courseList = normalizeArray(courses);
  const completedCourseIds = new Set(
    normalizeArray(options.completedCourseIds).map(String)
  );
  const maxCredits = normalizePositiveNumber(options.maxCredits, 18);
  const skippedCourses = [];

  const eligibleCourses = courseList.filter((course) => {
    if (completedCourseIds.has(String(course.id))) {
      skippedCourses.push(
        buildSkippedCourse(course, 'Course already completed')
      );
      return false;
    }

    const prerequisites = normalizeArray(course.prerequisites);
    const missingPrerequisites = prerequisites.filter(
      (courseId) => !completedCourseIds.has(String(courseId))
    );

    if (missingPrerequisites.length > 0) {
      skippedCourses.push(
        buildSkippedCourse(
          course,
          `Missing prerequisite course(s): ${missingPrerequisites.join(', ')}`
        )
      );
      return false;
    }

    return true;
  });

  const recommended = recommendCourses(studentProfile, eligibleCourses, {
    ...options,
    completedCourseIds: [],
  });

  const recommendedCourses = [];
  let totalCredits = 0;

  recommended.forEach((course) => {
    const courseCredits = normalizePositiveNumber(course.credits, 0);

    if (totalCredits + courseCredits <= maxCredits) {
      recommendedCourses.push({ ...course });
      totalCredits += courseCredits;
      return;
    }

    skippedCourses.push(
      buildSkippedCourse(
        course,
        `Adding this course would exceed the max credit limit of ${maxCredits}`
      )
    );
  });

  const warnings = [];

  if (recommendedCourses.length === 0) {
    warnings.push('No eligible courses can be planned.');
  }

  return {
    recommendedCourses,
    totalCredits,
    maxCredits,
    skippedCourses,
    warnings,
  };
}

module.exports = {
  buildSemesterPlan,
};
