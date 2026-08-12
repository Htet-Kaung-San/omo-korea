const { recommendCourses } = require('../ai/courseRecommendationEngine');

// Mirrors the live catalog: names are bilingual, 'English (한국어)'.
const CATALOG = [
  { course_id: 1, majorId: 8, name: 'Computer Architecture (컴퓨터구조)', type: 'REQUIRED', year: 3 },
  { course_id: 2, majorId: 8, name: 'Operating Systems (운영체제)', type: 'REQUIRED', year: 3 },
  { course_id: 3, majorId: 8, name: 'Probabilities and Statistics (확률통계)', type: 'REQUIRED', year: 3 },
  { course_id: 4, majorId: 8, name: 'Data Structures (자료구조)', type: 'REQUIRED', year: 2 },
  { course_id: 5, majorId: 8, name: 'Data Mining (데이터마이닝)', type: 'ELECTIVE', year: 3 },
  { course_id: 6, majorId: 8, name: 'Discrete Mathematics (I) (이산수학(I))', type: 'REQUIRED', year: 1 },
  { course_id: 7, majorId: 8, name: 'Discrete Mathematics (II) (이산수학(II))', type: 'REQUIRED', year: 2 },
];

const STUDENT = { student_id: 202612345, major_id: 8, majorId: 8, year: 3 };

function titles(student, completedCourseIds) {
  return recommendCourses(STUDENT, CATALOG, { completedCourseIds, limit: 20 })
    .map((course) => course.name);
}

describe('excluding courses the student has already completed', () => {
  test('matches a plain English name against a bilingual catalog name', () => {
    // student.completed_courses is free text a human typed — no Korean suffix.
    const result = titles(STUDENT, ['Computer Architecture', 'Operating Systems']);

    expect(result).not.toContain('Computer Architecture (컴퓨터구조)');
    expect(result).not.toContain('Operating Systems (운영체제)');
    expect(result).toContain('Data Mining (데이터마이닝)');
  });

  test('tolerates singular/plural drift between the two sources', () => {
    const result = titles(STUDENT, ['Probability and Statistics', 'Data Structure']);

    expect(result).not.toContain('Probabilities and Statistics (확률통계)');
    expect(result).not.toContain('Data Structures (자료구조)');
  });

  test('does NOT treat numbered variants as the same course', () => {
    // Passing (I) says nothing about (II); over-excluding would hide a course
    // the student still needs.
    const result = titles(STUDENT, ['Discrete Mathematics (I)']);

    expect(result).not.toContain('Discrete Mathematics (I) (이산수학(I))');
    expect(result).toContain('Discrete Mathematics (II) (이산수학(II))');
  });

  test('folds roman numerals to digits so (I) and 1 agree', () => {
    const result = titles(STUDENT, ['Discrete Mathematics 1']);

    expect(result).not.toContain('Discrete Mathematics (I) (이산수학(I))');
    expect(result).toContain('Discrete Mathematics (II) (이산수학(II))');
  });

  test('an empty history excludes nothing', () => {
    expect(titles(STUDENT, [])).toHaveLength(CATALOG.length);
  });

  test('an unrelated completed course excludes nothing', () => {
    const result = titles(STUDENT, ['Korean Language 1']);
    expect(result).toHaveLength(CATALOG.length);
  });
});
