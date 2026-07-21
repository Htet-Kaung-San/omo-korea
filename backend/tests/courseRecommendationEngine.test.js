const { recommendCourses } = require('../ai/courseRecommendationEngine');

function createCourse(overrides = {}) {
  return {
    id: 'course-1',
    title: 'Introduction to Programming',
    name: 'Introduction to Programming',
    nameEn: 'Introduction to Programming',
    nameKo: '프로그래밍입문',
    majorId: '10',
    type: 'ELECTIVE',
    category: 'ELECTIVE',
    credits: 3,
    department: 'Computer Science',
    year: null,
    description: '',
    tags: [],
    raw: {},
    ...overrides,
  };
}

describe('courseRecommendationEngine', () => {
  test('returns same-major courses before different-major courses', () => {
    const student = {
      majorId: 10,
      major: 'Computer Science',
    };

    const sameMajor = createCourse({
      id: 'same-major',
      majorId: '10',
      type: 'ELECTIVE',
    });

    const differentMajor = createCourse({
      id: 'different-major',
      majorId: '20',
      department: 'Business Administration',
      type: 'ELECTIVE',
    });

    const result = recommendCourses(student, [differentMajor, sameMajor]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('same-major');
    expect(result[0].score).toBe(50);
  });

  test('ranks required same-major courses above elective same-major courses', () => {
    const student = {
      majorId: 10,
      major: 'Computer Science',
    };

    const elective = createCourse({
      id: 'elective',
      type: 'ELECTIVE',
      category: 'ELECTIVE',
    });

    const required = createCourse({
      id: 'required',
      type: 'REQUIRED',
      category: 'REQUIRED',
    });

    const result = recommendCourses(student, [elective, required]);

    expect(result.map((course) => course.id)).toEqual([
      'required',
      'elective',
    ]);
    expect(result[0].score).toBe(60);
    expect(result[1].score).toBe(50);
  });

  test('excludes a completed course by course ID', () => {
    const student = {
      majorId: 10,
    };

    const completed = createCourse({
      id: 'CS101',
    });

    const available = createCourse({
      id: 'CS102',
      title: 'Data Structures',
      nameEn: 'Data Structures',
      nameKo: '자료구조',
    });

    const result = recommendCourses(student, [completed, available], {
      completedCourseIds: ['CS101'],
    });

    expect(result.map((course) => course.id)).toEqual(['CS102']);
  });

  test('excludes a completed course by Korean course name', () => {
    const student = {
      majorId: 10,
    };

    const completed = createCourse({
      id: 'CS101',
      title: 'Introduction to Programming',
      nameKo: '프로그래밍입문',
      raw: {
        course_name: '프로그래밍입문',
      },
    });

    const available = createCourse({
      id: 'CS102',
      title: 'Data Structures',
      nameEn: 'Data Structures',
      nameKo: '자료구조',
    });

    const result = recommendCourses(student, [completed, available], {
      completedCourseIds: ['프로그래밍입문'],
    });

    expect(result.map((course) => course.id)).toEqual(['CS102']);
  });

  test('matches completed course names case-insensitively', () => {
    const student = {
      majorId: 10,
    };

    const completed = createCourse({
      id: 'CS101',
      title: 'Introduction to Programming',
      nameEn: 'Introduction to Programming',
    });

    const available = createCourse({
      id: 'CS102',
      title: 'Data Structures',
      name: 'Data Structures',
      nameEn: 'Data Structures',
      nameKo: '자료구조',
    });

    const result = recommendCourses(student, [completed, available], {
      completedCourseIds: ['introduction to programming'],
    });

    expect(result.map((course) => course.id)).toEqual(['CS102']);
  });

  test('adds a year-match score only when explicit student year matches', () => {
    const student = {
      majorId: 10,
      year: 2,
    };

    const matchingYear = createCourse({
      id: 'year-2',
      year: 2,
    });

    const differentYear = createCourse({
      id: 'year-3',
      year: 3,
    });

    const result = recommendCourses(student, [
      differentYear,
      matchingYear,
    ]);

    expect(result[0].id).toBe('year-2');
    expect(result[0].score).toBe(68);
    expect(result[1].score).toBe(50);
  });

  test('does not infer academic year from student ID', () => {
    const student = {
      majorId: 10,
      studentId: '20230001',
    };

    const course = createCourse({
      id: 'year-course',
      year: 4,
    });

    const result = recommendCourses(student, [course]);

    expect(result[0].score).toBe(50);
    expect(result[0].matchHint).not.toContain(
      'Recommended for your academic year'
    );
  });

  test('handles missing MBTI without throwing an error', () => {
    const student = {
      majorId: 10,
      mbti: null,
    };

    const course = createCourse();

    expect(() => recommendCourses(student, [course])).not.toThrow();
  });

  test('adds only a limited MBTI bonus', () => {
    const student = {
      majorId: 10,
      mbti: 'INTJ',
    };

    const course = createCourse({
      description:
        'AI programming, data analysis, research, theory and structured planning',
      tags: ['ai', 'programming', 'analysis'],
    });

    const result = recommendCourses(student, [course]);

    expect(result[0].score).toBeLessThanOrEqual(56);
    expect(result[0].matchHint).toContain('Matches MBTI learning style');
  });

  test('filters by requested course type', () => {
    const student = {
      majorId: 10,
    };

    const required = createCourse({
      id: 'required',
      type: 'REQUIRED',
      category: 'REQUIRED',
    });

    const elective = createCourse({
      id: 'elective',
      type: 'ELECTIVE',
      category: 'ELECTIVE',
    });

    const result = recommendCourses(student, [required, elective], {
      type: 'REQUIRED',
    });

    expect(result.map((course) => course.id)).toEqual(['required']);
  });

  test('uses general education courses as fallback when no course reaches the match threshold', () => {
    const student = {
      majorId: 10,
    };

    const genEd = createCourse({
      id: 'gen-ed',
      majorId: '99',
      department: 'General Education',
      type: 'GEN_ED',
      category: 'GEN_ED',
    });

    const unrelatedElective = createCourse({
      id: 'other-elective',
      majorId: '99',
      department: 'Business Administration',
      type: 'ELECTIVE',
      category: 'ELECTIVE',
    });

    const result = recommendCourses(student, [
      unrelatedElective,
      genEd,
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('gen-ed');
    expect(result[0].score).toBe(15);
  });

  test('returns an empty array when no matching or fallback course exists', () => {
    const student = {
      majorId: 10,
    };

    const unrelatedCourse = createCourse({
      id: 'unrelated',
      majorId: '99',
      department: 'Business Administration',
      type: 'ELECTIVE',
      category: 'ELECTIVE',
    });

    const result = recommendCourses(student, [unrelatedCourse]);

    expect(result).toEqual([]);
  });

  test('respects the recommendation limit', () => {
    const student = {
      majorId: 10,
    };

    const courses = [
      createCourse({ id: 'course-1', type: 'REQUIRED', category: 'REQUIRED' }),
      createCourse({ id: 'course-2' }),
      createCourse({ id: 'course-3' }),
    ];

    const result = recommendCourses(student, courses, {
      limit: 2,
    });

    expect(result).toHaveLength(2);
  });
});
