/**
 * Regression tests for two parsers introduced with the business-curriculum
 * import. Both failed silently against the existing catalog — no error, no
 * exception, just wrong text on screen — which is exactly the kind of bug that
 * survives a green CI run, so they are pinned here.
 */
const { mapCourseRow } = require('../ai/supabaseDataRepository');
const { parseOfferingSchedule } = require('../services/timetableService');

describe('bilingual course name splitting', () => {
  test('splits a genuine "English (한국어)" name into both halves', () => {
    const course = mapCourseRow({ course_id: 1, course_name: 'Engineering Linear Algebra (공학선형대수학)' }, 'en');
    expect(course.nameEn).toBe('Engineering Linear Algebra');
    expect(course.nameKo).toBe('공학선형대수학');
  });

  // The original splitter took any trailing parenthetical as the Korean name.
  // 492 of the 1,924 live course rows end in a sequence marker, so a quarter of
  // the catalog rendered with the heading "I" in Korean mode.
  test.each([
    ['재무회계(I)'],
    ['일반물리학(I)'],
    ['재무회계(II)'],
    ['종합설계과제(Capstone 2)'],
  ])('keeps %s intact instead of reducing the Korean name to the marker', (name) => {
    const course = mapCourseRow({ course_id: 2, course_name: name }, 'ko');
    expect(course.nameKo).toBe(name);
    expect(course.nameKo).not.toMatch(/^(I{1,3}|IV|V|Capstone ?\d?)$/i);
  });

  test('the Korean title is the full course name, not a bare numeral', () => {
    const course = mapCourseRow({ course_id: 3, course_name: '일반물리학(I)' }, 'ko');
    // name is what the card heading renders.
    expect(course.name).toBe('일반물리학(I)');
  });

  test('an explicit course_name_en still wins over anything inferred', () => {
    const course = mapCourseRow(
      { course_id: 4, course_name: '재무회계(I)', course_name_en: 'Financial Accounting I' },
      'en',
    );
    expect(course.nameEn).toBe('Financial Accounting I');
  });
});

describe('offering schedule parsing', () => {
  test('parses the duration form "월 09:00(90)"', () => {
    expect(parseOfferingSchedule('월 09:00(90) 514-313')).toEqual([
      { day: 1, start: '09:00', end: '10:30', classroom: '514-313' },
    ]);
  });

  // PNU also publishes an explicit range. 16 of the 104 live 2026-2 offerings
  // use it — including AI비즈니스 and 외환관리론, two of the fifteen this branch
  // imports — and they previously parsed to zero slots and fell through to the
  // manual editor.
  test('parses the range form "월 15:00-18:00"', () => {
    expect(parseOfferingSchedule('월 15:00-18:00 514-313')).toEqual([
      { day: 1, start: '15:00', end: '18:00', classroom: '514-313' },
    ]);
  });

  test('parses several slots in one string', () => {
    const slots = parseOfferingSchedule('월 09:00(90) 514-313, 수 15:00-16:30 514-107');
    expect(slots).toHaveLength(2);
    expect(slots[0]).toMatchObject({ day: 1, start: '09:00', end: '10:30' });
    expect(slots[1]).toMatchObject({ day: 3, start: '15:00', end: '16:30' });
  });

  test('drops a range that does not move forward rather than emitting an inverted slot', () => {
    expect(parseOfferingSchedule('월 15:00-15:00')).toEqual([]);
    expect(parseOfferingSchedule('월 18:00-15:00')).toEqual([]);
  });

  test('returns nothing for an unparseable or empty schedule', () => {
    expect(parseOfferingSchedule('')).toEqual([]);
    expect(parseOfferingSchedule('TBA')).toEqual([]);
  });
});
