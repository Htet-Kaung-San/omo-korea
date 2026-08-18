const {
  filterCourses,
  filterCoursesByOffering,
  mapOffering,
} = require('../services/courseCatalogService');
const {
  attachCourseCurriculum,
  chooseCurriculumRow,
} = require('../ai/supabaseDataRepository');

function course(overrides = {}) {
  return {
    id: '10',
    nameKo: '경영학원론',
    nameEn: 'Principles of Management',
    title: 'Principles of Management',
    officialCourseNumber: 'EC1500015',
    majorId: '73',
    department: 'Business Administration',
    type: 'REQUIRED',
    year: 1,
    curriculumYears: [2024, 2026],
    curriculum: { sourceCourseCode: 'DB1600346' },
    ...overrides,
  };
}

describe('course catalog curriculum mapping', () => {
  test('chooses exact curriculum year, then latest earlier reviewed year', () => {
    const rows = [
      { curriculum_year: 2023 },
      { curriculum_year: 2024 },
      { curriculum_year: 2026 },
    ];
    expect(chooseCurriculumRow(rows, 2024).curriculum_year).toBe(2024);
    expect(chooseCurriculumRow(rows, 2025).curriculum_year).toBe(2024);
  });

  test('overlays major-specific curriculum category, year, and source code', () => {
    const attached = attachCourseCurriculum([course({ type: 'ELECTIVE', year: 4 })], [{
      course_id: 10,
      curriculum_year: 2026,
      source_course_code: 'DB1600346',
      category: 'REQUIRED',
      recommended_year: 1,
      grade_semester: '1-1',
    }], { curriculumYear: 2026 });
    expect(attached[0]).toMatchObject({
      type: 'REQUIRED',
      year: 1,
      curriculumYears: [2026],
      curriculum: {
        curriculumYear: 2026,
        sourceCourseCode: 'DB1600346',
        gradeSemester: '1-1',
      },
    });
  });

  test('filters by name/code, major, category, year, and curriculum year', () => {
    const rows = [
      course(),
      course({
        id: '11',
        nameKo: '마케팅관리',
        nameEn: 'Marketing Management',
        officialCourseNumber: 'DB2000353',
        type: 'ELECTIVE',
        year: 2,
      }),
    ];
    expect(filterCourses(rows, {
      search: 'DB1600346',
      majorId: 73,
      category: 'REQUIRED',
      recommendedYear: 1,
      curriculumYear: 2026,
    })).toEqual([rows[0]]);
  });

  test('filters one exact course for the shared detail page', () => {
    const rows = [course(), course({ id: '11', nameEn: 'Marketing Management' })];
    expect(filterCourses(rows, { courseId: '11' })).toEqual([rows[1]]);
  });

  test('filters the complete catalog to courses with an official term offering', () => {
    const rows = [course(), course({ id: '11', nameEn: 'Marketing Management' })];
    expect(filterCoursesByOffering(rows, [{ course_id: 11 }], true)).toEqual([rows[1]]);
    expect(filterCoursesByOffering(rows, [{ course_id: 11 }], false)).toEqual(rows);
  });

  test('preserves verified offering capacity, remarks, and restrictions', () => {
    const offering = mapOffering({
      course_offering_id: 44,
      academic_year: 2026,
      semester: '2',
      enrollment_limit: 40,
      team_teaching_status: 'TEAM_TAUGHT',
      general_education_area: null,
      remarks: 'International students may request permission.',
      schedule: null,
    }, null, [{
      course_offering_restriction_id: 7,
      source_kind: 'RESTRICTION',
      permission: 'PROHIBITED',
      department_condition: 'Other departments',
    }]);
    expect(offering).toMatchObject({
      enrollmentLimit: 40,
      teamTeachingStatus: 'TEAM_TAUGHT',
      remarks: 'International students may request permission.',
      restrictions: [{ id: 7, permission: 'PROHIBITED', departmentCondition: 'Other departments' }],
    });
  });
});
