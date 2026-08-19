const DAY_NUMBERS = Object.freeze({
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
  월: 1,
  화: 2,
  수: 3,
  목: 4,
  금: 5,
  토: 6,
  일: 7,
});

function apiError(message, statusCode = 400, code = 'INVALID_TIMETABLE_REQUEST') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function timeToMinutes(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function minutesToTime(total) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function normalizeSlot(slot) {
  const day = Number(slot?.day ?? slot?.dayOfWeek ?? slot?.day_of_week);
  const start = String(slot?.start ?? slot?.startTime ?? slot?.start_time ?? '').slice(0, 5);
  const end = String(slot?.end ?? slot?.endTime ?? slot?.end_time ?? '').slice(0, 5);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (!Number.isInteger(day) || day < 1 || day > 7) {
    throw apiError('Each timetable slot needs a day from 1 (Monday) to 7 (Sunday).');
  }
  if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
    throw apiError('Each timetable slot needs a valid start time before its end time.');
  }
  return {
    day,
    start,
    end,
    classroom: String(slot?.classroom || '').trim() || null,
  };
}

function normalizeSlots(slots) {
  if (!Array.isArray(slots) || slots.length === 0) {
    throw apiError('At least one valid timetable slot is required.');
  }
  const normalized = slots.map(normalizeSlot);
  const keys = new Set();
  for (const slot of normalized) {
    const key = `${slot.day}|${slot.start}|${slot.end}`;
    if (keys.has(key)) throw apiError('Duplicate timetable slots are not allowed.');
    keys.add(key);
  }
  return normalized;
}

function parseOfferingSchedule(schedule, defaultClassroom = null) {
  const text = String(schedule || '').normalize('NFKC').trim();
  if (!text) return [];
  const slots = [];
  // PNU publishes two schedule forms. The duration form "월 09:00(90) 514-313"
  // was already handled; the range form "월 15:00-18:00 514-313" was not, so 16
  // of the 104 live 2026-2 offerings parsed to zero slots and silently fell
  // through to the manual editor — including AI비즈니스 and 외환관리론, two of
  // the fifteen offerings this branch imports.
  const DAY = '(Mon|Tue|Wed|Thu|Fri|Sat|Sun|[월화수목금토일])';
  const pattern = new RegExp(
    `${DAY}\\s*(\\d{1,2}:\\d{2})\\s*(?:\\((\\d{1,3})\\)|-\\s*(\\d{1,2}:\\d{2}))(?:\\s*([^,;]+))?`,
    'gu',
  );
  for (const match of text.matchAll(pattern)) {
    const day = DAY_NUMBERS[match[1]];
    const startMinutes = timeToMinutes(match[2]);
    if (!day || startMinutes === null) continue;

    let endMinutes = null;
    if (match[3] !== undefined) {
      const duration = Number(match[3]);
      if (!Number.isInteger(duration) || duration <= 0) continue;
      endMinutes = startMinutes + duration;
    } else if (match[4] !== undefined) {
      endMinutes = timeToMinutes(match[4]);
      // A range that does not move forward is unusable; skip rather than emit a
      // zero-length or inverted slot.
      if (endMinutes === null || endMinutes <= startMinutes) continue;
    } else {
      continue;
    }

    slots.push({
      day,
      start: minutesToTime(startMinutes),
      end: minutesToTime(endMinutes),
      classroom: String(match[5] || defaultClassroom || '').trim() || null,
    });
  }
  return slots;
}

function slotsOverlap(first, second) {
  if (Number(first.day) !== Number(second.day)) return false;
  return timeToMinutes(first.start) < timeToMinutes(second.end)
    && timeToMinutes(second.start) < timeToMinutes(first.end);
}

