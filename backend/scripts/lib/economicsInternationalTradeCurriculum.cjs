const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const XLSX = require('xlsx');

const SOURCE_ROOT = join(__dirname, '..', '..', 'data', 'source');
const SOURCES = Object.freeze({
  trade: {
    path: join(SOURCE_ROOT, 'economics-and-international-trade', 'trade_courses.xlsx'),
    sha256: 'fb985ce5e7f1af6a44502cdb78e3fea09e1b8bd69a5575cfdd7da96441a1a941',
    majorId: 68,
    majorName: 'International Trade',
    sourceUrl: 'https://pnutrade.pusan.ac.kr/pnutrade/3554/subview.do',
  },
  globalStudies: {
    path: join(SOURCE_ROOT, 'economics-and-international-trade', 'global_studies_courses.xlsx'),
    sha256: '953135139bdd57194de4a8e16d27779ed1472672632c0848b2403a7116bb098c',
    majorId: 71,
    majorName: 'International Studies',
    sourceUrl: 'https://pnudgs.com/page/03_02.php',
  },
  tourism: {
    path: join(SOURCE_ROOT, 'economics-and-international-trade', 'tourism_convention_courses_2021_2026.xlsx'),
    sha256: '933b9c38ba7f92085db8df52670cced705b96ddfb00c71f6e055380ee1a35950',
    majorId: 70,
    majorName: 'Tourism and Convention',
    sourceUrl: 'https://convention.pusan.ac.kr/convention/16013/subview.do',
  },
  websites: {
    path: join(SOURCE_ROOT, 'department-websites', 'PNU_Department_Official_Websites.xlsx'),
    sha256: 'd24f199c2f080d0a0b046fb1da74723fac0c7b89a01f0321e3a458aefe36cec5',
  },
});

const EXPECTED = Object.freeze({
  productionCourses: 1924,
  productionByMajor: { 68: 22, 70: 14, 71: 1 },
  sourceByMajor: { 68: 43, 70: 43, 71: 50 },
  matchedByMajor: { 68: 22, 70: 14, 71: 1 },
  insertedByMajor: { 68: 21, 70: 29, 71: 49 },
  updatedCourses: 37,
  insertedCourses: 99,
  postApplyCourses: 2023,
  tourismCurriculumRows: 85,
  departmentWebsites: 15,
});

const DEPARTMENT_MAJOR_IDS = Object.freeze({
  'Architecture Engineering': 42,
  'Aerospace Engineering': 41,
  'Chemical and Biomolecular Engineering': 33,
  'Environmental Engineering': 34,
  'Electronics Engineering': 35,
  'Electrical Engineering': 36,
  'Industrial Engineering': 40,
  'Materials Science and Engineering': 39,
  'Polymer Engineering': 31,
  'Ship and Ocean Engineering': 38,
  'Urban Planning and Engineering': 44,
  'Business Administration': 73,
  'Tourism and Convention': 70,
  'International Trade': 68,
  'Global Studies': 71,
});

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

function sourceHash(path) {
  return sha256(readFileSync(path));
}

function assertSource(spec) {
  const actual = sourceHash(spec.path);
  if (actual !== spec.sha256) {
    throw new Error(`Source checksum mismatch for ${spec.path}: ${actual}`);
  }
}

function sheetRows(spec, sheetName) {
  assertSource(spec);
  const workbook = XLSX.readFile(spec.path, { cellDates: false });
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`${spec.path} is missing sheet ${sheetName}`);
  return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\uB9AC\uB354\uC27D/g, '\uB9AC\uB354\uC2ED')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

function canonicalCurrentCode(value) {
  const source = String(value || '').trim().toUpperCase();
  const legacy = source.match(/^([A-Z]{2})(\d{2})(\d{3})$/);
  return legacy ? `${legacy[1]}${legacy[2]}00${legacy[3]}` : source || null;
}

function mapCategory(value) {
  const category = String(value || '').trim().toUpperCase();
  if (['FOUNDATION', 'BASIC', 'REQUIRED'].includes(category)) return 'REQUIRED';
  if (category === 'ELECTIVE') return 'ELECTIVE';
  throw new Error(`Unsupported curriculum category: ${value}`);
}

function requireHeaders(rows, headers, label) {
  if (!rows.length) throw new Error(`${label} has no data rows`);
  const actual = Object.keys(rows[0]);
  if (actual.join('|') !== headers.join('|')) {
    throw new Error(`${label} headers changed: ${actual.join(', ')}`);
  }
}

