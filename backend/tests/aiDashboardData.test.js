const {
  fetchAllCourses,
  fetchDashboardCatalogs,
} = require('../ai/supabaseDataRepository');

function createSupabaseStub(rows, errors = {}) {
  return {
    from(tableName) {
      if (tableName === 'notice' || tableName === 'course') {
        return {
          select: () => ({
            order: () => ({
              range: () =>
                Promise.resolve({
                  data: rows[tableName] || [],
                  error: null,
                }),
            }),
          }),
        };
      }
      return {
        select: () => Promise.resolve({ data: rows[tableName] || [], error: errors[tableName] || null }),
      };
    },
  };
}

describe('fetchDashboardCatalogs', () => {
  it('maps course, scholarship, program, notice, and major rows from Supabase', async () => {
    const rows = {
      course: [
        {
          course_id: 10,
          course_name: 'Artificial Intelligence',
          course_name_en: 'Artificial Intelligence',
          credits: 3,
          department: 'Computer Science & Engineering',
          course_type: 'ELECTIVE',
          tags: ['AI', 'Machine Learning'],
        },
      ],
      scholarship: [
        {
          scholarship_id: 22,
          title: 'AI Talent Scholarship',
          title_en: 'AI Talent Scholarship',
          description: 'Supports AI students',
          deadline: '2026-10-01',
          eligibility: 'Computer Science & Engineering',
          amount: 'KRW 1,000,000',
          provider: 'PNU',
          eligible_majors: ['Computer Science & Engineering'],
          eligible_nationalities: ['Vietnam'],
          min_gpa: 3.2,
          min_topik_level: 3,
          min_year: 2,
          max_year: 4,
          tags: ['AI'],
        },
      ],
      extracurricular_program: [
        {
          program_id: 3,
          title: 'AI Club Workshop',
          title_en: 'AI Club Workshop',
          description: 'Hands-on AI session',
          description_en: 'Hands-on AI session',
          date: '2026-09-01',
          category: 'Workshop',
          tags: ['AI'],
          career_tags: ['Technology'],
          eligible_majors: ['Computer Science & Engineering'],
          languages: ['English'],
          min_year: 2,
          max_year: 4,
        },
      ],
      notice: [
        {
          notice_id: 4,
          title: 'Registration Reminder',
          content: 'Register by Friday',
          posted_date: '2026-08-01',
          language: 'English',
          target_majors: ['Computer Science & Engineering'],
          target_nationalities: ['Vietnam'],
          min_year: 1,
          max_year: 4,
          tags: ['Registration'],
          languages: ['English'],
          priority: 'HIGH',
        },
      ],
      major: [
        {
          major_id: 1,
          major_name: 'Computer Science & Engineering',
          department: 'Engineering',
        },
      ],
    };

    const supabase = createSupabaseStub(rows);

    const catalogs = await fetchDashboardCatalogs(supabase, { language: 'en' });

    expect(catalogs.courses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '10', title: 'Artificial Intelligence' }),
      ]),
    );
    expect(catalogs.scholarships).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '22', title: 'AI Talent Scholarship' }),
      ]),
    );
    expect(catalogs.programs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '3', title: 'AI Club Workshop' }),
      ]),
    );
    expect(catalogs.notices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '4', title: 'Registration Reminder' }),
      ]),
    );
    expect(catalogs.majors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '1', name: 'Computer Science & Engineering' }),
      ]),
    );
  });

  it('returns empty arrays and metadata when Supabase has no catalog rows', async () => {
    const supabase = createSupabaseStub({
      course: [],
      scholarship: [],
      extracurricular_program: [],
      notice: [],
      major: [],
    });

    const catalogs = await fetchDashboardCatalogs(supabase, { language: 'en' });

    expect(catalogs.courses).toEqual([]);
    expect(catalogs.programs).toEqual([]);
    expect(catalogs.scholarships).toEqual([]);
    expect(catalogs.notices).toEqual([]);
    expect(catalogs.majors).toEqual([]);
    expect(catalogs.metadata).toEqual(
      expect.objectContaining({
        source: 'supabase',
        courses: 'empty',
        programs: 'empty',
        scholarships: 'empty',
        notices: 'empty',
        majors: 'empty',
      }),
    );
  });

  it('uses verified scholarship notices when the legacy scholarship table is absent', async () => {
    const supabase = createSupabaseStub({
      course: [],
      scholarship: [],
      extracurricular_program: [],
      notice: [{
        notice_id: 239,
        title: '[장학] 국가장학금 신청 안내',
        content: 'See the official application notice.',
        source: 'pnu-main',
        source_url: 'https://www.pusan.ac.kr/example',
      }],
      major: [],
    }, {
      scholarship: { code: 'PGRST205', message: 'table not found' },
    });

    const catalogs = await fetchDashboardCatalogs(supabase, { language: 'en' });

    expect(catalogs.scholarships).toEqual([
      expect.objectContaining({
        id: 'notice-239',
        title: '[장학] 국가장학금 신청 안내',
        sourceUrl: 'https://www.pusan.ac.kr/example',
      }),
    ]);
  });
});

describe('fetchAllCourses', () => {
  function createPagedCourseSupabase(pageResults) {
    let pageIndex = 0;
    const range = jest.fn(() => Promise.resolve(pageResults[pageIndex++]));
    const order = jest.fn(() => ({ range }));
    const select = jest.fn(() => ({ order }));
    const from = jest.fn(() => ({ select }));

    return {
      supabase: { from },
      spies: { from, order, range },
    };
  }

  it('paginates the course table deterministically beyond 1,000 rows', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      course_id: index + 1,
      course_name: `Course ${index + 1}`,
    }));
    const secondPage = [
      { course_id: 1001, course_name: 'Course 1001' },
    ];
    const { supabase, spies } = createPagedCourseSupabase([
      { data: firstPage, error: null },
      { data: secondPage, error: null },
    ]);

    const courses = await fetchAllCourses(supabase);

    expect(courses).toHaveLength(1001);
    expect(courses[0].id).toBe('1');
    expect(courses[1000].id).toBe('1001');
    expect(spies.from.mock.calls).toEqual([['course'], ['course']]);
    expect(spies.order).toHaveBeenCalledWith(
      'course_id',
      { ascending: true },
    );
    expect(spies.range.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
  });

  it('propagates a later-page course query failure', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      course_id: index + 1,
      course_name: `Course ${index + 1}`,
    }));
    const { supabase } = createPagedCourseSupabase([
      { data: firstPage, error: null },
      {
        data: null,
        error: { code: '08006', message: 'course database unavailable' },
      },
    ]);

    await expect(fetchAllCourses(supabase)).rejects.toMatchObject({
      statusCode: 502,
      code: 'SUPABASE_COURSE_QUERY_FAILED',
      message:
        'Failed to fetch courses from Supabase: course database unavailable',
    });
  });
});
