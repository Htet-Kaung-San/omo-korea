const assert = require('assert');

const repositoryPath = require.resolve('./scholarshipRepository');
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
    repository: require('./scholarshipRepository'),
  };
}

async function testFetchesAndNormalizesScholarships() {
  const { calls, repository } = loadRepositoryWithSupabase({
    data: [
      {
        id: 'sch-1',
        scholarship_name: 'Global Student Scholarship',
        deadline: '2026-11-15',
        details: 'For international students.',
        scholarship_amount: '500,000 KRW',
        organization: 'International Office',
        eligible_majors: 'Computer Science, Business',
        eligible_nationalities: ['Mongolia'],
        min_gpa: '3.0',
        min_topik_level: '3',
        min_year: '1',
        max_year: '4',
        keyword_tags: 'global, topik',
      },
      null,
    ],
    error: null,
  });

  const scholarships = await repository.fetchNormalizedScholarships();

  assert.deepStrictEqual(calls.from, ['scholarship']);
  assert.deepStrictEqual(calls.select, ['*']);
  assert.deepStrictEqual(calls.order, [['deadline', { ascending: true }]]);
  assert.deepStrictEqual(scholarships, [
    {
      id: 'sch-1',
      title: 'Global Student Scholarship',
      deadline: '2026-11-15',
      description: 'For international students.',
      amount: '500,000 KRW',
      provider: 'International Office',
      eligibleMajors: ['Computer Science', 'Business'],
      eligibleNationalities: ['Mongolia'],
      minGpa: '3.0',
      minTopikLevel: '3',
      minYear: '1',
      maxYear: '4',
      tags: ['global', 'topik'],
    },
  ]);
}

async function testThrowsSupabaseErrors() {
  const supabaseError = new Error('Supabase failed');
  const { repository } = loadRepositoryWithSupabase({
    data: null,
    error: supabaseError,
  });

  await assert.rejects(
    () => repository.fetchNormalizedScholarships(),
    supabaseError
  );
}

(async () => {
  await testFetchesAndNormalizesScholarships();
  await testThrowsSupabaseErrors();
  console.log('PASS');
})();
