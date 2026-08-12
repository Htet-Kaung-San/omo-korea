#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const {
  applicationDatasetPath,
  createApplicationDataset,
  datasetChecksum,
  parseApplicationArguments,
  writeLocalJson,
} = require('./lib/pnuCourseApplication.cjs');
const { fetchProductionCourses } = require('./lib/pnuCourseMatching.cjs');

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(here, '..');

try {
  const options = parseApplicationArguments(
    process.argv.slice(2).filter((argument) => argument !== '--apply'),
  );
  const term = `${options.academicYear}-${options.semester}`;
  const phase5Path = join(
    backendRoot,
    'data',
    'local',
    'pnu-course-production-review',
    `${term}.json`,
  );
  const [phase5Report, restrictionSnapshot] = await Promise.all([
    readFile(phase5Path, 'utf8').then(JSON.parse),
    readFile(join(backendRoot, 'data', 'local', 'pnu-course-restrictions', `${term}.json`), 'utf8').then(JSON.parse),
  ]);
  const existingDatasetPath = applicationDatasetPath(
    backendRoot,
    options.academicYear,
    options.semester,
  );
  const priorDataset = await readFile(existingDatasetPath, 'utf8')
    .then((text) => JSON.parse(text).dataset)
    .catch(() => null);

  console.log(`Preparing deterministic PNU course application dataset for ${term}`);
  console.log('Mode: SELECT-only production verification and gitignored local output');
  const supabase = require('../supabaseClient.js');
  const productionCourses = await fetchProductionCourses(supabase);
  const dataset = createApplicationDataset({
    phase5Report,
    productionCourses,
    restrictionSnapshot,
    priorDataset,
  });
  const wrapper = {
    datasetSha256: datasetChecksum(dataset),
    dataset,
  };
  const outputPath = applicationDatasetPath(
    backendRoot,
    options.academicYear,
    options.semester,
  );
  await writeLocalJson(
    outputPath,
    wrapper,
    join(backendRoot, 'data', 'local', 'pnu-course-application'),
  );
  console.log(
    JSON.stringify(
      {
        datasetSha256: wrapper.datasetSha256,
        courseAssignments: dataset.courseAssignments.length,
        courseOfferings: dataset.courseOfferings.length,
        explicitEnglishOfferings: dataset.courseOfferings.filter(
          (row) => row.is_english_taught === true,
        ).length,
        courseRestrictions: dataset.courseRestrictions.length,
        courseRestrictionExceptions: dataset.courseRestrictionExceptions.length,
      },
      null,
      2,
    ),
  );
  console.log(`Local application dataset: ${outputPath}`);
} catch (error) {
  console.error(`PNU course application dataset preparation failed: ${error.message}`);
  process.exitCode = 1;
}
