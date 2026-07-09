const assert = require('assert');
const { normalizeJobPostingRow } = require('./jobPostingDataAdapter');

const dbRow = {
  job_id: 'job-1',
  title: 'Frontend Intern',
  company: 'PNU Startup Lab',
  type: 'internship',
  deadline: '2026-08-31',
};

assert.deepStrictEqual(normalizeJobPostingRow(dbRow), {
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
});

const normalized = normalizeJobPostingRow(dbRow);
assert.deepStrictEqual(normalized.academicAreas, []);
assert.deepStrictEqual(normalized.activities, []);
assert.deepStrictEqual(normalized.strengths, []);
assert.deepStrictEqual(normalized.careerAreas, []);
assert.deepStrictEqual(normalized.learningStyles, []);
assert.deepStrictEqual(normalized.interests, []);
assert.deepStrictEqual(normalized.languages, []);
assert.strictEqual(normalized.description, null);

assert.deepStrictEqual(
  normalizeJobPostingRow(dbRow, { includeTypeAsInterest: true }).interests,
  ['internship']
);

assert.strictEqual(normalizeJobPostingRow(null), null);

console.log('PASS');
