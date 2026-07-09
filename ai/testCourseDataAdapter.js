const assert = require('assert');
const { normalizeCourseRow } = require('./courseDataAdapter');

const dbCourseRow = {
  course_id: 'CSE101',
  course_name: 'Introduction to AI',
  credit: 3,
  major_id: 12,
  category: 'REQUIRED',
};

assert.deepStrictEqual(normalizeCourseRow(dbCourseRow), {
  id: 'CSE101',
  nameKo: 'Introduction to AI',
  nameEn: 'Introduction to AI',
  type: 'REQUIRED',
  credits: 3,
  department: '12',
  tags: [],
  prerequisites: [],
});

assert.strictEqual(
  normalizeCourseRow({ ...dbCourseRow, category: '전공필수' }).type,
  'REQUIRED'
);
assert.strictEqual(
  normalizeCourseRow({ ...dbCourseRow, category: '전공선택' }).type,
  'ELECTIVE'
);
assert.strictEqual(
  normalizeCourseRow({ ...dbCourseRow, category: '교양' }).type,
  'GEN_ED'
);

assert.strictEqual(
  normalizeCourseRow({ ...dbCourseRow, category: undefined }).type,
  'ELECTIVE'
);

assert.strictEqual(
  normalizeCourseRow(dbCourseRow, { majorName: 'AI Engineering' }).department,
  'AI Engineering'
);

assert.strictEqual(
  normalizeCourseRow({
    ...dbCourseRow,
    major_id: 99,
    major: {
      major_name: 'Computer Engineering',
    },
  }).department,
  'Computer Engineering'
);

assert.deepStrictEqual(
  normalizeCourseRow(dbCourseRow, { includeCategoryTag: true }).tags,
  ['REQUIRED']
);

assert.strictEqual(normalizeCourseRow(null), null);
assert.deepStrictEqual(normalizeCourseRow(dbCourseRow).prerequisites, []);

console.log('PASS');
