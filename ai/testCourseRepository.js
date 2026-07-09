const assert = require('assert');

const repositoryPath = require.resolve('./courseRepository');
const supabaseClientPath = require.resolve('../supabaseClient');

function createQueryBuilder(calls, result) {
  return {
    select(columns) {
      calls.select.push(columns);
      return this;
    },

    eq(columnName, value) {
      calls.eq.push([columnName, value]);
      return this;
    },

    async order(columnName, options) {
      calls.order.push([columnName, options]);
      return result;
    },

    then(resolve, reject) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
}

function loadRepositoryWithSupabase(resultsByTable) {
  const calls = {
    from: [],
    select: [],
    eq: [],
    order: [],
  };

  const supabase = {
    from(tableName) {
      calls.from.push(tableName);
      return createQueryBuilder(calls, resultsByTable[tableName]);
    },
  };

  delete require.cache[repositoryPath];
  require.cache[supabaseClientPath] = {
    id: supabaseClientPath,
    filename: supabaseClientPath,
    loaded: true,
    exports: supabase,
  };

  return {
    calls,
    repository: require('./courseRepository'),
  };
}

async function testFetchesAndNormalizesCoursesByMajor() {
  const { calls, repository } = loadRepositoryWithSupabase({
    course: {
      data: [
        {
          course_id: 'CSE101',
          course_name: 'Introduction to AI',
          credit: 3,
          major_id: 'AI',
          category: 'REQUIRED',
          major: {
            major_name: 'AI Engineering',
          },
        },
        null,
      ],
      error: null,
    },
  });

  const courses = await repository.fetchNormalizedCoursesByMajor('AI');

  assert.deepStrictEqual(calls.from, ['course']);
  assert.deepStrictEqual(calls.select, [
    'course_id, course_name, credit, major_id, category, major:major_id(major_name)',
  ]);
  assert.deepStrictEqual(calls.eq, [['major_id', 'AI']]);
  assert.deepStrictEqual(calls.order, [['course_id', { ascending: true }]]);
  assert.deepStrictEqual(courses, [
    {
      id: 'CSE101',
      nameKo: 'Introduction to AI',
      nameEn: 'Introduction to AI',
      type: 'REQUIRED',
      credits: 3,
      department: 'AI Engineering',
      tags: ['REQUIRED'],
      prerequisites: [],
    },
  ]);
}

async function testFetchCoursesReturnsEmptyWhenMajorIdMissing() {
  const { calls, repository } = loadRepositoryWithSupabase({});

  assert.deepStrictEqual(await repository.fetchNormalizedCoursesByMajor(), []);
  assert.deepStrictEqual(calls.from, []);
}

async function testFetchesStudentCourseHistory() {
  const { calls, repository } = loadRepositoryWithSupabase({
    enrollment: {
      data: [
        { course_id: 'CSE101', status: 'Completed', semester: '2026-1' },
        { course_id: 'CSE102', status: 'enrolled', semester: '2026-2' },
        { course_id: 'CSE103', status: 'IN_PROGRESS', semester: '2026-2' },
        { course_id: 'CSE104', status: 'in progress', semester: '2026-2' },
        { course_id: 'CSE102', status: 'Completed', semester: '2026-1' },
        { course_id: 'CSE105', status: 'dropped', semester: '2026-1' },
      ],
      error: null,
    },
  });

  const history = await repository.fetchStudentCourseHistory('student-1');

  assert.deepStrictEqual(calls.from, ['enrollment']);
  assert.deepStrictEqual(calls.select, ['course_id, status, semester']);
  assert.deepStrictEqual(calls.eq, [['student_id', 'student-1']]);
  assert.deepStrictEqual(history, {
    completedCourseIds: ['CSE101', 'CSE102'],
    enrolledCourseIds: ['CSE102', 'CSE103', 'CSE104'],
    excludedCourseIds: ['CSE101', 'CSE102', 'CSE103', 'CSE104'],
  });
}

async function testFetchHistoryReturnsEmptyWhenStudentIdMissing() {
  const { calls, repository } = loadRepositoryWithSupabase({});

  assert.deepStrictEqual(await repository.fetchStudentCourseHistory(), {
    completedCourseIds: [],
    enrolledCourseIds: [],
    excludedCourseIds: [],
  });
  assert.deepStrictEqual(calls.from, []);
}

async function testThrowsSupabaseCourseErrors() {
  const supabaseError = new Error('Course query failed');
  const { repository } = loadRepositoryWithSupabase({
    course: {
      data: null,
      error: supabaseError,
    },
  });

  await assert.rejects(
    () => repository.fetchNormalizedCoursesByMajor('AI'),
    supabaseError
  );
}

async function testThrowsSupabaseEnrollmentErrors() {
  const supabaseError = new Error('Enrollment query failed');
  const { repository } = loadRepositoryWithSupabase({
    enrollment: {
      data: null,
      error: supabaseError,
    },
  });

  await assert.rejects(
    () => repository.fetchStudentCourseHistory('student-1'),
    supabaseError
  );
}

(async () => {
  await testFetchesAndNormalizesCoursesByMajor();
  await testFetchCoursesReturnsEmptyWhenMajorIdMissing();
  await testFetchesStudentCourseHistory();
  await testFetchHistoryReturnsEmptyWhenStudentIdMissing();
  await testThrowsSupabaseCourseErrors();
  await testThrowsSupabaseEnrollmentErrors();
  console.log('PASS');
})();