function duplicateKeys(rows, selector) {
  const counts = new Map();
  for (const row of rows) {
    const key = selector(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key);
}

function validateCourse(row, label, { codeRequired = false } = {}) {
  if (!row.course_name || !normalizeName(row.course_name)) throw new Error(`${label} has a blank course name`);
  if (![1, 2, 3].includes(Number(row.credit))) throw new Error(`${label} has invalid credit: ${row.credit}`);
  mapCategory(row.category);
  if (codeRequired && !/^[A-Z]{2}\d{5,7}$/.test(String(row.course_code || ''))) {
    throw new Error(`${label} has invalid official code: ${row.course_code}`);
  }
}

function readDepartmentWebsites() {
  const rows = sheetRows(SOURCES.websites, 'PNU Departments');
  requireHeaders(rows, ['Department (English)', 'Department (Korean)', 'Official PNU Website'], 'department websites');
  if (rows.length !== EXPECTED.departmentWebsites) throw new Error(`Expected 15 department websites; received ${rows.length}`);
  for (const row of rows) {
    const url = new URL(row['Official PNU Website']);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('pusan.ac.kr')) {
      throw new Error(`Non-PNU department URL: ${url.href}`);
    }
  }
  if (duplicateKeys(rows, (row) => normalizeName(row['Department (English)'])).length) {
    throw new Error('Duplicate English department names');
  }
  return rows.map((row) => ({
    majorId: DEPARTMENT_MAJOR_IDS[row['Department (English)']],
    departmentEn: row['Department (English)'],
    departmentKo: row['Department (Korean)'],
    websiteUrl: row['Official PNU Website'],
  })).map((row) => {
    if (!row.majorId) throw new Error(`Unmapped department website: ${row.departmentEn}`);
    return row;
  });
}

function readTrade() {
  const rows = sheetRows(SOURCES.trade, 'courses');
  requireHeaders(rows, ['course_id', 'course_name', 'credit', 'major_id', 'category'], 'Trade courses');
  if (rows.length !== 43) throw new Error(`Expected 43 Trade courses; received ${rows.length}`);
  rows.forEach((row, index) => validateCourse(row, `Trade row ${index + 2}`));
  if (duplicateKeys(rows, (row) => normalizeName(row.course_name)).length) throw new Error('Duplicate Trade course names');
  return rows.map((row) => ({
    major_id: SOURCES.trade.majorId,
    course_name: String(row.course_name).trim(),
    course_name_en: null,
    credit: Number(row.credit),
    category: mapCategory(row.category),
    official_course_number: null,
    source_course_code: null,
    source_url: SOURCES.trade.sourceUrl,
    source_file_sha256: SOURCES.trade.sha256,
  }));
}

function readGlobalStudies() {
  const rows = sheetRows(SOURCES.globalStudies, 'courses');
  requireHeaders(rows, ['course_id', 'course_code', 'course_name', 'credit', 'category'], 'Global Studies courses');
  if (rows.length !== 50) throw new Error(`Expected 50 Global Studies courses; received ${rows.length}`);
  rows.forEach((row, index) => validateCourse(row, `Global Studies row ${index + 2}`, { codeRequired: true }));
  if (duplicateKeys(rows, (row) => canonicalCurrentCode(row.course_code)).length) throw new Error('Duplicate Global Studies course codes');
  return rows.map((row) => ({
    major_id: SOURCES.globalStudies.majorId,
    course_name: String(row.course_name).trim(),
    course_name_en: String(row.course_name).trim(),
    credit: Number(row.credit),
    category: mapCategory(row.category),
    official_course_number: canonicalCurrentCode(row.course_code),
    source_course_code: String(row.course_code).trim(),
    source_url: SOURCES.globalStudies.sourceUrl,
    source_file_sha256: SOURCES.globalStudies.sha256,
  }));
}

