const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');

const SOURCE_SHA256 = '7d64e59d8baa403c9264f021a9585597fcc8bc8a93f3b290f738824b7bcd5d6d';
const BUSINESS_MAJOR_ID = 73;
const BUSINESS_COLLEGE_ID = 4;
const EXPECTED_COUNTS = Object.freeze({
  sourceRows: 84,
  existingCourses: 35,
  newCourses: 49,
  curriculumRows: 160,
  crossMajorCodeCollisions: 1,
  existingCodeConflicts: 2,
  productionCourses: 1875,
  productionBusinessCourses: 35,
});
const APPLIED_COUNTS = Object.freeze({
  productionCourses: EXPECTED_COUNTS.productionCourses + EXPECTED_COUNTS.newCourses,
  productionBusinessCourses: EXPECTED_COUNTS.productionBusinessCourses + EXPECTED_COUNTS.newCourses,
});

const EXPECTED_HEADERS = [
  'curriculum_years',
  'major_name',
  '학과',
  'category',
  'course_code',
  'course_name_ko',
  'course_name_en',
  'credit',
  'grade_semester',
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizedSourceText(value) {
  return Buffer.isBuffer(value)
    ? value.toString('utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
    : String(value || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

function normalizedSourceSha256(value) {
  return sha256(Buffer.from(normalizedSourceText(value), 'utf8'));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const source = String(text || '').replace(/^\uFEFF/, '');

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error('CSV ended inside a quoted field');
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    if (row.some((value) => value !== '')) rows.push(row);
  }
  if (rows.length < 2) throw new Error('CSV contains no data rows');
  const headers = rows.shift();
  if (headers.join('|') !== EXPECTED_HEADERS.join('|')) {
    throw new Error(`Unexpected CSV headers: ${headers.join(', ')}`);
  }
  return rows.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`CSV row ${index + 2} has ${values.length} fields; expected ${headers.length}`);
    }
    return Object.fromEntries(headers.map((header, column) => [header, values[column].trim()]));
  });
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

function mapCategory(value) {
  if (value === '전공기초' || value === '전공필수') return 'REQUIRED';
  if (value === '전공선택') return 'ELECTIVE';
  throw new Error(`Unsupported curriculum category: ${value}`);
}

function parseCurriculumYears(value) {
  const years = String(value)
    .split(',')
    .map((part) => Number(part.trim()));
  if (
    years.length === 0 ||
    years.some((year) => ![2023, 2024, 2026].includes(year)) ||
    new Set(years).size !== years.length
  ) {
    throw new Error(`Invalid curriculum years: ${value}`);
  }
  return years.sort((a, b) => a - b);
}

function parseRecommendedYear(value) {
  const match = String(value).match(/^([1-4])-/);
  if (!match) throw new Error(`Invalid grade/semester value: ${value}`);
  return Number(match[1]);
}

function duplicateValues(rows, keyFor) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFor(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key);
}

function normalizeSourceRows(rawRows) {
  if (rawRows.length !== EXPECTED_COUNTS.sourceRows) {
    throw new Error(`Expected ${EXPECTED_COUNTS.sourceRows} source rows; received ${rawRows.length}`);
  }
  const rows = rawRows.map((row) => {
    if (row.major_name !== 'Business Administration' || row['학과'] !== '경영학과') {
      throw new Error(`Unexpected major identity for ${row.course_code}`);
    }
    if (!/^[A-Z]{2}[0-9]{7}$/.test(row.course_code)) {
      throw new Error(`Invalid official course code: ${row.course_code}`);
    }
    if (!row.course_name_ko || !row.course_name_en || /\?{2,}/.test(row.course_name_ko + row.category)) {
      throw new Error(`Missing or corrupted localized data for ${row.course_code}`);
    }
    if (Number(row.credit) !== 3) throw new Error(`Unexpected credit for ${row.course_code}`);
    const curriculumYears = parseCurriculumYears(row.curriculum_years);
    return {
      source_course_code: row.course_code,
      course_name_ko: row.course_name_ko,
      course_name_en: row.course_name_en,
      credit: Number(row.credit),
      category: mapCategory(row.category),
      source_category: row.category,
      recommended_year: parseRecommendedYear(row.grade_semester),
      grade_semester: row.grade_semester,
      curriculum_years: curriculumYears,
      source_department: row['학과'],
    };
  });
  const duplicateCodes = duplicateValues(rows, (row) => row.source_course_code);
  const duplicateKoreanNames = duplicateValues(rows, (row) => normalizeName(row.course_name_ko));
  if (duplicateCodes.length) throw new Error(`Duplicate source course codes: ${duplicateCodes.join(', ')}`);
  if (duplicateKoreanNames.length) {
    throw new Error(`Duplicate Korean course names: ${duplicateKoreanNames.join(', ')}`);
  }
  const englishDuplicates = duplicateValues(rows, (row) => normalizeName(row.course_name_en));
  if (englishDuplicates.length !== 1 || englishDuplicates[0] !== normalizeName('Business History')) {
    throw new Error(`Unexpected English-name duplicates: ${englishDuplicates.join(', ')}`);
  }
  const categoryCounts = Object.fromEntries(
    [...new Set(rows.map((row) => row.source_category))].map((category) => [
      category,
      rows.filter((row) => row.source_category === category).length,
    ]),
  );
  if (
    categoryCounts['전공기초'] !== 4 ||
    categoryCounts['전공필수'] !== 9 ||
    categoryCounts['전공선택'] !== 71
  ) {
    throw new Error(`Unexpected category counts: ${JSON.stringify(categoryCounts)}`);
  }
  return rows.sort((a, b) => a.source_course_code.localeCompare(b.source_course_code));
}

