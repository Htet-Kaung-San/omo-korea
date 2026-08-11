#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { readXlsxWorkbook } = require('./lib/engineeringCourseValidation.cjs');
const {
  createMatchingReport,
  fetchProductionCourses,
  prepareEngineeringTargets,
  writeLocalMatchingReport,
} = require('./lib/pnuCourseMatching.cjs');
const { parseArguments } = require('./lib/pnuCourseOfferings.cjs');

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(here, '..');

try {
  const { academicYear, semester } = parseArguments(process.argv.slice(2));
  const snapshotPath = join(
    backendRoot,
    'data',
    'local',
    'pnu-course-offerings',
    `${academicYear}-${semester}.json`,
  );
  const [officialSnapshotText, curriculumText, mappingText, priorPackageText] = await Promise.all([
    readFile(snapshotPath, 'utf8'),
    readFile(join(backendRoot, 'data', 'curriculum-courses-2026-1.json'), 'utf8'),
    readFile(join(backendRoot, 'config', 'engineering-course-major-mapping.json'), 'utf8'),
    readFile(join(backendRoot, 'data', 'local', 'pnu-course-application', '2026-1.json'), 'utf8')
      .catch(() => '{"dataset":{"courseAssignments":[]}}'),
  ]);
  const officialSnapshot = JSON.parse(officialSnapshotText);
  if (
    officialSnapshot.academicYear !== academicYear ||
    String(officialSnapshot.semester) !== semester
  ) {
    throw new Error('Official snapshot term does not match the requested year and semester');
  }

  const engineeringWorkbook = readXlsxWorkbook(
    join(backendRoot, 'data', 'engineering_courses.xlsx'),
  );
  const engineeringTargets = prepareEngineeringTargets(
    engineeringWorkbook,
    JSON.parse(mappingText),
  );

  console.log(`Matching official PNU offerings for ${academicYear}-${semester}`);
  console.log('Mode: read-only SELECT plus local gitignored JSON output; no database writes');
  const supabase = require('../supabaseClient.js');
  const productionCourses = await fetchProductionCourses(supabase);
  const report = createMatchingReport({
    officialSnapshot,
    productionCourses,
    curriculumRows: JSON.parse(curriculumText),
    engineeringTargets,
    reviewedIdentityAssignments: JSON.parse(priorPackageText).dataset?.courseAssignments || [],
  });
  const outputPath = await writeLocalMatchingReport(report, backendRoot);

  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Local dry-run report: ${outputPath}`);
} catch (error) {
  console.error(`PNU course offering match failed: ${error.message}`);
  process.exitCode = 1;
}
