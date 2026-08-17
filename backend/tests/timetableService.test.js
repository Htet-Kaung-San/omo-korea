const {
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
});