function readSource(sourcePath) {
  const bytes = readFileSync(sourcePath);
  const sourceText = normalizedSourceText(bytes);
  const actualSha = normalizedSourceSha256(sourceText);
  if (actualSha !== SOURCE_SHA256) {
    throw new Error(`Business curriculum source checksum mismatch: ${actualSha}`);
  }
  return normalizeSourceRows(parseCsv(sourceText));
}

function buildBaseDataset(sourceRows) {
  const curriculumRows = sourceRows.flatMap((row) =>
    row.curriculum_years.map((curriculumYear) => ({
      source_course_code: row.source_course_code,
      course_name_ko: row.course_name_ko,
      curriculum_year: curriculumYear,
      category: row.category,
      recommended_year: row.recommended_year,
      grade_semester: row.grade_semester,
      source_department: row.source_department,
    })),
  );
  if (curriculumRows.length !== EXPECTED_COUNTS.curriculumRows) {
    throw new Error(`Expected ${EXPECTED_COUNTS.curriculumRows} curriculum rows; received ${curriculumRows.length}`);
  }
  return {
    schemaVersion: 1,
    mode: 'REVIEWED_BUSINESS_CURRICULUM_IMPORT',
    source: {
      fileName: 'PNU_business_administration_combined_datalist.csv',
      sha256: SOURCE_SHA256,
    },
    major: {
      major_id: BUSINESS_MAJOR_ID,
      major_name: 'Business Administration',
      college_id: BUSINESS_COLLEGE_ID,
      college_name: 'College of Business',
    },
    expectedCounts: { ...EXPECTED_COUNTS },
    sourceCourses: sourceRows,
    curriculumRows,
  };
}

function classifyDataset(baseDataset, productionCourses) {
  if (productionCourses.length !== EXPECTED_COUNTS.productionCourses) {
    throw new Error(
      `Production course count drifted: expected ${EXPECTED_COUNTS.productionCourses}, received ${productionCourses.length}`,
    );
  }
  const businessCourses = productionCourses.filter(
    (row) => Number(row.major_id) === BUSINESS_MAJOR_ID,
  );
  if (businessCourses.length !== EXPECTED_COUNTS.productionBusinessCourses) {
    throw new Error(
      `Business course count drifted: expected ${EXPECTED_COUNTS.productionBusinessCourses}, received ${businessCourses.length}`,
    );
  }
  const existingCourses = [];
  const newCourses = [];
  const crossMajorCodeCollisions = [];
  for (const source of baseDataset.sourceCourses) {
    const nameMatches = businessCourses.filter(
      (row) => normalizeName(row.course_name) === normalizeName(source.course_name_ko),
    );
    if (nameMatches.length > 1) {
      throw new Error(`Ambiguous Business course name: ${source.course_name_ko}`);
    }
    if (nameMatches.length === 1) {
      const current = nameMatches[0];
      existingCourses.push({
        ...source,
        course_id: Number(current.course_id),
        previous_course_name: current.course_name,
        previous_credit: Number(current.credit),
        previous_major_id: Number(current.major_id),
        previous_category: current.category,
        previous_recommended_year:
          current.recommended_year === null || current.recommended_year === undefined
            ? null
            : Number(current.recommended_year),
        previous_official_course_number: current.official_course_number ?? null,
      });
      continue;
    }
    const globalCodeMatches = productionCourses.filter(
      (row) => row.official_course_number === source.source_course_code,
    );
    if (globalCodeMatches.length) {
      crossMajorCodeCollisions.push(
        ...globalCodeMatches.map((row) => ({
          source_course_code: source.source_course_code,
          course_name_ko: source.course_name_ko,
          existing_course_id: Number(row.course_id),
          existing_major_id: Number(row.major_id),
          existing_course_name: row.course_name,
        })),
      );
    }
    newCourses.push(source);
  }

  const existingCodeConflicts = existingCourses
    .filter(
      (row) =>
        row.previous_official_course_number &&
        row.previous_official_course_number !== row.source_course_code,
    )
    .map((row) => ({
      course_id: row.course_id,
      course_name_ko: row.course_name_ko,
      retained_official_course_number: row.previous_official_course_number,
      curriculum_course_code: row.source_course_code,
    }));

  if (
    existingCourses.length !== EXPECTED_COUNTS.existingCourses ||
    newCourses.length !== EXPECTED_COUNTS.newCourses ||
    crossMajorCodeCollisions.length !== EXPECTED_COUNTS.crossMajorCodeCollisions ||
    existingCodeConflicts.length !== EXPECTED_COUNTS.existingCodeConflicts
  ) {
    throw new Error(
      `Unexpected classification counts: ${JSON.stringify({
        existingCourses: existingCourses.length,
        newCourses: newCourses.length,
        crossMajorCodeCollisions: crossMajorCodeCollisions.length,
        existingCodeConflicts: existingCodeConflicts.length,
      })}`,
    );
  }
  const expectedCollision = crossMajorCodeCollisions[0];
  if (
    expectedCollision.source_course_code !== 'DB1600358' ||
    expectedCollision.existing_course_id !== 5934 ||
    expectedCollision.existing_major_id !== 69 ||
    normalizeName(expectedCollision.existing_course_name) !== normalizeName('회계학원리')
  ) {
    throw new Error(`Unexpected cross-major collision: ${JSON.stringify(expectedCollision)}`);
  }
  const conflictKeys = existingCodeConflicts
    .map((row) => `${row.course_id}|${row.retained_official_course_number}|${row.curriculum_course_code}`)
    .sort();
  const expectedConflictKeys = [
    '4360|EC1500015|DB1600346',
    '4386|IE3300034|DB3400702',
  ];
  if (conflictKeys.join(',') !== expectedConflictKeys.join(',')) {
    throw new Error(`Unexpected existing code conflicts: ${conflictKeys.join(', ')}`);
  }
  const drift = existingCourses.filter(
    (row) =>
      row.previous_course_name !== row.course_name_ko ||
      row.previous_credit !== row.credit ||
      row.previous_major_id !== BUSINESS_MAJOR_ID ||
      row.previous_category !== row.category,
  );
  if (drift.length) throw new Error(`Immutable existing-course drift detected for ${drift.length} rows`);

  const dataset = {
    ...baseDataset,
    applicationPolicy: {
      existingCodeConflict: 'KEEP_EXISTING_AND_STORE_CURRICULUM_CODE',
      crossMajorCodeCollision: 'INSERT_MAJOR_SCOPED_COURSE_AND_STORE_CURRICULUM_CODE',
      nullExistingCode: 'FILL_FROM_CURRICULUM_CODE',
    },
    existingCourses,
    newCourses,
    crossMajorCodeCollisions,
    existingCodeConflicts,
  };
  const datasetSha256 = sha256(stableStringify(dataset));
  return { datasetSha256, dataset };
}

