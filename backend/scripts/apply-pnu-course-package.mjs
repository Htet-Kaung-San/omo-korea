#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const {
  applicationDatasetPath,
  applicationResultPath,
  authorizeOperation,
  parseApplicationArguments,
  revalidateProductionCourses,
  validatePackage,
  writeLocalJson,
} = require('./lib/pnuCourseApplication.cjs');

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(here, '..');

async function fetchCurrentProductionCourses(supabase, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('course')
      .select(
        'course_id,course_name,credit,major_id,category,official_course_number',
      )
      .order('course_id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Production course revalidation failed: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

async function invokeRpc(supabase, functionName, wrapper, expectedChecksum) {
  const { data, error } = await supabase.rpc(functionName, {
    p_package: wrapper,
    p_expected_checksum: expectedChecksum,
  });
  if (error) throw new Error(`${functionName} failed: ${error.message}`);
  return data;
}

try {
  const options = parseApplicationArguments(process.argv.slice(2));
  const authorization = authorizeOperation(options, process.env);
  const manifest = JSON.parse(
    await readFile(join(backendRoot, 'config', 'pnu-course-application-manifest.json'), 'utf8'),
  );
  if (
    manifest.academicYear !== options.academicYear ||
    String(manifest.semester) !== String(options.semester)
  ) {
    throw new Error(`Only the active reviewed term ${manifest.academicYear}-${manifest.semester} may be applied`);
  }
  if (options.expectedChecksum !== manifest.datasetSha256) {
    throw new Error('Expected checksum does not match the active reviewed manifest');
  }
  const datasetPath = applicationDatasetPath(
    backendRoot,
    options.academicYear,
    options.semester,
  );
  const wrapper = JSON.parse(await readFile(datasetPath, 'utf8'));
  const verifiedChecksum = validatePackage(wrapper, options.expectedChecksum);

  console.log(`PNU course package ${options.operation} preflight`);
  console.log(
    authorization.dryRun
      ? 'Mode: DRY RUN (default; no database writes)'
      : `Mode: AUTHORIZED ${options.operation.toUpperCase()}`,
  );

  // Importing the configured client is deliberately delayed until all local
  // argument, approval, and checksum gates have passed.
  const supabase = require('../supabaseClient.js');
  const currentCourses = await fetchCurrentProductionCourses(supabase);
  const localPreflight = revalidateProductionCourses(wrapper.dataset, currentCourses);
  const databasePreflight = await invokeRpc(
    supabase,
    'preflight_reviewed_pnu_course_package',
    wrapper,
    verifiedChecksum,
  );

  let databaseResult = null;
  if (!authorization.dryRun) {
    databaseResult = await invokeRpc(
      supabase,
      options.operation === 'rollback'
        ? 'rollback_reviewed_pnu_course_package'
        : 'apply_reviewed_pnu_course_package',
      wrapper,
      verifiedChecksum,
    );
  }

  const report = {
    completedAt: new Date().toISOString(),
    operation: options.operation,
    mode: authorization.dryRun ? 'DRY_RUN' : 'AUTHORIZED_WRITE',
    datasetSha256: verifiedChecksum,
    localPreflight,
    databasePreflight,
    databaseResult,
  };
  const reportPath = applicationResultPath(
    backendRoot,
    options.academicYear,
    options.semester,
    options.operation,
  );
  await writeLocalJson(
    reportPath,
    report,
    join(backendRoot, 'data', 'local', 'pnu-course-application-results'),
  );
  console.log(JSON.stringify(report, null, 2));
  console.log(`Local result report: ${reportPath}`);
} catch (error) {
  console.error(`PNU course package stopped safely: ${error.message}`);
  process.exitCode = 1;
}
