import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
require('dotenv').config();
globalThis.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const { createMetadataDryRunReport } = require('./lib/pnuCourseMetadata.cjs');

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(backendRoot, 'config', 'pnu-course-metadata-2026-2.json');
const resolutionPath = join(
  backendRoot,
  'config',
  'pnu-course-metadata-resolutions-2026-2.json',
);
const offeringSnapshotPath = join(
  backendRoot,
  'data',
  'local',
  'pnu-course-offerings',
  '2026-2.json',
);
const reportPath = join(
  backendRoot,
  'data',
  'local',
  'pnu-course-metadata-dry-run',
  '2026-2.json',
);

if (process.argv.slice(2).length > 0) {
  throw new Error('This command is dry-run only and accepts no arguments. --apply is not supported.');
}

const manifestBytes = await readFile(manifestPath);
const manifest = JSON.parse(manifestBytes.toString('utf8'));
const manifestSha256 = createHash('sha256').update(manifestBytes).digest('hex');
const resolutionBytes = await readFile(resolutionPath);
const resolutionPlan = JSON.parse(resolutionBytes.toString('utf8'));
const resolutionSha256 = createHash('sha256').update(resolutionBytes).digest('hex');
const sourceDirectory = join(backendRoot, manifest.sourceDirectory);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY are required for read-only production verification.');
}
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const report = await createMetadataDryRunReport({
  manifest,
  resolutionPlan,
  offeringSnapshotPath,
  sourceDirectory,
  supabase,
});
report.manifestSha256 = manifestSha256;
report.resolutionSha256 = resolutionSha256;
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log('PNU COURSE METADATA DRY RUN');
console.log(`Manifest SHA-256: ${manifestSha256}`);
console.log(`Resolution SHA-256: ${resolutionSha256}`);
console.log(`Manifest rows: ${report.summary.manifestRows}`);
console.log(`Exact production offerings: ${report.summary.exactProductionOfferings}`);
console.log(`Planned offering rows: ${report.summary.plannedOfferingRows}`);
console.log(`Projected exact offerings: ${report.summary.projectedExactProductionOfferings}`);
console.log(`Eligible rows: ${report.summary.eligibleRows}`);
console.log(`Blocked rows: ${report.summary.blockedRows}`);
console.log(`Writes performed: ${report.summary.writesPerformed}`);
for (const row of report.eligibleRows) {
  const target = row.courseOfferingId === null
    ? `course ${row.reviewedCourseId} (planned offering)`
    : `offering ${row.courseOfferingId}`;
  console.log(`ELIGIBLE ${row.identity} -> ${target} (${row.action})`);
}
for (const row of report.blockedRows) {
  console.log(`BLOCKED ${row.identity}: ${row.blockingReasons.join(', ')}`);
}
console.log(`Local report: ${reportPath}`);
