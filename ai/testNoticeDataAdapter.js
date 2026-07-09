const assert = require('assert');
const { normalizeNoticeRow } = require('./noticeDataAdapter');

const dbRow = {
  notice_id: 'notice-1',
  title: 'Spring Semester Registration',
  content: 'Registration opens next week.',
  language: 'en',
  posted_date: '2026-03-01',
};

assert.deepStrictEqual(normalizeNoticeRow(dbRow), {
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
  tags: [],
  languages: ['en'],
});

assert.deepStrictEqual(
  normalizeNoticeRow({
    notice_id: 'notice-2',
    title: 'No Language Notice',
    content: 'No language set.',
    posted_date: '2026-03-02',
  }).languages,
  []
);

assert.deepStrictEqual(
  normalizeNoticeRow(dbRow, { includeTitleTag: true }).tags,
  ['Spring Semester Registration']
);

assert.strictEqual(normalizeNoticeRow(null), null);
assert.strictEqual(normalizeNoticeRow([]), null);
assert.strictEqual(normalizeNoticeRow('notice'), null);

const defaults = normalizeNoticeRow({
  notice_id: 'notice-3',
  title: 'Defaults Notice',
  content: 'Only DB fields are present.',
  posted_date: '2026-03-03',
});

assert.strictEqual(defaults.category, null);
assert.strictEqual(defaults.priority, 'NORMAL');
assert.strictEqual(defaults.deadline, null);
assert.deepStrictEqual(defaults.targetMajors, []);
assert.deepStrictEqual(defaults.targetNationalities, []);
assert.strictEqual(defaults.minYear, null);
assert.strictEqual(defaults.maxYear, null);
assert.deepStrictEqual(defaults.tags, []);

console.log('PASS');
