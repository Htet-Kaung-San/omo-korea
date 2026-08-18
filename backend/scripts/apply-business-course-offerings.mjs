#!/usr/bin/env node

import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_CONFIRMATION = 'APPLY_REVIEWED_BUSINESS_OFFERINGS_2026_2';
const require = createRequire(import.meta.url);
require('dotenv').config();
globalThis.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const { validateDataset, buildDryRunReport } = require('./lib/businessCourseOfferingsDryRun.cjs');

function parseArgs(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!['--expected-checksum', '--confirm'].includes(key) || !value) {
      throw new Error('Required: --expected-checksum <sha256> --confirm APPLY_REVIEWED_BUSINESS_OFFERINGS_2026_2');
    }
    values[key] = value;
  }
  if (values['--confirm'] !== EXPECTED_CONFIRMATION) throw new Error('Explicit apply confirmation is missing or incorrect.');
  if (!/^[a-f0-9]{64}$/.test(values['--expected-checksum'] || '')) throw new Error('A lowercase SHA-256 checksum is required.');
  return { expectedChecksum: values['--expected-checksum'] };
}

async function fetchState(supabase, dataset, courseIds) {
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
  return { productionCourses, productionOfferings };
}

const options = parseArgs(process.argv.slice(2));
const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const datasetPath = join(backendRoot, 'config', 'pnu-business-course-offerings-2026-2.json');
const resultPath = join(backendRoot, 'data', 'local', 'business-course-offerings-application-results', '2026-2.json');
const datasetBytes = await readFile(datasetPath);
const checksum = createHash('sha256').update(datasetBytes).digest('hex');
if (checksum !== options.expectedChecksum) throw new Error(`Dataset checksum changed. Expected ${options.expectedChecksum}, found ${checksum}.`);
const dataset = JSON.parse(datasetBytes.toString('utf8'));
const { courseIds } = validateDataset(dataset);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error('SUPABASE_URL and SUPABASE_KEY are required.');
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });

console.log(`Authorized Business offering apply; checksum ${checksum}`);
const before = await fetchState(supabase, dataset, courseIds);
const preflight = buildDryRunReport({ dataset, ...before });
if (preflight.summary.blocked !== 0 || preflight.summary.noops !== 0 || preflight.summary.proposedCourseNumberBackfills !== 0 || preflight.summary.proposedOfferingInserts !== dataset.expectedOfferingCount) {
  throw new Error(`Preflight differs from approval: ${JSON.stringify(preflight.summary)}`);
}

// One PostgREST bulk insert maps to one SQL INSERT statement. Any constraint
// failure rolls back the complete set; this script never upserts or overwrites.
const { data: inserted, error: insertError } = await supabase
  .from('course_offering')
  .insert(preflight.proposedOfferingInserts)
  .select('course_offering_id,course_id,official_course_number,academic_year,semester,section');
if (insertError) throw new Error(`Atomic offering insert failed: ${insertError.message}`);
if ((inserted || []).length !== dataset.expectedOfferingCount) throw new Error(`Unexpected insert response count: ${(inserted || []).length}`);

const after = await fetchState(supabase, dataset, courseIds);
const verification = buildDryRunReport({ dataset, ...after });
if (verification.summary.blocked !== 0 || verification.summary.proposedOfferingInserts !== 0 || verification.summary.noops !== dataset.expectedOfferingCount) {
  throw new Error(`Post-apply verification failed: ${JSON.stringify(verification.summary)}`);
}

const result = {
  completedAt: new Date().toISOString(),
  mode: 'AUTHORIZED_ATOMIC_INSERT',
  datasetSha256: checksum,
  preflight: preflight.summary,
  insertedRows: inserted,
  verification: verification.summary,
};
await mkdir(dirname(resultPath), { recursive: true });
await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result, null, 2));
console.log(`Local result: ${resultPath}`);
