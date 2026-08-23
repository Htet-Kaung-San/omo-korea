const {
  listTimetableEntries,
  mapTimetableEntry,
  normalizeSlots,
  parseOfferingSchedule,
  slotsOverlap,
} = require('../services/timetableService');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

describe('timetableService', () => {
  test('parses reviewed PNU Korean offering schedule text into real slots', () => {
    expect(parseOfferingSchedule(
      '월 10:30(75) 102-309, 수 10:30(75) 102-309',
    )).toEqual([
      { day: 1, start: '10:30', end: '11:45', classroom: '102-309' },
      { day: 3, start: '10:30', end: '11:45', classroom: '102-309' },
    ]);
  });

  test('parses embedded course times that include database seconds', () => {
    expect(parseOfferingSchedule('Mon 09:00:00-10:30:00', '102-306')).toEqual([
      { day: 1, start: '09:00', end: '10:30', classroom: '102-306' },
    ]);
  });

  test('rejects invalid manual slots and recognizes overlap', () => {
    expect(() => normalizeSlots([{ day: 1, start: '11:00', end: '10:00' }]))
      .toThrow('valid start time');
    expect(slotsOverlap(
      { day: 2, start: '09:00', end: '10:30' },
      { day: 2, start: '10:00', end: '11:00' },
    )).toBe(true);
    expect(slotsOverlap(
      { day: 2, start: '09:00', end: '10:30' },
      { day: 3, start: '10:00', end: '11:00' },
    )).toBe(false);
  });

  test('maps database rows without turning a timetable plan into enrollment', () => {
    const entry = mapTimetableEntry({
      timetable_entry_id: 9,
      student_id: 20260001,
      course_id: 6146,
      course_offering_id: null,
      academic_year: 2026,
      semester: '2',
      source: 'MANUAL',
      color: '#2563EB',
      course: {
        course_name: '회계학원리',
        course_name_en: 'Principles of Accounting',
        credit: 3,
        category: 'REQUIRED',
        official_course_number: 'DB1600358',
      },
      slots: [{
        timetable_slot_id: 12,
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '10:30:00',
        classroom: 'A101',
      }],
    });
    expect(entry).toMatchObject({
      timetableEntryId: 9,
      enrollment_id: 9,
      status: 'Planned',
      source: 'MANUAL',
      officialCourseNumber: 'DB1600358',
    });
    expect(entry.slots[0]).toMatchObject({ day: 1, start: '09:00', end: '10:30' });
  });

  test('listing a timetable is read-only and keeps plans without enrollment rows', async () => {
    const timetableRows = [{
      timetable_entry_id: 21,
      student_id: 202612345,
      course_id: 289,
      course_offering_id: null,
      academic_year: 2026,
      semester: '2',
      source: 'MANUAL',
      color: null,
      course: {
        course_name: '19세기프랑스문학',
        course_name_en: '19th Century French Literature',
        credit: 3,
        category: '전공필수',
        course_code: 'FL2003327',
      },
      slots: [{
        timetable_slot_id: 31,
        day_of_week: 2,
        start_time: '09:00:00',
        end_time: '10:15:00',
        classroom: '306-309',
      }],
    }];
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      order: jest.fn(() => query),
      then: (resolve) => Promise.resolve({ data: timetableRows, error: null }).then(resolve),
    };
    const supabase = {
      from: jest.fn((table) => {
        if (table !== 'student_timetable_entry') {
          throw new Error(`Unexpected timetable read from ${table}`);
        }
        return query;
      }),
    };

    const entries = await listTimetableEntries(supabase, 202612345, {
      academicYear: 2026,
      semester: '2',
    });

    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      course_id: 289,
      officialCourseNumber: 'FL2003327',
      slots: [{ day: 2, start: '09:00', end: '10:15', classroom: '306-309' }],
    });
  });

  test('migration keeps timetable data backend-only and validates conflicts atomically', () => {
    const sql = readFileSync(
      join(__dirname, '..', 'supabase', 'student_timetable.sql'),
      'utf8',
    );
    expect(sql).toContain('alter table public.student_timetable_entry enable row level security');
    expect(sql).toContain('alter table public.student_timetable_slot enable row level security');
    expect(sql).toContain('create or replace function public.add_student_timetable_entry');
    expect(sql).toContain("raise exception 'timetable conflict with an existing course'");
    expect(sql).toContain('to service_role');
  });

  test('follow-up migration prevents deleting referenced catalog courses', () => {
    const sql = readFileSync(
      join(__dirname, '..', 'supabase', 'timetable_course_delete_restrict.sql'),
      'utf8',
    );
    expect(sql).toMatch(/foreign key \(course_id\)[\s\S]*on delete restrict/i);
  });

  test('history migration supports retakes and atomic plan removal', () => {
    const sql = readFileSync(
      join(__dirname, '..', 'supabase', 'enrollment_course_history.sql'),
      'utf8',
    );
    expect(sql).toContain('enrollment_student_course_term_key');
    expect(sql).toContain('create or replace function public.drop_student_course_plan');
    expect(sql).toMatch(/delete from public\.student_timetable_entry[\s\S]*delete from public\.enrollment/i);
  });
});