function mapTimetableEntry(row) {
  const course = row.course || {};
  const offering = row.offering || null;
  return {
    timetableEntryId: Number(row.timetable_entry_id),
    enrollment_id: Number(row.timetable_entry_id),
    student_id: String(row.student_id),
    course_id: Number(row.course_id),
    courseOfferingId: row.course_offering_id == null ? null : Number(row.course_offering_id),
    academicYear: Number(row.academic_year),
    semester: String(row.semester),
    status: 'Planned',
    source: row.source,
    color: row.color || null,
    course_name: course.course_name || '',
    courseNameEn: course.course_name_en || null,
    officialCourseNumber:
      offering?.official_course_number || course.official_course_number || null,
    credit: course.credit ?? 0,
    category: course.category || 'ELECTIVE',
    professor: offering?.professor || null,
    section: offering?.section || null,
    slots: (row.slots || []).map((slot) => ({
      slotId: Number(slot.timetable_slot_id),
      day: Number(slot.day_of_week),
      start: String(slot.start_time).slice(0, 5),
      end: String(slot.end_time).slice(0, 5),
      classroom: slot.classroom || null,
    })).sort((a, b) => a.day - b.day || a.start.localeCompare(b.start)),
  };
}

async function getTimetableEntry(supabase, studentId, entryId) {
  const { data, error } = await supabase
    .from('student_timetable_entry')
    .select(`
      timetable_entry_id,student_id,course_id,course_offering_id,academic_year,
      semester,source,color,created_at,updated_at,
      course:course_id(course_id,course_name,course_name_en,credit,category,official_course_number),
      offering:course_offering_id(course_offering_id,official_course_number,section,professor,schedule,classroom),
      slots:student_timetable_slot(timetable_slot_id,day_of_week,start_time,end_time,classroom)
    `)
    .eq('student_id', Number(studentId))
    .eq('timetable_entry_id', Number(entryId))
    .single();
  if (error) {
    if (error.code === 'PGRST116') throw apiError('Timetable entry not found.', 404, 'TIMETABLE_ENTRY_NOT_FOUND');
    throw apiError(`Failed to fetch timetable entry: ${error.message}`, 502, 'TIMETABLE_QUERY_FAILED');
  }
  return mapTimetableEntry(data);
}

async function listTimetableEntries(supabase, studentId, options = {}) {
  // 1. Fetch active enrollments for this student
  const { data: activeEnrollments } = await supabase
    .from('enrollment')
    .select('course_id,status')
    .eq('student_id', studentId)
    .neq('status', 'Completed');

  const activeCourseIds = new Set(
    (activeEnrollments || []).map((e) => Number(e.course_id)).filter(Boolean)
  );

  let query = supabase
    .from('student_timetable_entry')
    .select(`
      timetable_entry_id,student_id,course_id,course_offering_id,academic_year,
      semester,source,color,created_at,updated_at,
      course:course_id(course_id,course_name,course_name_en,credit,category,official_course_number),
      offering:course_offering_id(course_offering_id,official_course_number,section,professor,schedule,classroom),
      slots:student_timetable_slot(timetable_slot_id,day_of_week,start_time,end_time,classroom)
    `)
    .eq('student_id', Number(studentId))
    .order('timetable_entry_id', { ascending: true });

  if (options.academicYear) query = query.eq('academic_year', Number(options.academicYear));
  if (options.semester) query = query.eq('semester', String(options.semester));
  const { data, error } = await query;
  if (error) throw apiError(`Failed to fetch timetable: ${error.message}`, 502, 'TIMETABLE_QUERY_FAILED');

  const allEntries = data || [];

  // 2. Only return timetable entries for actively enrolled courses, auto-cleaning any orphan entries
  const orphanEntryIds = [];
  const validEntries = [];

  for (const entry of allEntries) {
    const courseId = Number(entry.course_id);
    if (activeCourseIds.has(courseId)) {
      validEntries.push(entry);
    } else {
      orphanEntryIds.push(Number(entry.timetable_entry_id));
    }
  }

  if (orphanEntryIds.length > 0) {
    supabase
      .from('student_timetable_entry')
      .delete()
      .in('timetable_entry_id', orphanEntryIds)
      .then(() => {})
      .catch(() => {});
  }

  return validEntries.map(mapTimetableEntry);
}

