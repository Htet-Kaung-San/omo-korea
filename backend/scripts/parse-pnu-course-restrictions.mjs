#!/usr/bin/env node

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { parseArguments } = require('./lib/pnuCourseOfferings.cjs');
const { readLocalRestrictions, writeLocalRestrictionOutput } = require('./lib/pnuCourseRestrictions.cjs');
const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

try {
  const { academicYear, semester } = parseArguments(process.argv.slice(2));
  const report = await readLocalRestrictions({ backendRoot, academicYear, semester });
  const outputPath = await writeLocalRestrictionOutput(report, backendRoot);
  console.log(`Parsed ${report.rawRestrictionCount} raw restriction rows into ${report.restrictionCount} unique rules and ${report.exceptionCount} exception rows`);
  console.log(`Local output: ${outputPath}`);
} catch (error) {
  console.error(`PNU restriction parse failed: ${error.message}`);
  process.exitCode = 1;
}