function auditAppliedDataset(baseDataset, productionCourses) {
  if (productionCourses.length !== APPLIED_COUNTS.productionCourses) {
    throw new Error(
      `Applied production course count drifted: expected ${APPLIED_COUNTS.productionCourses}, received ${productionCourses.length}`,
    );
  }
  const businessCourses = productionCourses.filter(
    (row) => Number(row.major_id) === BUSINESS_MAJOR_ID,
  );
  if (businessCourses.length !== APPLIED_COUNTS.productionBusinessCourses) {
    throw new Error(
      `Applied Business course count drifted: expected ${APPLIED_COUNTS.productionBusinessCourses}, received ${businessCourses.length}`,
    );
  }

  const matchedCourses = baseDataset.sourceCourses.map((source) => {
    const matches = businessCourses.filter(
      (row) => normalizeName(row.course_name) === normalizeName(source.course_name_ko),
    );
    if (matches.length !== 1) {
      throw new Error(`Applied Business course identity mismatch: ${source.course_name_ko}`);
    }
    return { source, current: matches[0] };
  });
  const drift = matchedCourses.filter(({ source, current }) =>
    Number(current.credit) !== source.credit
    || Number(current.major_id) !== BUSINESS_MAJOR_ID
    || current.category !== source.category,
  );
  if (drift.length) {
    throw new Error(`Applied Business course drift detected for ${drift.length} rows`);
  }

  return {
    mode: 'ALREADY_APPLIED_READ_ONLY_AUDIT',
    counts: {
      productionCourses: productionCourses.length,
      businessCourses: businessCourses.length,
      matchedSourceCourses: matchedCourses.length,
      curriculumRowsExpected: baseDataset.curriculumRows.length,
    },
  };
}

function authorizeApply(options, environment = process.env) {
  if (!options.apply) return { dryRun: true };
  if (environment.BUSINESS_CURRICULUM_APPROVED !== 'true') {
    throw new Error('--apply requires BUSINESS_CURRICULUM_APPROVED=true');
  }
  if (!/^[0-9a-f]{64}$/.test(options.expectedChecksum || '')) {
    throw new Error('--apply requires --expected-checksum with a 64-character SHA-256');
  }
  return { dryRun: false };
}

module.exports = {
  APPLIED_COUNTS,
  BUSINESS_COLLEGE_ID,
  BUSINESS_MAJOR_ID,
  EXPECTED_COUNTS,
  SOURCE_SHA256,
  auditAppliedDataset,
  authorizeApply,
  buildBaseDataset,
  classifyDataset,
  mapCategory,
  normalizeName,
  normalizedSourceSha256,
  normalizeSourceRows,
  parseCsv,
  readSource,
  sha256,
  stableStringify,
};
