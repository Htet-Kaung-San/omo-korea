const assert = require('assert');

const controllerPath = require.resolve('./aiController');
const supabaseClientPath = require.resolve('../supabaseClient');
const scholarshipRepositoryPath = require.resolve('../ai/scholarshipRepository');
const studentDashboardEnginePath = require.resolve('../ai/studentDashboardEngine');

const studentId = 202455393;
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
const sentinelDashboard = {
  source: 'sentinel-dashboard',
};

let fetchNormalizedScholarshipsCallCount = 0;
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
                    major_id: 1,
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
  assert.strictEqual(capturedDashboardInput.scholarships, liveRows);
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
