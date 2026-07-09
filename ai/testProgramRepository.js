const assert = require('assert');

const repositoryPath = require.resolve('./programRepository');
const supabaseClientPath = require.resolve('../supabaseClient');

function createQueryBuilder(calls, result) {
  return {
    select(columns) {
      calls.select.push(columns);
      return this;
    },

    async order(columnName, options) {
      calls.order.push([columnName, options]);
      return result;
    },
  };
}

function loadRepositoryWithSupabase(result) {
  const calls = {
    from: [],
    select: [],
    order: [],
  };

  const supabase = {
    from(tableName) {
      calls.from.push(tableName);
      return createQueryBuilder(calls, result);
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
    repository: require('./programRepository'),
  };
}

async function testFetchesAndNormalizesPrograms() {
  const { calls, repository } = loadRepositoryWithSupabase({
    data: [
      {
        program_id: 'program-1',
        name: 'AI Career Mentoring',
        category: 'career',
        deadline: '2026-09-30',
      },
      null,
    ],
    error: null,
  });

  const programs = await repository.fetchNormalizedPrograms();

  assert.deepStrictEqual(calls.from, ['extracurricular_program']);
  assert.deepStrictEqual(calls.select, [
    'program_id, name, category, deadline',
  ]);
  assert.deepStrictEqual(calls.order, [['program_id', { ascending: true }]]);
  assert.deepStrictEqual(programs, [
    {
      id: 'program-1',
      title: 'AI Career Mentoring',
      description: null,
      date: '2026-09-30',
      category: 'career',
      tags: ['career'],
      careerTags: [],
      eligibleMajors: [],
      languages: [],
      minYear: null,
      maxYear: null,
    },
  ]);
}

async function testPassesOptionsToNormalizeProgramRow() {
  const { repository } = loadRepositoryWithSupabase({
    data: [
      {
        program_id: 'program-2',
        name: 'Startup Challenge',
        category: 'startup',
        deadline: '2026-10-15',
      },
    ],
    error: null,
  });

  const programs = await repository.fetchNormalizedPrograms({
    includeTitleTag: true,
  });

  assert.deepStrictEqual(programs[0].tags, [
    'startup',
    'Startup Challenge',
  ]);
}

async function testThrowsSupabaseErrors() {
  const supabaseError = new Error('Program query failed');
  const { repository } = loadRepositoryWithSupabase({
    data: null,
    error: supabaseError,
  });

  await assert.rejects(
    () => repository.fetchNormalizedPrograms(),
    supabaseError
  );
}

(async () => {
  await testFetchesAndNormalizesPrograms();
  await testPassesOptionsToNormalizeProgramRow();
  await testThrowsSupabaseErrors();
  console.log('PASS');
})();
