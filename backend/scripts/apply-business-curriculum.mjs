#!/usr/bin/env node

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const {
  APPLIED_COUNTS,
  authorizeApply,
  auditAppliedDataset,
  buildBaseDataset,
  classifyDataset,
  readSource,
} = require('./lib/businessCurriculumImport.cjs');

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(here, '..');
const sourcePath = join(
  backendRoot,
  'data',
  'source',
  'business-administration',
  'PNU_business_administration_combined_datalist.csv',
);

function parseArguments(argv) {
  const options = {
    apply: false,
    databasePreflight: false,
    expectedChecksum: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--apply') options.apply = true;
    else if (argument === '--database-preflight') options.databasePreflight = true;
    else if (argument === '--expected-checksum') {
      options.expectedChecksum = String(argv[++index] || '').toLowerCase();
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

async function fetchAllProductionCourses(supabase, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('course')
      .select(
        'course_id,course_name,credit,major_id,category,official_course_number,recommended_year',
      )
      .order('course_id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Production course query failed: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

async function invokeRpc(supabase, functionName, applicationPackage, expectedChecksum) {
  const { data, error } = await supabase.rpc(functionName, {
    p_package: applicationPackage,
    p_expected_checksum: expectedChecksum,
  });
  if (error) throw new Error(`${functionName} failed: ${error.message}`);
  return data;
}

function summarize(applicationPackage) {
  const { datasetSha256, dataset } = applicationPackage;
  return {
    mode: 'LOCAL_DRY_RUN',
    datasetSha256,
    sourceSha256: dataset.source.sha256,
    counts: {
      sourceCourses: dataset.sourceCourses.length,
      existingCourses: dataset.existingCourses.length,
      newCourses: dataset.newCourses.length,
      curriculumRows: dataset.curriculumRows.length,
      crossMajorCodeCollisions: dataset.crossMajorCodeCollisions.length,
      existingCodeConflicts: dataset.existingCodeConflicts.length,
    },
    policies: dataset.applicationPolicy,
    crossMajorCodeCollisions: dataset.crossMajorCodeCollisions,
    existingCodeConflicts: dataset.existingCodeConflicts,
    existingYearChanges: dataset.existingCourses
      .filter((row) => row.previous_recommended_year !== row.recommended_year)
      .map((row) => ({
        course_id: row.course_id,
        course_name_ko: row.course_name_ko,
        previous_recommended_year: row.previous_recommended_year,
        recommended_year: row.recommended_year,
      })),
  };
}

try {
  const options = parseArguments(process.argv.slice(2));
  const authorization = authorizeApply(options, process.env);
  const sourceRows = readSource(sourcePath);
  const baseDataset = buildBaseDataset(sourceRows);

  // The protected client is imported only after local source validation passes.
  const supabase = require('../supabaseClient.js');
  const productionCourses = await fetchAllProductionCourses(supabase);
  const alreadyApplied = productionCourses.length === APPLIED_COUNTS.productionCourses;
  if (alreadyApplied) {
    const appliedAudit = auditAppliedDataset(baseDataset, productionCourses);
    console.log(JSON.stringify(appliedAudit, null, 2));
    if (!authorization.dryRun) {
      throw new Error('Business curriculum is already applied; refusing a repeat apply');
    }
    console.log('No database writes performed.');
  } else {
    const applicationPackage = classifyDataset(baseDataset, productionCourses);
    const summary = summarize(applicationPackage);
    console.log(JSON.stringify(summary, null, 2));

    if (
      options.expectedChecksum &&
      options.expectedChecksum !== applicationPackage.datasetSha256
    ) {
      throw new Error('Expected checksum does not match the current reviewed dataset');
    }

    let databasePreflight = null;
    if (options.databasePreflight || !authorization.dryRun) {
      databasePreflight = await invokeRpc(
        supabase,
        'preflight_reviewed_business_curriculum',
        applicationPackage,
        applicationPackage.datasetSha256,
      );
      console.log(JSON.stringify({ databasePreflight }, null, 2));
    }

    if (!authorization.dryRun) {
      const databaseResult = await invokeRpc(
        supabase,
        'apply_reviewed_business_curriculum',
        applicationPackage,
        applicationPackage.datasetSha256,
      );
      console.log(JSON.stringify({ databaseResult }, null, 2));
    } else {
      console.log('No database writes performed.');
    }
  }
} catch (error) {
  console.error(`Business curriculum import stopped safely: ${error.message}`);
  process.exitCode = 1;
}
