import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const sb = createClient(url, key);

const enr = await sb.from('enrollment').select('enrollment_id,student_id,course_id,status,semester');
console.log('ENROLLMENT err:', enr.error?.message ?? null, 'count:', enr.data?.length);
if (enr.data) {
  const counts = {};
  for (const r of enr.data) counts[String(r.status)] = (counts[String(r.status)] || 0) + 1;
  console.log('status counts:', counts);
  const sems = {};
  for (const r of enr.data) sems[String(r.semester)] = (sems[String(r.semester)] || 0) + 1;
  console.log('semester counts:', sems);
}

const st = await sb.from('student').select('*');
console.log('STUDENT err:', st.error?.message ?? null, 'count:', st.data?.length);
if (st.data?.length) {
  console.log('student columns:', Object.keys(st.data[0]).join(','));
  for (const s of st.data) {
    console.log('student', s.student_id, 'major_id=', s.major_id, 'year=', s.year ?? s.grade,
      'completed_courses=', JSON.stringify(s.completed_courses),
      'completed_course_ids=', JSON.stringify(s.completed_course_ids));
  }
}

const c = await sb.from('course').select('*').limit(3);
console.log('COURSE err:', c.error?.message ?? null);
if (c.data?.length) {
  console.log('course columns:', Object.keys(c.data[0]).join(','));
  console.log(JSON.stringify(c.data, null, 1));
}

// how many courses have a non-null english name (if column exists)
const en = await sb.from('course').select('course_id', { count: 'exact', head: true }).not('course_name_en', 'is', null);
console.log('courses with course_name_en not null:', en.count, 'err:', en.error?.message ?? null);
const total = await sb.from('course').select('course_id', { count: 'exact', head: true });
console.log('total courses:', total.count);
