#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const {
  createProductionReadinessReview,
  writeLocalProductionReview,
} = require('./lib/pnuCourseBackfillDryRun.cjs');
const { fetchProductionCourses } = require('./lib/pnuCourseMatching.cjs');
const { parseArguments } = require('./lib/pnuCourseOfferings.cjs');

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(here, '..');

try {
  const { academicYear, semester } = parseArguments(process.argv.slice(2));
  const term = `${academicYear}-${semester}`;
  const [officialSnapshotText, matchingReportText, dryRunReportText] =
    await Promise.all([
      readFile(
        join(backendRoot, 'data', 'local', 'pnu-course-offerings', `${term}.json`),
        'utf8',
      ),
      readFile(
        join(backendRoot, 'data', 'local', 'pnu-course-matches', `${term}.json`),
        'utf8',
      ),
      readFile(
        join(backendRoot, 'data', 'local', 'pnu-course-backfill-dry-run', `${term}.json`),
        'utf8',
      ),
    ]);

  console.log(`Reviewing PNU course production proposal for ${term}`);
  console.log('Mode: SELECT-only production verification and local checksum report');
  const supabase = require('../supabaseClient.js');
  const productionCourses = await fetchProductionCourses(supabase);
  const report = createProductionReadinessReview({
    officialSnapshotText,
    matchingReportText,
    dryRunReportText,
    productionCourses,
  });
  const outputPath = await writeLocalProductionReview(
    report,
    backendRoot,
    academicYear,
    semester,
  );
  console.log(JSON.stringify({ ready: report.ready, counts: report.counts, checks: report.checks, checksums: report.checksums }, null, 2));
  console.log(`Local production-review report: ${outputPath}`);
  if (!report.ready) process.exitCode = 1;
} catch (error) {
  console.error(`PNU course production-readiness review failed: ${error.message}`);
  process.exitCode = 1;
}

