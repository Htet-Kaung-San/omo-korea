#!/usr/bin/env node

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const {
  fetchPnuCourseOfferings,
  parseArguments,
  writeLocalOutput,
} = require('./lib/pnuCourseOfferings.cjs');

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(here, '..');

try {
  const { academicYear, semester } = parseArguments(process.argv.slice(2));
  console.log(`Reading official PNU course offerings for ${academicYear}-${semester}`);
  console.log('Mode: reviewed public source, read-only; no Supabase client is loaded');
  const report = await fetchPnuCourseOfferings({ academicYear, semester, backendRoot });
  const outputPath = await writeLocalOutput(report, backendRoot);
  console.log(`Retrieved ${report.offeringCount} official offerings`);
  console.log(`Source: ${report.sourceUrl || report.sourceFileName}`);
  console.log(`Local output: ${outputPath}`);
} catch (error) {
  console.error(`PNU course offering fetch failed: ${error.message}`);
  process.exitCode = 1;
}
