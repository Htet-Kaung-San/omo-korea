const assert = require('assert');

const servicePath = require.resolve('./intelligentSearchService');
const supabaseClientPath = require.resolve('../supabaseClient');

const tableCalls = [];
const queryCalls = [];
const failedTables = new Set();
const thrownTables = new Set();

const expectedSelectByTable = {
  kb_document: 'title, content, category, target_country, target_gender',
  notice: 'title, content, language, posted_date',
  scholarship: 'scholarship_id, name, type, description, deadline, amount',
  course: 'course_id, course_name, credit, major_id, category',
  major: 'major_id, major_name, department',
  job_posting: 'job_id, title, company, type, deadline',
};

const allowedFilterFieldsByTable = {
  kb_document: ['title', 'content', 'category', 'target_country', 'target_gender'],
  notice: ['title', 'content', 'language'],
  scholarship: ['name', 'type', 'description'],
  course: ['course_name', 'category'],
  major: ['major_name', 'department'],
  job_posting: ['title', 'company', 'type'],
};

const disallowedFilterFieldsByTable = {
  kb_document: [],
  notice: ['posted_date'],
  scholarship: ['scholarship_id', 'deadline', 'amount'],
  course: ['course_id', 'credit', 'major_id'],
  major: ['major_id'],
  job_posting: ['job_id', 'deadline'],
};

const rowsByTable = {
  kb_document: [
    {
      title: 'Visa Extension Guide',
      content: 'General immigration steps for international students.',
      category: 'Immigration',
      target_country: 'All',
      target_gender: 'All',
    },
    {
      title: 'Dormitory Rules',
      content: 'Visa documents may be requested during residence checks.',
      category: 'Housing',
      target_country: 'All',
      target_gender: 'All',
    },
  ],
  notice: [
    {
      title: 'Visa Session Notice',
      content: 'Attend the information session.',
      language: 'English',
      posted_date: '2026-07-01',
    },
  ],
  scholarship: [
    {
      scholarship_id: 'SCH-1',
      name: 'Global Scholarship',
      type: 'Merit',
      description: 'Support for visa and settlement costs.',
      deadline: '2026-08-01',
      amount: '500000',
    },
  ],
  course: [
    {
      course_id: 'CSE101',
      course_name: 'Intro to Visa Data',
      credit: 3,
      major_id: 1,
      category: 'Major',
    },
  ],
  major: [
    {
      major_id: 1,
      major_name: 'International Visa Studies',
      department: 'Global Affairs',
    },
  ],
  job_posting: [
    {
      job_id: 'JOB-1',
      title: 'Visa Support Assistant',
      company: 'Global Campus Office',
      type: 'Part-time',
      deadline: '2026-09-01',
    },
  ],
};

const supabase = {
  from(tableName) {
    tableCalls.push(tableName);

    return {
      select(columns) {
        return {
          or(filter) {
            return {
              async limit(limitValue) {
                queryCalls.push({
                  tableName,
                  columns,
                  filter,
                  limitValue,
                });

                if (thrownTables.has(tableName)) {
                  throw new Error(`${tableName} exploded`);
                }

                if (failedTables.has(tableName)) {
                  return {
                    data: null,
                    error: new Error(`${tableName} failed`),
                  };
                }

                return {
                  data: rowsByTable[tableName] || [],
                  error: null,
                  columns,
                  filter,
                  limitValue,
                };
              },
            };
          },
        };
      },
    };
  },
};

delete require.cache[servicePath];
require.cache[supabaseClientPath] = {
  id: supabaseClientPath,
  filename: supabaseClientPath,
  loaded: true,
  exports: supabase,
};

const { searchUniversityInformation } = require('./intelligentSearchService');

function resetCalls() {
  tableCalls.length = 0;
  queryCalls.length = 0;
  failedTables.clear();
  thrownTables.clear();
}

function assertEmptyGroups(response) {
  assert.deepStrictEqual(response.results, {
    knowledgeBase: [],
    notices: [],
    scholarships: [],
    courses: [],
    majors: [],
    jobPostings: [],
  });
}

async function testValidQuerySearchesAllTables() {
  resetCalls();

  const response = await searchUniversityInformation('visa');

  assert.deepStrictEqual(tableCalls.sort(), [
    'course',
    'job_posting',
    'kb_document',
    'major',
    'notice',
    'scholarship',
  ]);
  assert.strictEqual(response.query, 'visa');
  assert.deepStrictEqual(response.errors, []);
}

function getQueryCall(tableName) {
  return queryCalls.find((call) => call.tableName === tableName);
}

