#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const {
  createBackfillDryRunReport,
  writeLocalDryRunReport,
} = require('./lib/pnuCourseBackfillDryRun.cjs');
const { fetchProductionCourses } = require('./lib/pnuCourseMatching.cjs');
const { parseArguments } = require('./lib/pnuCourseOfferings.cjs');

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(here, '..');

try {
  const { academicYear, semester } = parseArguments(process.argv.slice(2));
  const term = `${academicYear}-${semester}`;
  const [matchingReportText, officialSnapshotText] = await Promise.all([
    readFile(join(backendRoot, 'data', 'local', 'pnu-course-matches', `${term}.json`), 'utf8'),
    readFile(join(backendRoot, 'data', 'local', 'pnu-course-offerings', `${term}.json`), 'utf8'),
  ]);

  console.log(`Strictly reviewing PNU course backfill candidates for ${term}`);
  console.log('Mode: SELECT-only production verification and gitignored local JSON output');
  console.log('No apply mode exists; no database mutation method is loaded');

  const supabase = require('../supabaseClient.js');
  const productionCourses = await fetchProductionCourses(supabase);
  const report = createBackfillDryRunReport({
    matchingReport: JSON.parse(matchingReportText),
    officialSnapshot: JSON.parse(officialSnapshotText),
    productionCourses,
  });
  const outputPath = await writeLocalDryRunReport(report, backendRoot);

  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Local dry-run output: ${outputPath}`);
} catch (error) {
  console.error(`PNU course backfill dry run failed: ${error.message}`);
  process.exitCode = 1;
}

