#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(here, '..');
const backupRoot = resolve(
  backendRoot,
  'data',
  'local',
  'pnu-course-production-backups',
);

function sha256(text) {
  const hash = createHash('sha256');
  hash.end(Buffer.from(text, 'utf8'));
  return hash.digest('hex');
}

async function fetchAllCourses(supabase, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('course')
      .select('*')
      .order('course_id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Course backup query failed: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    require('dotenv').config({ path: join(backendRoot, '.env') });
  }
  const configuredUrl = process.env.SUPABASE_URL;
  const configuredKey = process.env.SUPABASE_KEY;
  if (!configuredUrl || !configuredKey) throw new Error('Supabase configuration is missing');
  const target = new URL(configuredUrl);
  const projectReference = target.hostname.split('.')[0];
  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const outputDirectory = resolve(backupRoot, timestamp);
  if (!outputDirectory.startsWith(`${backupRoot}${sep}`)) {
    throw new Error('Refusing to write outside the gitignored backup directory');
  }

  const supabase = require('../supabaseClient.js');
  const courses = await fetchAllCourses(supabase);
  if (courses.length !== 1875) {
    throw new Error(`Production course count mismatch: expected 1875, received ${courses.length}`);
  }

  const response = await fetch(`${configuredUrl}/rest/v1/`, {
    headers: {
      apikey: configuredKey,
      authorization: `Bearer ${configuredKey}`,
      accept: 'application/openapi+json',
    },
  });
  if (!response.ok) throw new Error(`Schema metadata request failed with status ${response.status}`);
  const openApi = await response.json();
  const courseSchema = openApi.definitions?.course ?? null;
  if (!courseSchema) throw new Error('Production course schema is not exposed');

  const courseText = `${JSON.stringify(courses, null, 2)}\n`;
  const schemaEvidence = {
    capturedAt: new Date().toISOString(),
    target: {
      host: target.hostname,
      projectReference,
    },
    postgrestSchemas: {
      course: courseSchema,
      courseOfferingPresent: Boolean(openApi.definitions?.course_offering),
      courseMetadataPresent: Boolean(openApi.definitions?.course_metadata),
    },
    catalogEvidence: {
      constraints: 'UNAVAILABLE_WITH_CONFIGURED_POSTGREST_ACCESS',
      rowLevelSecurity: 'UNAVAILABLE_WITH_CONFIGURED_POSTGREST_ACCESS',
      policies: 'UNAVAILABLE_WITH_CONFIGURED_POSTGREST_ACCESS',
    },
  };
  const schemaText = `${JSON.stringify(schemaEvidence, null, 2)}\n`;
  const manifest = {
    capturedAt: schemaEvidence.capturedAt,
    target: schemaEvidence.target,
    courseCount: courses.length,
    officialCourseNumberColumnPresent: Object.hasOwn(
      courseSchema.properties || {},
      'official_course_number',
    ),
    courseOfferingTablePresent: schemaEvidence.postgrestSchemas.courseOfferingPresent,
    courseMetadataTablePresent: schemaEvidence.postgrestSchemas.courseMetadataPresent,
    checksums: {
      courseRowsSha256: sha256(courseText),
      schemaEvidenceSha256: sha256(schemaText),
    },
    completeness: {
      courseRows: 'COMPLETE',
      schema: 'POSTGREST_EXPOSED_SCHEMA_ONLY',
      constraintsRlsPolicies: 'NOT_VERIFIABLE_WITH_CONFIGURED_ACCESS',
    },
  };
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(join(outputDirectory, 'course-rows.json'), courseText, 'utf8'),
    writeFile(join(outputDirectory, 'schema-evidence.json'), schemaText, 'utf8'),
    writeFile(join(outputDirectory, 'manifest.json'), manifestText, 'utf8'),
    writeFile(
      join(outputDirectory, 'checksums.sha256'),
      [
        `${manifest.checksums.courseRowsSha256}  course-rows.json`,
        `${manifest.checksums.schemaEvidenceSha256}  schema-evidence.json`,
        `${sha256(manifestText)}  manifest.json`,
        '',
      ].join('\n'),
      'utf8',
    ),
  ]);

  console.log(`Production course backup: ${outputDirectory}`);
  console.log(`Target host: ${target.hostname}`);
  console.log(`Project reference: ${projectReference}`);
  console.log(`Course count: ${courses.length}`);
  console.log(`Course rows SHA-256: ${manifest.checksums.courseRowsSha256}`);
  console.log(`Schema evidence SHA-256: ${manifest.checksums.schemaEvidenceSha256}`);
  console.log(`Manifest SHA-256: ${sha256(manifestText)}`);
  console.log('Constraint/RLS/policy evidence: unavailable with configured PostgREST access');
} catch (error) {
  console.error(`Production course backup failed: ${error.message}`);
  process.exitCode = 1;
}
