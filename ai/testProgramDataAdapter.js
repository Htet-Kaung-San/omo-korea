const assert = require('assert');
const { normalizeProgramRow } = require('./programDataAdapter');

const dbRow = {
  program_id: 'program-1',
  name: 'AI Career Mentoring',
  category: 'career',
  deadline: '2026-09-30',
};

assert.deepStrictEqual(normalizeProgramRow(dbRow), {
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
});

assert.deepStrictEqual(
  normalizeProgramRow(dbRow, { includeTitleTag: true }).tags,
  ['career', 'AI Career Mentoring']
);

assert.deepStrictEqual(
  normalizeProgramRow({
    program_id: 'program-2',
    name: 'Student Workshop',
    deadline: '2026-10-15',
  }).tags,
  []
);

assert.strictEqual(normalizeProgramRow(null), null);
assert.strictEqual(normalizeProgramRow(['program-1']), null);

const defaults = normalizeProgramRow({
  program_id: 'program-3',
  name: 'Default Fields Program',
  deadline: '2026-11-01',
});

assert.strictEqual(defaults.description, null);
assert.deepStrictEqual(defaults.tags, []);
assert.deepStrictEqual(defaults.careerTags, []);
assert.deepStrictEqual(defaults.eligibleMajors, []);
assert.deepStrictEqual(defaults.languages, []);
assert.strictEqual(defaults.minYear, null);
assert.strictEqual(defaults.maxYear, null);

console.log('PASS');
