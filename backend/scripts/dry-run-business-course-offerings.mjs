import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
require('dotenv').config();
globalThis.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const { validateDataset, buildDryRunReport } = require('./lib/businessCourseOfferingsDryRun.cjs');

if (process.argv.slice(2).length) {
  throw new Error('This command is read-only and accepts no arguments. --apply is not supported.');
}

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const datasetPath = join(backendRoot, 'config', 'pnu-business-course-offerings-2026-2.json');
const reportPath = join(backendRoot, 'data', 'local', 'business-course-offerings-dry-run', '2026-2.json');
const datasetBytes = await readFile(datasetPath);
const dataset = JSON.parse(datasetBytes.toString('utf8'));
const datasetSha256 = createHash('sha256').update(datasetBytes).digest('hex');
const { courseIds } = validateDataset(dataset);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error('SUPABASE_URL and SUPABASE_KEY are required for read-only production verification.');
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: productionCourses, error: courseError } = await supabase
  .from('course')
  .select('course_id,course_name,credit,major_id,official_course_number')
  .in('course_id', courseIds);
if (courseError) throw new Error(`Failed to read production courses: ${courseError.message}`);

const { data: productionOfferings, error: offeringError } = await supabase
  .from('course_offering')
  .select('course_offering_id,course_id,official_course_number,academic_year,semester,section,professor,year_level,theory_hours,practical_hours,schedule,classroom,remote_course_status,original_language_code,teaching_language,source_url,retrieved_at')
  .eq('academic_year', dataset.academicYear)
  .eq('semester', dataset.semester);
if (offeringError) throw new Error(`Failed to read production offerings: ${offeringError.message}`);

const report = buildDryRunReport({ dataset, productionCourses, productionOfferings });
report.datasetSha256 = datasetSha256;
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log('BUSINESS COURSE OFFERINGS READ-ONLY DRY RUN');
console.log(`Dataset SHA-256: ${datasetSha256}`);
for (const [key, value] of Object.entries(report.summary)) console.log(`${key}: ${value}`);
for (const item of report.blocked) console.log(`BLOCKED ${item.identity}: ${item.reasons.join(', ')}`);
console.log(`Local report: ${reportPath}`);
if (report.summary.blocked) process.exitCode = 2;