async function addTimetableEntry(supabase, studentId, input) {
  const courseId = Number(input.courseId ?? input.course_id);
  const academicYear = Number(input.academicYear ?? input.academic_year);
  const semester = String(input.semester || '').trim();
  const offeringIdValue = input.courseOfferingId ?? input.course_offering_id;
  const courseOfferingId = offeringIdValue == null || offeringIdValue === ''
    ? null
    : Number(offeringIdValue);
  if (!Number.isInteger(courseId) || courseId <= 0) throw apiError('A valid courseId is required.');
  if (!Number.isInteger(academicYear) || academicYear < 2000 || academicYear > 2100) {
    throw apiError('A valid academicYear is required.');
  }
  if (!['1', '2', 'SUMMER', 'WINTER'].includes(semester)) {
    throw apiError('semester must be 1, 2, SUMMER, or WINTER.');
  }

  const { data: course, error: courseError } = await supabase
    .from('course')
    .select('course_id')
    .eq('course_id', courseId)
    .single();
  if (courseError || !course) throw apiError('Course not found.', 404, 'COURSE_NOT_FOUND');

  let offering = null;
  if (courseOfferingId !== null) {
    const result = await supabase
      .from('course_offering')
      .select('course_offering_id,course_id,academic_year,semester,schedule,classroom')
      .eq('course_offering_id', courseOfferingId)
      .single();
    if (result.error || !result.data) throw apiError('Course offering not found.', 404, 'COURSE_OFFERING_NOT_FOUND');
    offering = result.data;
    if (Number(offering.course_id) !== courseId
      || Number(offering.academic_year) !== academicYear
      || String(offering.semester) !== semester) {
      throw apiError('The selected offering does not match the course and term.');
    }
  }

  const submittedSlots = Array.isArray(input.slots) ? input.slots : [];
  const parsedOfferingSlots = offering
    ? parseOfferingSchedule(offering.schedule, offering.classroom)
    : [];
  const slots = normalizeSlots(submittedSlots.length ? submittedSlots : parsedOfferingSlots);
  const source = offering && submittedSlots.length === 0 ? 'OFFERING' : 'MANUAL';
  const { data, error } = await supabase.rpc('add_student_timetable_entry', {
    p_student_id: Number(studentId),
    p_course_id: courseId,
    p_course_offering_id: courseOfferingId,
    p_academic_year: academicYear,
    p_semester: semester,
    p_source: source,
    p_color: String(input.color || '').trim() || null,
    p_slots: slots,
  });
  if (error) {
    const conflict = /conflict/i.test(error.message || '');
    throw apiError(
      error.message || 'Failed to add timetable entry.',
      conflict ? 409 : 502,
      conflict ? 'TIMETABLE_CONFLICT' : 'TIMETABLE_WRITE_FAILED',
    );
  }
  const entryId = Number(data?.timetableEntryId ?? data?.timetable_entry_id ?? data);
  return getTimetableEntry(supabase, studentId, entryId);
}

async function deleteTimetableEntry(supabase, studentId, entryId) {
  // 1. Fetch entry details before deleting
  const { data: existing } = await supabase
    .from('student_timetable_entry')
    .select('timetable_entry_id,student_id,course_id,academic_year,semester')
    .eq('student_id', Number(studentId))
    .eq('timetable_entry_id', Number(entryId))
    .maybeSingle();

  const { data, error } = await supabase
    .from('student_timetable_entry')
    .delete()
    .eq('student_id', Number(studentId))
    .eq('timetable_entry_id', Number(entryId))
    .select('timetable_entry_id');
  if (error) throw apiError(`Failed to remove timetable entry: ${error.message}`, 502, 'TIMETABLE_WRITE_FAILED');
  if (existing?.course_id) {
    await supabase
      .from('enrollment')
      .delete()
      .eq('student_id', studentId)
      .eq('course_id', Number(existing.course_id))
      .neq('status', 'Completed');
  }

  return { timetableEntryId: Number(entryId) };
}

async function deleteTimetableByCourseId(supabase, studentId, courseId) {
  const numericCourseId = Number(courseId);
  const numericStudentId = Number(studentId);

  // 1. Delete from student_timetable_entry (and cascading slots)
  await supabase
    .from('student_timetable_entry')
    .delete()
    .eq('student_id', numericStudentId)
    .eq('course_id', numericCourseId);

  // 2. Delete from enrollment (active / incomplete)
  await supabase
    .from('enrollment')
    .delete()
    .eq('student_id', studentId)
    .eq('course_id', numericCourseId)
    .neq('status', 'Completed');

  return { courseId: numericCourseId };
}

module.exports = {
  addTimetableEntry,
  deleteTimetableByCourseId,
  deleteTimetableEntry,
  listTimetableEntries,
  mapTimetableEntry,
  normalizeSlot,
  normalizeSlots,
  parseOfferingSchedule,
  slotsOverlap,
  timeToMinutes,
};