function readTourism() {
  const rows = sheetRows(SOURCES.tourism, 'courses');
  requireHeaders(rows, ['course_id', 'course_code', 'course_name', 'credit', 'category', 'curriculum_year'], 'Tourism courses');
  if (rows.length !== 85) throw new Error(`Expected 85 Tourism curriculum rows; received ${rows.length}`);
  rows.forEach((row, index) => {
    validateCourse(row, `Tourism row ${index + 2}`, { codeRequired: true });
    if (![2021, 2026].includes(Number(row.curriculum_year))) throw new Error(`Unexpected Tourism curriculum year: ${row.curriculum_year}`);
  });
  const current = rows.filter((row) => Number(row.curriculum_year) === 2026);
  if (current.length !== 43) throw new Error(`Expected 43 current Tourism courses; received ${current.length}`);
  if (duplicateKeys(current, (row) => normalizeName(row.course_name)).length) throw new Error('Duplicate 2026 Tourism names');
  const courses = current.map((row) => ({
    major_id: SOURCES.tourism.majorId,
    course_name: String(row.course_name).trim(),
    course_name_en: null,
    credit: Number(row.credit),
    category: mapCategory(row.category),
    official_course_number: String(row.course_code).trim(),
    source_course_code: String(row.course_code).trim(),
    source_url: SOURCES.tourism.sourceUrl,
    source_file_sha256: SOURCES.tourism.sha256,
  }));
  const currentByName = new Map(courses.map((row) => [normalizeName(row.course_name), row]));
  const curriculumRows = rows.map((row) => {
    const currentCourse = currentByName.get(normalizeName(row.course_name));
    if (!currentCourse) throw new Error(`2021-only Tourism course needs review: ${row.course_name}`);
    return {
      major_id: SOURCES.tourism.majorId,
      course_name: currentCourse.course_name,
      current_official_course_number: currentCourse.official_course_number,
      curriculum_year: Number(row.curriculum_year),
      source_course_code: String(row.course_code).trim(),
      category: mapCategory(row.category),
      recommended_year: null,
      grade_semester: null,
      source_department: '\uAD00\uAD11\uCEE8\uBCA4\uC158\uD559\uACFC',
      source_file_sha256: SOURCES.tourism.sha256,
    };
  });
  return { courses, curriculumRows };
}

function buildSourceDataset() {
  const tourism = readTourism();
  const courses = [...readTrade(), ...readGlobalStudies(), ...tourism.courses];
  if (courses.length !== 136) throw new Error(`Expected 136 source catalog courses; received ${courses.length}`);
  return {
    schemaVersion: 1,
    mode: 'REVIEWED_ECONOMICS_AND_INTERNATIONAL_TRADE_CURRICULA',
    sources: Object.fromEntries(Object.entries(SOURCES).map(([key, value]) => [key, {
      fileName: value.path.split(/[\\/]/).pop(),
      sha256: value.sha256,
      sourceUrl: value.sourceUrl || null,
    }])),
    expectedCounts: EXPECTED,
    departmentWebsites: readDepartmentWebsites(),
    sourceCourses: courses,
    curriculumRows: tourism.curriculumRows,
  };
}

function classifyDataset(sourceDataset, productionCourses) {
  if (productionCourses.length !== EXPECTED.productionCourses) {
    throw new Error(`Production course count drifted: expected ${EXPECTED.productionCourses}, received ${productionCourses.length}`);
  }
  const existingCourses = [];
  const newCourses = [];
  for (const source of sourceDataset.sourceCourses) {
    const sameMajor = productionCourses.filter((row) => Number(row.major_id) === source.major_id);
    const codeMatches = source.official_course_number
      ? sameMajor.filter((row) => row.official_course_number === source.official_course_number)
      : [];
    const nameMatches = sameMajor.filter((row) =>
      normalizeName(row.course_name) === normalizeName(source.course_name)
      || normalizeName(row.course_name_en) === normalizeName(source.course_name));
    const candidates = [...new Map([...codeMatches, ...nameMatches].map((row) => [row.course_id, row])).values()];
    if (candidates.length > 1) throw new Error(`Ambiguous production identity: ${source.major_id} ${source.course_name}`);
    if (!candidates.length) {
      newCourses.push(source);
      continue;
    }
    const current = candidates[0];
    if (Number(current.credit) !== source.credit) throw new Error(`Credit conflict for ${source.course_name}`);
    existingCourses.push({
      ...source,
      course_id: Number(current.course_id),
      previous_course_name: current.course_name,
      previous_credit: Number(current.credit),
      previous_major_id: Number(current.major_id),
      previous_category: current.category,
      previous_official_course_number: current.official_course_number || null,
      previous_course_name_en: current.course_name_en || null,
    });
  }
  const countsByMajor = (rows) => Object.fromEntries([68, 70, 71].map((majorId) => [majorId, rows.filter((row) => row.major_id === majorId).length]));
  const matchedByMajor = countsByMajor(existingCourses);
  const insertedByMajor = countsByMajor(newCourses);
  if (stableStringify(matchedByMajor) !== stableStringify(EXPECTED.matchedByMajor)
    || stableStringify(insertedByMajor) !== stableStringify(EXPECTED.insertedByMajor)) {
    throw new Error(`Classification counts drifted: ${JSON.stringify({ matchedByMajor, insertedByMajor })}`);
  }
  const dataset = { ...sourceDataset, existingCourses, newCourses };
  return { dataset, datasetSha256: sha256(stableStringify(dataset)) };
}

module.exports = {
  EXPECTED,
  SOURCES,
  buildSourceDataset,
  canonicalCurrentCode,
  classifyDataset,
  mapCategory,
  normalizeName,
  sha256,
  stableStringify,
};
