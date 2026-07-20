const { fetchDashboardCatalogs } = require('../ai/supabaseDataRepository');

function createSupabaseStub(rows) {
  return {
    from(tableName) {
      return {
        select: () => Promise.resolve({ data: rows[tableName] || [], error: null }),
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
});
