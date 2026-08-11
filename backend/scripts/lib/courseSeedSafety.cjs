const TABLE_ABSENT_CODES = new Set(['42P01', 'PGRST205']);
const COLUMN_ABSENT_CODES = new Set(['42703', 'PGRST204']);

function isAllowedLegacyAbsence(error, allowedCodes) {
  return Boolean(error && allowedCodes.has(error.code));
}

async function hasRows(query, label, allowedAbsentCodes) {
  const { data, error } = await query;
  if (error) {
    if (isAllowedLegacyAbsence(error, allowedAbsentCodes)) return false;
    throw new Error(`Cannot verify ${label}: ${error.message || error.code || 'unknown error'}`);
  }
  return Array.isArray(data) && data.length > 0;
}

async function assertCourseReseedSafe(supabase) {
  const offeringsExist = await hasRows(
    supabase.from('course_offering').select('course_offering_id').limit(1),
    'course offering dependencies',
    TABLE_ABSENT_CODES,
  );
  if (offeringsExist) throw new Error('Course reseeding is blocked because course_offering rows exist; deleting courses could cascade-delete reviewed offering and metadata data.');
  const reviewedIdentitiesExist = await hasRows(
    supabase.from('course').select('course_id').not('official_course_number', 'is', null).limit(1),
    'reviewed official course-number assignments',
    COLUMN_ABSENT_CODES,
  );
  if (reviewedIdentitiesExist) throw new Error('Course reseeding is blocked because reviewed official_course_number assignments exist; reseeding would replace stable course identities.');
}

async function seedCoursesByMajor({ supabase, byMajor, log = console }) {
  await assertCourseReseedSafe(supabase);
  let inserted = 0;
  let failedMajors = 0;
  for (const [majorId, rows] of [...byMajor.entries()].sort((a, b) => a[0] - b[0])) {
    const { error: delError } = await supabase.from('course').delete().eq('major_id', majorId);
    if (delError) { log.error(`major ${majorId}: delete failed - ${delError.message}`); failedMajors += 1; continue; }
    const payload = rows.map((course) => ({ major_id: course.major_id, course_name: course.course_name, credit: course.credit, category: course.category }));
    let majorInserted = 0;
    let majorFailed = false;
    for (let index = 0; index < payload.length; index += 500) {
      const batch = payload.slice(index, index + 500);
      const { error } = await supabase.from('course').insert(batch);
      if (error) { log.error(`major ${majorId}: insert failed - ${error.message}`); majorFailed = true; break; }
      majorInserted += batch.length;
    }
    if (majorFailed) failedMajors += 1; else inserted += majorInserted;
  }
  return { inserted, failedMajors, successfulMajors: byMajor.size - failedMajors };
}

module.exports = { assertCourseReseedSafe, isAllowedLegacyAbsence, seedCoursesByMajor };
