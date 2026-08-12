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
    expect(result[1].score).toBe(60);
    expect(result[1].matchHint).toContain('nearby year level');
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

  test('prefers the same year over an adjacent year without excluding higher-year courses', () => {
    const student = { majorId: 10, year: 2 };
    const result = recommendCourses(student, [
      createCourse({ id: 'year-3', year: 3 }),
      createCourse({ id: 'year-2', year: 2 }),
    ]);
    expect(result.map((course) => course.id)).toEqual(['year-2', 'year-3']);
    expect(result[1].score).toBeGreaterThan(50);
  });

  test('gives a related AI course a completed-history bonus', () => {
    const candidate = createCourse({ id: 'ml', name: 'Machine Learning', nameEn: 'Machine Learning', nameKo: '머신러닝', title: 'Machine Learning' });
    const baseline = recommendCourses({ majorId: 10 }, [candidate])[0];
    const related = recommendCourses({ majorId: 10 }, [candidate], {
      completedCourseIds: ['AI Programming'],
    })[0];
    expect(related.score).toBeGreaterThan(baseline.score);
    expect(related.matchHint).toContain('AI Programming, which you previously completed');
  });

  test('gives data/database continuation a history bonus', () => {
    const candidate = createCourse({ id: 'mining', name: 'Data Mining', nameEn: 'Data Mining', nameKo: '데이터마이닝', title: 'Data Mining' });
    const baseline = recommendCourses({ majorId: 10 }, [candidate])[0];
    const related = recommendCourses({ majorId: 10 }, [candidate], {
      completedCourseIds: ['Database Systems'],
    })[0];
    expect(related.score).toBeGreaterThan(baseline.score);
  });

  test('does not give an unrelated completed course a similarity bonus or reason', () => {
    const candidate = createCourse({ id: 'ml', name: 'Machine Learning', nameEn: 'Machine Learning', nameKo: '머신러닝', title: 'Machine Learning' });
    const baseline = recommendCourses({ majorId: 10 }, [candidate])[0];
    const unrelated = recommendCourses({ majorId: 10 }, [candidate], {
      completedCourseIds: ['Korean Literature'],
    })[0];
    expect(unrelated.score).toBe(baseline.score);
    expect(unrelated.matchHint).not.toContain('previously completed');
  });

  test('weights a recent related completion at least as strongly as an old one', () => {
    const candidate = createCourse({ id: 'ml', name: 'Machine Learning', nameEn: 'Machine Learning', nameKo: '머신러닝', title: 'Machine Learning' });
    const recent = recommendCourses({ majorId: 10 }, [candidate], {
      enrollmentHistory: [
        { nameEn: 'AI Programming', status: 'Completed', semester: '2025-Fall' },
        { nameEn: 'Korean Literature', status: 'Completed', semester: '2021-Spring' },
      ],
    })[0];
    const old = recommendCourses({ majorId: 10 }, [candidate], {
      enrollmentHistory: [
        { nameEn: 'AI Programming', status: 'Completed', semester: '2021-Spring' },
        { nameEn: 'Korean Literature', status: 'Completed', semester: '2025-Fall' },
      ],
    })[0];
    expect(recent.score).toBeGreaterThanOrEqual(old.score);
  });

  test('matches Korean completed-course topics to an English candidate', () => {
    const candidate = createCourse({ id: 'ml', name: 'Machine Learning', nameEn: 'Machine Learning', nameKo: '머신러닝', title: 'Machine Learning' });
    const result = recommendCourses({ majorId: 10 }, [candidate], {
      enrollmentHistory: [
        { nameKo: '인공지능개론', status: 'Completed', semester: '2025-Fall' },
      ],
    });
    expect(result[0].score).toBeGreaterThan(50);
    expect(result[0].matchHint).toContain('previously completed');
  });

  test('excludes currently enrolled courses separately from completed courses', () => {
    const result = recommendCourses({ majorId: 10 }, [
      createCourse({ id: 'current' }),
      createCourse({ id: 'available', name: 'Machine Learning', nameEn: 'Machine Learning', nameKo: '머신러닝', title: 'Machine Learning' }),
    ], {
      enrollmentHistory: [{ courseId: 'current', status: 'In Progress', semester: '2026-Fall' }],
    });
    expect(result.map((course) => course.id)).toEqual(['available']);
  });

  test('excludes completed enrollment history but does not treat unknown status as ineligible', () => {
    const result = recommendCourses({ majorId: 10 }, [
      createCourse({ id: 'completed', name: 'AI Programming', nameEn: 'AI Programming', nameKo: 'AI프로그래밍', title: 'AI Programming' }),
      createCourse({ id: 'unknown', name: 'Machine Learning', nameEn: 'Machine Learning', nameKo: '머신러닝', title: 'Machine Learning' }),
    ], {
      enrollmentHistory: [
        { courseId: 'completed', status: 'Completed', semester: '2025-Fall' },
        { courseId: 'unknown', status: null, semester: null },
      ],
    });
    expect(result.map((course) => course.id)).toEqual(['unknown']);
  });

  test('preserves major and interest influence', () => {
    const result = recommendCourses({ majorId: 10, interests: ['AI'] }, [
      createCourse({ id: 'major-ai', name: 'Machine Learning', nameEn: 'Machine Learning', nameKo: '머신러닝', title: 'Machine Learning' }),
      createCourse({ id: 'other-ai', majorId: '20', department: 'Business', name: 'Machine Learning', nameEn: 'Machine Learning', nameKo: '머신러닝', title: 'Machine Learning' }),
    ]);
    expect(result[0].id).toBe('major-ai');
    expect(result[0].matchHint).toContain('AI / Machine Learning interest');
  });

  test('ignores presentation, group-project, and assignment metadata in scoring', () => {
    const base = createCourse({ id: 'a', name: 'Machine Learning', nameEn: 'Machine Learning', nameKo: '머신러닝', title: 'Machine Learning' });
    const enriched = { ...base, id: 'b', presentationRequirement: 'REQUIRED', groupProjectRequirement: 'REQUIRED', assignmentRequirement: 'REQUIRED' };
    const result = recommendCourses({ majorId: 10 }, [base, enriched]);
    expect(result[0].score).toBe(result[1].score);
  });

  test('does not fabricate history or interest reasons', () => {
    const result = recommendCourses({ majorId: 10, interests: ['Web'] }, [
      createCourse({ id: 'db', name: 'Databases', nameEn: 'Databases', nameKo: '데이터베이스', title: 'Databases' }),
    ]);
    expect(result[0].matchHint).not.toContain('Web interest');
    expect(result[0].matchHint).not.toContain('previously completed');
  });

  test('returns deterministic ordering for the same inputs', () => {
    const courses = [
      createCourse({ id: 'b', nameEn: 'Same Name', title: 'Same Name' }),
      createCourse({ id: 'a', nameEn: 'Same Name', title: 'Same Name' }),
    ];
    const first = recommendCourses({ majorId: 10 }, courses).map((course) => course.id);
    const second = recommendCourses({ majorId: 10 }, [...courses].reverse()).map((course) => course.id);
    expect(first).toEqual(['a', 'b']);
    expect(second).toEqual(first);
  });
});
