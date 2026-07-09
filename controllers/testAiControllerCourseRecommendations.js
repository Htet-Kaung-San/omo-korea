const assert = require('assert');

const controllerPath = require.resolve('./aiController');
const supabaseClientPath = require.resolve('../supabaseClient');
const courseRepositoryPath = require.resolve('../ai/courseRepository');

const studentId = 202455393;
const majorId = 'major-ai-42';
const completedCourseId = 'LIVE-COMPLETE-101';
const enrolledCourseId = 'LIVE-ENROLLED-201';
const liveCourses = [
  {
    id: 'LIVE-AI-301',
    nameKo: 'Applied AI Studio',
    nameEn: 'Applied AI Studio',
    type: 'REQUIRED',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['AI', 'Machine Learning'],
  },
  {
    id: completedCourseId,
    nameKo: 'Completed Live Course',
    nameEn: 'Completed Live Course',
    type: 'REQUIRED',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['AI'],
  },
  {
    id: enrolledCourseId,
    nameKo: 'Currently Enrolled Live Course',
    nameEn: 'Currently Enrolled Live Course',
    type: 'REQUIRED',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['AI'],
  },
  {
    id: 'LIVE-GENED-401',
    nameKo: 'Ethics for Intelligent Systems',
    nameEn: 'Ethics for Intelligent Systems',
    type: 'GEN_ED',
    credits: 2,
    department: 'General Education',
    tags: ['AI', 'Ethics'],
  },
];
const courseHistory = {
  completedCourseIds: [completedCourseId],
  enrolledCourseIds: [enrolledCourseId],
  excludedCourseIds: [completedCourseId, enrolledCourseId],
};

let fetchNormalizedCoursesByMajorCallCount = 0;
let fetchStudentCourseHistoryCallCount = 0;

const supabase = {
  from(tableName) {
    assert.strictEqual(tableName, 'student');

    return {
      select(columns) {
        assert.ok(columns.includes('major:major_id'));

        return {
          eq(columnName, value) {
            assert.strictEqual(columnName, 'student_id');
            assert.strictEqual(value, studentId);

            return {
              async single() {
                return {
                  data: {
                    student_id: studentId,
                    major_id: majorId,
                    questionnaire: {
                      academicAreas: ['AA13'],
                      activities: ['ACT01'],
                      strengths: ['ST01'],
                      careerAreas: ['CA01'],
                      learningStyles: ['LS01'],
                      topikLevel: 4,
                      topN: 3,
                    },
                    completed_course_ids: [completedCourseId],
                    interests: ['AI', 'Machine Learning'],
                    languages: ['English', 'Korean'],
                    academic_areas: ['Programming'],
                    activities: ['Hackathons'],
                    strengths: ['Problem Solving'],
                    career_areas: ['Technology'],
                    learning_styles: ['Project Based Learning'],
                    gpa: 3.7,
                    nationality: 'Mongolia',
                    year: 3,
                    topik_level: 4,
                    major: {
                      major_name: 'Computer Science & Engineering',
                      department: 'College of Information and Biomedical Engineering',
                    },
                  },
                  error: null,
                };
              },
            };
          },
        };
      },
    };
  },
};

delete require.cache[controllerPath];
require.cache[supabaseClientPath] = {
  id: supabaseClientPath,
  filename: supabaseClientPath,
  loaded: true,
  exports: supabase,
};
require.cache[courseRepositoryPath] = {
  id: courseRepositoryPath,
  filename: courseRepositoryPath,
  loaded: true,
  exports: {
    async fetchNormalizedCoursesByMajor(receivedMajorId) {
      fetchNormalizedCoursesByMajorCallCount += 1;
      assert.strictEqual(receivedMajorId, majorId);
      return liveCourses;
    },
    async fetchStudentCourseHistory(receivedStudentId) {
      fetchStudentCourseHistoryCallCount += 1;
      assert.strictEqual(receivedStudentId, studentId);
      return courseHistory;
    },
  },
};

const { getCourseRecommendations } = require('./aiController');

async function runTest() {
  let responseStatus = null;
  let responseBody = null;
  let nextCallCount = 0;

  const req = {
    user: {
      student_id: studentId,
    },
    query: {
      limit: '10',
    },
  };
  const res = {
    status(statusCode) {
      responseStatus = statusCode;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };
  const next = () => {
    nextCallCount += 1;
  };

  await getCourseRecommendations(req, res, next);

  assert.strictEqual(fetchNormalizedCoursesByMajorCallCount, 1);
  assert.strictEqual(fetchStudentCourseHistoryCallCount, 1);
  assert.strictEqual(responseStatus, 200);
  assert.deepStrictEqual(Object.keys(responseBody), ['success', 'data']);
  assert.strictEqual(responseBody.success, true);
  assert.ok(Array.isArray(responseBody.data));
  assert.strictEqual(nextCallCount, 0);

  const recommendationIds = responseBody.data.map((course) => course.id);

  assert.ok(recommendationIds.includes('LIVE-AI-301'));
  assert.ok(recommendationIds.includes('LIVE-GENED-401'));
  assert.ok(!recommendationIds.includes(completedCourseId));
  assert.ok(!recommendationIds.includes(enrolledCourseId));
  assert.ok(!recommendationIds.includes('CSE231'));
  assert.ok(!recommendationIds.includes('CSE342'));
  assert.ok(!recommendationIds.includes('MAT240'));
  assert.ok(!recommendationIds.includes('GED120'));
  assert.ok(
    responseBody.data.every((course) =>
      liveCourses.some((liveCourse) => liveCourse.id === course.id)
    )
  );

  console.log('PASS');
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
