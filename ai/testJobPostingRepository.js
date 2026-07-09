const assert = require('assert');

const repositoryPath = require.resolve('./jobPostingRepository');
const supabaseClientPath = require.resolve('../supabaseClient');

function loadRepositoryWithSupabase(result) {
  const calls = {
    from: [],
    select: [],
    order: [],
  };

  const supabase = {
    from(tableName) {
      calls.from.push(tableName);

      return {
        select(columns) {
          calls.select.push(columns);

          return {
            async order(columnName, options) {
              calls.order.push([columnName, options]);
              return result;
            },
          };
        },
      };
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
    repository: require('./jobPostingRepository'),
  };
}

async function testFetchesAndNormalizesJobPostings() {
  const { calls, repository } = loadRepositoryWithSupabase({
    data: [
      {
        job_id: 'job-1',
        title: 'Frontend Intern',
        company: 'PNU Startup Lab',
        type: 'internship',
        deadline: '2026-08-31',
      },
      null,
    ],
    error: null,
  });

  const jobPostings = await repository.fetchNormalizedJobPostings();

  assert.deepStrictEqual(calls.from, ['job_posting']);
  assert.deepStrictEqual(calls.select, [
    'job_id, title, company, type, deadline',
  ]);
  assert.deepStrictEqual(calls.order, [['deadline', { ascending: true }]]);
  assert.deepStrictEqual(jobPostings, [
    {
      id: 'job-1',
      title: 'Frontend Intern',
      company: 'PNU Startup Lab',
      type: 'internship',
      deadline: '2026-08-31',
      description: null,
      academicAreas: [],
      activities: [],
      strengths: [],
      careerAreas: [],
      learningStyles: [],
      interests: [],
      languages: [],
    },
  ]);
}

async function testEmptyTableReturnsEmptyArray() {
  const { repository } = loadRepositoryWithSupabase({
    data: [],
    error: null,
  });

  assert.deepStrictEqual(await repository.fetchNormalizedJobPostings(), []);
}

async function testPassesOptionsToAdapter() {
  const { repository } = loadRepositoryWithSupabase({
    data: [
      {
        job_id: 'job-2',
        title: 'Backend Intern',
        company: 'Data Lab',
        type: 'part-time',
        deadline: '2026-09-15',
      },
    ],
    error: null,
  });

  const jobPostings = await repository.fetchNormalizedJobPostings({
    includeTypeAsInterest: true,
  });

  assert.deepStrictEqual(jobPostings[0].interests, ['part-time']);
}

async function testThrowsSupabaseErrors() {
  const supabaseError = new Error('Supabase failed');
  const { repository } = loadRepositoryWithSupabase({
    data: null,
    error: supabaseError,
  });

  await assert.rejects(
    () => repository.fetchNormalizedJobPostings(),
    supabaseError
  );
}

(async () => {
  await testFetchesAndNormalizesJobPostings();
  await testEmptyTableReturnsEmptyArray();
  await testPassesOptionsToAdapter();
  await testThrowsSupabaseErrors();
  console.log('PASS');
})();
