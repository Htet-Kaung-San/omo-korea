#!/usr/bin/env node

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  EXPECTED,
  buildSourceDataset,
  classifyDataset,
} = require('./lib/economicsInternationalTradeCurriculum.cjs');

function parseArguments(argv) {
  const options = { apply: false, databasePreflight: false, expectedChecksum: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--apply') options.apply = true;
    else if (argument === '--database-preflight') options.databasePreflight = true;
    else if (argument === '--expected-checksum') {
      options.expectedChecksum = String(argv[++index] || '').toLowerCase();
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function authorizeApply(options, environment = process.env) {
  if (!options.apply) return { dryRun: true };
  if (environment.ECONOMICS_CURRICULA_APPROVED !== 'true') {
    throw new Error('--apply requires ECONOMICS_CURRICULA_APPROVED=true');
  }
  if (!/^[0-9a-f]{64}$/.test(options.expectedChecksum || '')) {
    throw new Error('--apply requires --expected-checksum with a 64-character SHA-256');
  }
  return { dryRun: false };
}

async function fetchAllCourses(supabase, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('course')
      .select('course_id,course_name,course_name_en,credit,major_id,category,official_course_number,recommended_year')
      .order('course_id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Production course query failed: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

async function invokeRpc(supabase, functionName, applicationPackage) {
  const { data, error } = await supabase.rpc(functionName, {
    p_package: applicationPackage,
    p_expected_checksum: applicationPackage.datasetSha256,
  });
  if (error) throw new Error(`${functionName} failed: ${error.message}`);
  return data;
}

try {
  const options = parseArguments(process.argv.slice(2));
  const authorization = authorizeApply(options);
  const sourceDataset = buildSourceDataset();
  const supabase = require('../supabaseClient.js');
  const productionCourses = await fetchAllCourses(supabase);

  if (productionCourses.length === EXPECTED.postApplyCourses) {
    const counts = Object.fromEntries([68, 70, 71].map((majorId) => [
      majorId,
      productionCourses.filter((row) => Number(row.major_id) === majorId).length,
    ]));
    if (counts[68] !== 43 || counts[70] !== 43 || counts[71] !== 50) {
      throw new Error(`Applied course counts drifted: ${JSON.stringify(counts)}`);
    }
    if (!authorization.dryRun) {
      throw new Error('Economics curricula are already applied; refusing a repeat apply');
    }
    console.log(JSON.stringify({ mode: 'ALREADY_APPLIED_READ_ONLY_AUDIT', counts }, null, 2));
    console.log('No database writes performed.');
    process.exit(0);
  }

  const applicationPackage = classifyDataset(sourceDataset, productionCourses);
  console.log(JSON.stringify({
    mode: 'LOCAL_DRY_RUN',
    datasetSha256: applicationPackage.datasetSha256,
    counts: {
      sourceCourses: applicationPackage.dataset.sourceCourses.length,
      existingCourses: applicationPackage.dataset.existingCourses.length,
      newCourses: applicationPackage.dataset.newCourses.length,
      curriculumRows: applicationPackage.dataset.curriculumRows.length,
      departmentWebsites: applicationPackage.dataset.departmentWebsites.length,
    },
  }, null, 2));

  if (options.expectedChecksum
    && options.expectedChecksum !== applicationPackage.datasetSha256) {
    throw new Error('Expected checksum does not match the reviewed dataset');
  }

  if (options.databasePreflight || !authorization.dryRun) {
    const result = await invokeRpc(
      supabase,
      'preflight_reviewed_economics_curricula',
      applicationPackage,
    );
    console.log(JSON.stringify({ databasePreflight: result }, null, 2));
  }

  if (!authorization.dryRun) {
    const result = await invokeRpc(
      supabase,
      'apply_reviewed_economics_curricula',
      applicationPackage,
    );
    console.log(JSON.stringify({ databaseResult: result }, null, 2));
  } else console.log('No database writes performed.');
} catch (error) {
  console.error(`Economics curriculum import stopped safely: ${error.message}`);
  process.exitCode = 1;
}

export { authorizeApply, parseArguments };
