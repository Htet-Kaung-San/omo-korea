const assert = require('assert');

const controllerPath = require.resolve('./searchController');
const searchServicePath = require.resolve('../services/intelligentSearchService');

const sentinelResult = {
  query: 'scholarship',
  results: {
    knowledgeBase: [],
    notices: [],
    scholarships: [{ id: 'sentinel' }],
    courses: [],
    majors: [],
  },
  errors: [],
};
const serviceError = new Error('Search failed');

let serviceCalls = [];
let shouldThrow = false;

delete require.cache[controllerPath];
require.cache[searchServicePath] = {
  id: searchServicePath,
  filename: searchServicePath,
  loaded: true,
  exports: {
    async searchUniversityInformation(query, options) {
      serviceCalls.push([query, options]);
      if (shouldThrow) {
        throw serviceError;
      }

      return sentinelResult;
    },
  },
};

const {
  searchUniversityInformationController,
} = require('./searchController');

function resetService() {
  serviceCalls = [];
  shouldThrow = false;
}

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function testInvalidQuery() {
  resetService();

  const req = {
    body: {
      query: 'a',
    },
  };
  const res = createResponse();
  const nextCalls = [];

  await searchUniversityInformationController(req, res, (error) => {
    nextCalls.push(error);
  });

  assert.deepStrictEqual(serviceCalls, []);
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.body, {
    success: false,
    message: 'Query must contain at least 2 characters.',
  });
  assert.deepStrictEqual(nextCalls, []);
}

async function testValidQuery() {
  resetService();

  const req = {
    body: {
      query: 'scholarship',
      limitPerSource: 3,
    },
  };
  const res = createResponse();
  const nextCalls = [];

  await searchUniversityInformationController(req, res, (error) => {
    nextCalls.push(error);
  });

  assert.deepStrictEqual(serviceCalls, [
    ['scholarship', { limitPerSource: 3 }],
  ]);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body, {
    success: true,
    data: sentinelResult,
  });
  assert.deepStrictEqual(nextCalls, []);
}

async function testServiceError() {
  resetService();
  shouldThrow = true;

  const req = {
    body: {
      query: 'scholarship',
      limitPerSource: 3,
    },
  };
  const res = createResponse();
  const nextCalls = [];

  await searchUniversityInformationController(req, res, (error) => {
    nextCalls.push(error);
  });

  assert.deepStrictEqual(serviceCalls, [
    ['scholarship', { limitPerSource: 3 }],
  ]);
  assert.strictEqual(nextCalls.length, 1);
  assert.strictEqual(nextCalls[0], serviceError);
}

(async () => {
  await testInvalidQuery();
  await testValidQuery();
  await testServiceError();
  console.log('PASS');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
