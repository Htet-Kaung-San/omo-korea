import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const engine = require('./ai/courseRecommendationEngine.js');
const { recommendCourses, getCourseField, getMeaningfulKeywords } = engine;

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY);

// Replicate supabaseDataRepository mapCourseRow shape (language 'en')
const rows = [];
for (let start = 0; ; start += 1000) {
  const r = await sb.from('course').select('*').order('course_id', { ascending: true }).range(start, start + 999);
  if (r.error) { console.error(r.error); break; }
  rows.push(...r.data);
  if (r.data.length < 1000) break;
}
console.log('catalog rows:', rows.length);

const catalog = rows.map((row) => ({
  id: row.course_id,
  courseId: row.course_id,
  title: row.course_name,
  name: row.course_name,
  nameKo: row.course_name,
  nameEn: null,
  credits: row.credit,
  category: row.category,
  major_id: row.major_id,
  raw: row,
}));

const COMPLETED = ["College English 1","College English 2","Korean Language 1","Korean Language 2","Calculus 1","Calculus 2","Linear Algebra","Discrete Mathematics","Computer Programming 1","Computer Programming 2","Data Structures","Computer Architecture","Operating Systems","Database Systems","Introduction to AI","Probability and Statistics","Creative Design Thinking","General Physics"];

// 1) Do the English completed titles resolve to a field at all?
console.log('\n--- field of each completed title ---');
for (const t of COMPLETED) {
  const f = getCourseField({ name: t });
  console.log(String(t).padEnd(28), f ? f.id : 'null', '| kw:', [...getMeaningfulKeywords({ name: t })].join(','));
}

// 2) How many catalog courses map to a field at all?
const fieldCounts = {};
for (const c of catalog) {
  const f = getCourseField(c);
  const k = f ? f.id : 'NONE';
  fieldCounts[k] = (fieldCounts[k] || 0) + 1;
}
console.log('\n--- catalog field distribution ---');
console.log(fieldCounts);

// 3) Are there catalog courses sharing a field with a completed title?
const completedFields = new Set(COMPLETED.map((t) => getCourseField({ name: t })?.id).filter(Boolean));
console.log('\ncompleted fields:', [...completedFields]);
const overlapping = catalog.filter((c) => { const f = getCourseField(c); return f && completedFields.has(f.id); });
console.log('catalog courses in a completed field:', overlapping.length);
console.log('sample:', overlapping.slice(0, 12).map((c) => `${c.name}[${getCourseField(c).id}] major=${c.major_id}`));

// 4) Real end-to-end: the two students that actually have completed_courses (major_id 8, year 3)
for (const majorId of [8, 7, 116, 4, 40, 121]) {
  const profile = { majorId, year: 3, interests: [] };
  const base = recommendCourses(profile, catalog, { limit: 10 });
  const withHist = recommendCourses(profile, catalog, { completedCourseIds: COMPLETED, limit: 10 });
  const same = JSON.stringify(base.map((c) => [c.id, c.score])) === JSON.stringify(withHist.map((c) => [c.id, c.score]));
  console.log(`\nmajor ${majorId}: identical with real completed_courses? ${same}`);
  if (!same) {
    console.log(' base :', base.map((c) => `${c.name}(${c.score})`).join(' | '));
    console.log(' hist :', withHist.map((c) => `${c.name}(${c.score})`).join(' | '));
    console.log(' hints:', withHist.slice(0, 5).map((c) => c.matchHint));
  }
  const anyHistoryHint = withHist.some((c) => /previously completed/.test(c.matchHint || ''));
  console.log(`  any "previously completed" hint in top10? ${anyHistoryHint}`);
}

// 5) Same test but for the enrollment path with a *hypothetical* completed status
const enr = await sb.from('enrollment').select('course_id,status,semester').eq('student_id', '202612345');
console.log('\nenrollments for 202612345:', JSON.stringify(enr.data));