function assertQueryShape(tableName) {
  const call = getQueryCall(tableName);
  assert.ok(call, `Expected query call for ${tableName}`);
  assert.strictEqual(call.columns, expectedSelectByTable[tableName]);
  assert.strictEqual(call.limitValue, 15);

  for (const field of allowedFilterFieldsByTable[tableName]) {
    assert.ok(
      call.filter.includes(`${field}.ilike.%visa%`),
      `Expected ${tableName} filter to include ${field}`
    );
  }

  for (const field of disallowedFilterFieldsByTable[tableName]) {
    assert.ok(
      !call.filter.includes(`${field}.ilike.`),
      `Expected ${tableName} filter not to include ${field}`
    );
  }
}

async function testSelectsFiltersAndDefaultLimits() {
  resetCalls();

  await searchUniversityInformation('visa');

  assert.strictEqual(queryCalls.length, 6);
  for (const tableName of Object.keys(expectedSelectByTable)) {
    assertQueryShape(tableName);
  }
}

async function testGroupedResponseShapeAndScoring() {
  resetCalls();

  const response = await searchUniversityInformation('visa');

  assert.strictEqual(response.results.knowledgeBase[0].sourceType, 'knowledge_base');
  assert.strictEqual(response.results.knowledgeBase[0].title, 'Visa Extension Guide');
  assert.strictEqual(response.results.knowledgeBase[0].metadata.category, 'Immigration');
  assert.strictEqual(response.results.notices[0].sourceType, 'notice');
  assert.strictEqual(response.results.scholarships[0].id, 'SCH-1');
  assert.strictEqual(response.results.courses[0].id, 'CSE101');
  assert.strictEqual(response.results.majors[0].id, '1');
  assert.strictEqual(response.results.jobPostings[0].sourceType, 'job_posting');
  assert.strictEqual(response.results.jobPostings[0].id, 'JOB-1');
  assert.strictEqual(response.results.jobPostings[0].title, 'Visa Support Assistant');
  assert.strictEqual(response.results.jobPostings[0].metadata.company, 'Global Campus Office');
  assert.ok(response.results.knowledgeBase[0].score > response.results.knowledgeBase[1].score);
  assert.strictEqual(response.results.knowledgeBase[1].title, 'Dormitory Rules');
}

async function testPartialFailureKeepsSuccessfulResults() {
  resetCalls();
  failedTables.add('notice');

  const response = await searchUniversityInformation('visa');

  assert.deepStrictEqual(response.results.notices, []);
  assert.strictEqual(response.errors.length, 1);
  assert.strictEqual(response.errors[0].table, 'notice');
  assert.strictEqual(response.results.knowledgeBase.length, 2);
  assert.strictEqual(response.results.scholarships.length, 1);
}

async function testJobPostingFailureKeepsSuccessfulResults() {
  resetCalls();
  failedTables.add('job_posting');

  const response = await searchUniversityInformation('visa');

  assert.deepStrictEqual(response.results.jobPostings, []);
  assert.strictEqual(response.errors.length, 1);
  assert.strictEqual(response.errors[0].table, 'job_posting');
  assert.strictEqual(response.errors[0].sourceType, 'job_posting');
  assert.strictEqual(response.results.knowledgeBase.length, 2);
  assert.strictEqual(response.results.scholarships.length, 1);
  assert.strictEqual(response.results.courses.length, 1);
}

async function testThrownTableFailureKeepsSuccessfulResults() {
  resetCalls();
  thrownTables.add('course');

  let response = null;
  await assert.doesNotReject(async () => {
    response = await searchUniversityInformation('visa');
  });

  assert.deepStrictEqual(response.results.courses, []);
  assert.strictEqual(response.errors.length, 1);
  assert.strictEqual(response.errors[0].table, 'course');
  assert.strictEqual(response.errors[0].sourceType, 'course');
  assert.match(response.errors[0].message, /exploded/);
  assert.strictEqual(response.results.knowledgeBase.length, 2);
  assert.strictEqual(response.results.majors.length, 1);
}

async function testInvalidQueriesDoNotQuerySupabase() {
  resetCalls();

  const shortResponse = await searchUniversityInformation(' v ');
  assert.strictEqual(shortResponse.query, 'v');
  assertEmptyGroups(shortResponse);
  assert.deepStrictEqual(shortResponse.errors, []);
  assert.deepStrictEqual(tableCalls, []);

  const missingResponse = await searchUniversityInformation(null);
  assert.strictEqual(missingResponse.query, '');
  assertEmptyGroups(missingResponse);
  assert.deepStrictEqual(missingResponse.errors, []);
  assert.deepStrictEqual(tableCalls, []);
}

(async () => {
  await testValidQuerySearchesAllTables();
  await testSelectsFiltersAndDefaultLimits();
  await testGroupedResponseShapeAndScoring();
  await testPartialFailureKeepsSuccessfulResults();
  await testJobPostingFailureKeepsSuccessfulResults();
  await testThrownTableFailureKeepsSuccessfulResults();
  await testInvalidQueriesDoNotQuerySupabase();
  console.log('PASS');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
