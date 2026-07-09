const assert = require('assert');

const repositoryPath = require.resolve('./noticeRepository');
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
    repository: require('./noticeRepository'),
  };
}

async function testFetchesAndNormalizesNotices() {
  const { calls, repository } = loadRepositoryWithSupabase({
    data: [
      {
        notice_id: 'notice-1',
        title: 'Spring Semester Registration',
        content: 'Registration opens next week.',
        language: 'en',
        posted_date: '2026-03-01',
      },
      null,
    ],
    error: null,
  });

  const notices = await repository.fetchNormalizedNotices({
    includeTitleTag: true,
  });

  assert.deepStrictEqual(calls.from, ['notice']);
  assert.deepStrictEqual(calls.select, [
    'notice_id, title, content, language, posted_date',
  ]);
  assert.deepStrictEqual(calls.order, [
    ['posted_date', { ascending: false }],
  ]);
  assert.deepStrictEqual(notices, [
    {
      id: 'notice-1',
      title: 'Spring Semester Registration',
      body: 'Registration opens next week.',
      postedDate: '2026-03-01',
      category: null,
      priority: 'NORMAL',
      deadline: null,
      targetMajors: [],
      targetNationalities: [],
      minYear: null,
      maxYear: null,
      tags: ['Spring Semester Registration'],
      languages: ['en'],
    },
  ]);
}

async function testThrowsSupabaseErrors() {
  const supabaseError = new Error('Notice query failed');
  const { repository } = loadRepositoryWithSupabase({
    data: null,
    error: supabaseError,
  });

  await assert.rejects(
    () => repository.fetchNormalizedNotices(),
    supabaseError
  );
}

(async () => {
  await testFetchesAndNormalizesNotices();
  await testThrowsSupabaseErrors();
  console.log('PASS');
})();
