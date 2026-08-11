const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { seedCoursesByMajor } = require('../scripts/lib/courseSeedSafety.cjs');

function fakeSupabase({ offerings = [], officialAssignments = [], errors = {} } = {}) {
  const calls = [];
  return { calls, from(table) {
    const chain = {
      select() { return chain; }, not() { return chain; },
      limit() { calls.push(`read:${table}`); if (errors[table]) return Promise.resolve({ data: null, error: errors[table] }); return Promise.resolve({ data: table === 'course_offering' ? offerings : officialAssignments, error: null }); },
      delete() { calls.push(`delete:${table}`); return chain; }, eq() { return Promise.resolve({ error: null }); },
      insert() { calls.push(`insert:${table}`); return Promise.resolve({ error: null }); },
    }; return chain;
  } };
}

const byMajor = new Map([[10, [{ major_id: 10, course_name: 'Legacy', credit: 3, category: 'ELECTIVE' }]]]);

describe('legacy course seed safety guard', () => {
  test('allows the legacy path when no dependent identity data exists', async () => { const supabase = fakeSupabase(); await expect(seedCoursesByMajor({ supabase, byMajor })).resolves.toMatchObject({ inserted: 1 }); expect(supabase.calls).toContain('delete:course'); });
  test('blocks before deletion when offerings exist', async () => { const supabase = fakeSupabase({ offerings: [{ course_offering_id: 1 }] }); await expect(seedCoursesByMajor({ supabase, byMajor })).rejects.toThrow(/blocked because course_offering rows exist/i); expect(supabase.calls).not.toContain('delete:course'); });
  test('blocks before deletion when reviewed official numbers exist', async () => { const supabase = fakeSupabase({ officialAssignments: [{ course_id: 1 }] }); await expect(seedCoursesByMajor({ supabase, byMajor })).rejects.toThrow(/blocked because reviewed official_course_number assignments exist/i); expect(supabase.calls).not.toContain('delete:course'); });
  test('fails closed on guard query errors and performs no destructive query', async () => { const supabase = fakeSupabase({ errors: { course_offering: { code: '42501', message: 'permission denied' } } }); await expect(seedCoursesByMajor({ supabase, byMajor })).rejects.toThrow(/cannot verify/i); expect(supabase.calls).not.toContain('delete:course'); });
  test('allows a truly legacy schema with no offering table or official-number column', async () => {
    const supabase = fakeSupabase({ errors: {
      course_offering: { code: '42P01', message: 'relation does not exist' },
      course: { code: '42703', message: 'column does not exist' },
    } });
    await expect(seedCoursesByMajor({ supabase, byMajor })).resolves.toMatchObject({ inserted: 1 });
    expect(supabase.calls).toContain('delete:course');
  });
  test('fails closed when the offering table exists with an unexpected schema', async () => {
    const supabase = fakeSupabase({ errors: { course_offering: { code: '42703', message: 'column does not exist' } } });
    await expect(seedCoursesByMajor({ supabase, byMajor })).rejects.toThrow(/cannot verify course offering dependencies/i);
    expect(supabase.calls).not.toContain('delete:course');
  });
  test('the executable script delegates all destructive work to the tested helper', () => {
    const source = readFileSync(join(__dirname, '..', 'scripts', 'seed-courses-from-catalog.mjs'), 'utf8');
    expect(source).toMatch(/seedCoursesByMajor\(\{ supabase, byMajor \}\)/);
    expect(source).not.toMatch(/\.delete\s*\(/);
    expect(source).not.toMatch(/\.insert\s*\(/);
  });
});
