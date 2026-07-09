const assert = require('assert');

const controllerPath = require.resolve('./aiController');
const supabaseClientPath = require.resolve('../supabaseClient');
const scholarshipRepositoryPath = require.resolve('../ai/scholarshipRepository');
const programRepositoryPath = require.resolve('../ai/programRepository');
const noticeRepositoryPath = require.resolve('../ai/noticeRepository');
const courseRepositoryPath = require.resolve('../ai/courseRepository');
const studentDashboardEnginePath = require.resolve('../ai/studentDashboardEngine');

const studentId = 202455393;
const majorId = 1;
const liveRows = [
  {
    id: 'live-scholarship-1',
    title: 'Live Scholarship One',
    deadline: '2026-09-01',
  },
  {
    id: 'live-scholarship-2',
    title: 'Live Scholarship Two',
    deadline: '2026-10-15',
  },
];
const liveCourses = [
  {
    id: 'CSE101',
    nameEn: 'Intro to AI',
    department: 'Computer Science & Engineering',
    type: 'REQUIRED',
  },
  {
    id: 'CSE231',
    nameEn: 'Completed Course',
    department: 'Computer Science & Engineering',
    type: 'ELECTIVE',
  },
];
const livePrograms = [
  {
    id: 'live-program-1',
    title: 'Live Program One',
    tags: ['AI', 'Mentoring'],
  },
  {
    id: 'live-program-2',
    title: 'Live Program Two',
    tags: ['Career'],
  },
];
const liveNotices = [
  {
    id: 'live-notice-1',
    title: 'Live Notice One',
    tags: ['Academic'],
  },
  {
    id: 'live-notice-2',
    title: 'Live Notice Two',
    tags: ['Campus'],
  },
];
const courseHistory = {
  completedCourseIds: ['CSE231'],
  enrolledCourseIds: ['CSE310'],
  excludedCourseIds: ['CSE231', 'CSE310'],
};
const sentinelDashboard = {
  source: 'sentinel-dashboard',
};

let fetchNormalizedScholarshipsCallCount = 0;
let fetchNormalizedProgramsCallCount = 0;
let fetchNormalizedProgramsOptions = null;
let fetchNormalizedNoticesCallCount = 0;
let fetchNormalizedNoticesOptions = null;
let fetchNormalizedCoursesByMajorCallCount = 0;
let fetchStudentCourseHistoryCallCount = 0;
let capturedDashboardInput = null;

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
                    topik_level: 4,
                    interests: ['AI'],
                    languages: ['English', 'Korean'],
                    academic_areas: ['Programming'],
                    activities: ['Hackathons'],
                    strengths: ['Problem Solving'],
                    career_areas: ['Technology'],
                    learning_styles: ['Project Based Learning'],
                    gpa: 3.7,
                    nationality: 'Mongolia',
                    year: 3,
                    completed_course_ids: ['CSE231'],
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
require.cache[scholarshipRepositoryPath] = {
  id: scholarshipRepositoryPath,
  filename: scholarshipRepositoryPath,
  loaded: true,
  exports: {
    async fetchNormalizedScholarships() {
      fetchNormalizedScholarshipsCallCount += 1;
      return liveRows;
    },
  },
};
require.cache[programRepositoryPath] = {
  id: programRepositoryPath,
  filename: programRepositoryPath,
  loaded: true,
  exports: {
    async fetchNormalizedPrograms(options) {
      fetchNormalizedProgramsCallCount += 1;
      fetchNormalizedProgramsOptions = options;
      return livePrograms;
    },
  },
};
require.cache[noticeRepositoryPath] = {
  id: noticeRepositoryPath,
  filename: noticeRepositoryPath,
  loaded: true,
  exports: {
    async fetchNormalizedNotices(options) {
      fetchNormalizedNoticesCallCount += 1;
      fetchNormalizedNoticesOptions = options;
      return liveNotices;
    },
  },
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
require.cache[studentDashboardEnginePath] = {
  id: studentDashboardEnginePath,
  filename: studentDashboardEnginePath,
  loaded: true,
  exports: {
    buildStudentDashboard(input) {
      capturedDashboardInput = input;
      return sentinelDashboard;
    },
  },
};

const { getDashboardSummary } = require('./aiController');

async function runTest() {
  let responseStatus = null;
  let responseBody = null;
  let nextCallCount = 0;

  const req = {
    user: {
      student_id: studentId,
    },
    query: {},
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

  await getDashboardSummary(req, res, next);

  assert.strictEqual(fetchNormalizedScholarshipsCallCount, 1);
  assert.strictEqual(fetchNormalizedProgramsCallCount, 1);
  assert.deepStrictEqual(fetchNormalizedProgramsOptions, {
    includeTitleTag: true,
  });
  assert.strictEqual(fetchNormalizedNoticesCallCount, 1);
  assert.deepStrictEqual(fetchNormalizedNoticesOptions, {
    includeTitleTag: true,
  });
  assert.strictEqual(fetchNormalizedCoursesByMajorCallCount, 1);
  assert.strictEqual(fetchStudentCourseHistoryCallCount, 1);
  assert.strictEqual(capturedDashboardInput.programs, livePrograms);
  assert.strictEqual(capturedDashboardInput.notices, liveNotices);
  assert.strictEqual(capturedDashboardInput.scholarships, liveRows);
  assert.strictEqual(capturedDashboardInput.courses, liveCourses);
  assert.deepStrictEqual(
    capturedDashboardInput.options.completedCourseIds,
    courseHistory.excludedCourseIds
  );
  assert.strictEqual(responseStatus, 200);
  assert.deepStrictEqual(responseBody, {
    success: true,
    data: sentinelDashboard,
  });
  assert.strictEqual(nextCallCount, 0);

  console.log('PASS');
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
