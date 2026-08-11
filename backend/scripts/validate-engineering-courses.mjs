#!/usr/bin/env node

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { validateWorkbook } = require('./lib/engineeringCourseValidation.cjs');

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(here, '..');
const workbookPath = join(backendRoot, 'data', 'engineering_courses.xlsx');
const mappingPath = join(backendRoot, 'config', 'engineering-course-major-mapping.json');

function printGroup(title, items, formatter) {
  console.log(`\n${title}: ${items.length}`);
  items.forEach((item) => console.log(`  - ${formatter(item)}`));
}

function printReport(report) {
  console.log('Engineering course workbook validation');
  console.log('Mode: local read-only validation (no Supabase client is loaded)');
  console.log(`Sheets: ${report.sheetNames.join(', ')}`);
  Object.entries(report.sheets).forEach(([name, sheet]) => {
    console.log(`  ${name}: ${sheet.rowCount} rows; columns: ${sheet.columns.join(', ')}`);
  });

  printGroup('Errors', report.errors, (error) => error);
  printGroup('Warnings', report.warnings, (warning) => warning);
  printGroup(
    'Duplicate workbook course identifiers',
    report.duplicateWorkbookCourseIds,
    (group) => `${group.value} (workbook rows ${group.rows.join(', ')})`,
  );
  printGroup(
    'Duplicate course names',
    report.duplicateCourseNames,
    (group) =>
      `${group.value} (workbook course identifiers ${group.workbookCourseIds.join(', ')})`,
  );
  printGroup(
    'Malformed or suspicious course names',
    report.malformedCourseNames,
    (item) =>
      `row ${item.row}, workbookCourseId ${item.workbookCourseId}: ${JSON.stringify(item.courseName)} - ${item.reasons.join('; ')}`,
  );
  printGroup(
    'Decimal-credit courses',
    report.decimalCredits,
    (item) =>
      `row ${item.row}, workbookCourseId ${item.workbookCourseId}: ${item.courseName} (${item.credit} credits)`,
  );
  printGroup(
    'Confirmed major mappings',
    report.majorMappings.confirmed,
    (mapping) =>
      `${mapping.workbook_major_id} ${mapping.workbook_major_name} -> production ${mapping.production_major_id}`,
  );
  printGroup(
    'Unresolved major mappings',
    report.majorMappings.unresolved,
    (mapping) =>
      `${mapping.workbook_major_id} ${mapping.workbook_major_name} -> null (${mapping.explanation})`,
  );
  console.log(
    `  Courses blocked by unresolved major mappings: ${report.majorMappings.unresolvedCourseRows}`,
  );

  console.log('\nCOURSE ID SAFETY WARNING');
  console.log(`  ${report.courseIdentifierSafety.message}`);
  console.log(`  Eligible courses: ${report.eligibleCourses.length}`);
  console.log(`  Blocked courses: ${report.blockedCourses.length}`);
  console.log(`\n${report.structureValid ? 'STRUCTURE VALID' : 'STRUCTURE INVALID'}`);
  console.log(report.importSafe ? 'IMPORT SAFE' : 'IMPORT BLOCKED');
}

try {
  const report = validateWorkbook({ workbookPath, mappingPath });
  if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else printReport(report);
  const requireImportSafe = process.argv.includes('--require-import-safe');
  if (!report.structureValid || (requireImportSafe && !report.importSafe)) process.exitCode = 1;
} catch (error) {
  console.error(`Engineering course validation failed: ${error.message}`);
  process.exitCode = 1;
}
