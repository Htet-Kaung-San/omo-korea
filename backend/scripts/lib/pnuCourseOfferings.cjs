const { mkdir, readFile, writeFile } = require('node:fs/promises');
const { dirname, join, resolve, sep } = require('node:path');

const { readXlsxWorkbookBuffer } = require('./engineeringCourseValidation.cjs');

const LANGUAGE_CODES = Object.freeze({
  E: 'ENGLISH',
  C: 'CHINESE',
  J: 'JAPANESE',
  F: 'FRENCH',
  G: 'GERMAN',
  R: 'RUSSIAN',
});

const LANGUAGE_LABEL_CODES = Object.freeze({
  영어: 'E',
  중국어: 'C',
  일본어: 'J',
  프랑스어: 'F',
  독일어: 'G',
  러시아어: 'R',
});

const COURSE_CATEGORY_CODES = Object.freeze({
  '전공필수': 'REQUIRED',
  '전공기초': 'REQUIRED',
  '전공선택': 'ELECTIVE',
});

const PUBLIC_SOURCES = Object.freeze({
  '2026-1': Object.freeze({
    noticeUrl:
      'https://onestop.pusan.ac.kr/page?menuCD=000000000000386&mode=DETAIL&seq=1964',
    attachmentText: '2026학년도 1학기 학부 개설강좌 일람표',
  }),
  '2026-2': Object.freeze({
    localFileName: '2. 2026학년도 2학기 학부 개설강좌일람표(26.7.27.9시 기준).xlsx',
    sourceLabel: 'PNU official 2026-2 undergraduate course offering workbook (2026-07-27 09:00)',
  }),
});

const REQUIRED_HEADERS = [
  '대학명',
  '주관학과명',
  '학년',
  '교과목번호',
  '분반',
  '교과목명',
  '교과목구분',
  '학점',
  '이론시간',
  '실습시간',
  '시간표',
  '수강제한인원',
  '교수명',
  '원어강의',
  '팀티칭',
  '원격강좌',
  '비고',
];

function parseArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument !== '--year' && argument !== '--semester') {
      throw new Error(`Unknown argument: ${argument}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`${argument} requires a value`);
    }
    values[argument.slice(2)] = value;
    index += 1;
  }

  if (!/^20\d{2}$/.test(values.year || '')) {
    throw new Error('--year is required and must be a four-digit academic year');
  }
  if (!['1', '2', 'SUMMER', 'WINTER'].includes(values.semester || '')) {
    throw new Error('--semester is required and must be 1, 2, SUMMER, or WINTER');
  }

  return { academicYear: Number(values.year), semester: values.semester };
}

function getSource(academicYear, semester) {
  const key = `${academicYear}-${semester}`;
  const source = PUBLIC_SOURCES[key];
  if (!source) {
    const supported = Object.keys(PUBLIC_SOURCES).join(', ');
    throw new Error(
      `No reviewed public PNU source is configured for ${key}. Supported terms: ${supported}`,
    );
  }
  return source;
}

function nullableString(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function nullableNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function mapLanguageCode(value) {
  const sourceValue = nullableString(value);
  const upperValue = sourceValue?.toUpperCase() || null;
  const code = upperValue
    ? LANGUAGE_CODES[upperValue]
      ? upperValue
      : LANGUAGE_LABEL_CODES[sourceValue] ?? null
    : null;
  const languageName = code ? LANGUAGE_CODES[code] : null;
  return {
    originalLanguageSourceValue: sourceValue,
    originalLanguageCode: code,
    originalLanguageName: languageName,
    teachingLanguage: code === 'E' ? 'ENGLISH' : code ? 'OTHER' : null,
    isEnglishTaught: code === 'E' ? true : code ? false : null,
  };
}

function mapCourseCategory(value) {
  const sourceValue = nullableString(value);
  return {
    courseCategory: sourceValue,
    canonicalCourseCategory: sourceValue ? COURSE_CATEGORY_CODES[sourceValue] ?? null : null,
  };
}

function mapRemoteStatus(value) {
  const code = nullableString(value)?.toUpperCase() || null;
  if (code === 'Y') {
    return { remoteCourseCode: code, remoteCourseStatus: 'REMOTE', isRemoteCourse: true };
  }
  if (code === 'N') {
    return { remoteCourseCode: code, remoteCourseStatus: 'NOT_REMOTE', isRemoteCourse: false };
  }
  return { remoteCourseCode: code, remoteCourseStatus: null, isRemoteCourse: null };
}

function mapTeamTeachingStatus(value) {
  const code = nullableString(value)?.toUpperCase() || null;
  if (code === 'Y') return { teamTeachingCode: code, teamTeachingStatus: 'TEAM_TAUGHT', isTeamTaught: true };
  if (code === 'N') return { teamTeachingCode: code, teamTeachingStatus: 'NOT_TEAM_TAUGHT', isTeamTaught: false };
  return { teamTeachingCode: code, teamTeachingStatus: null, isTeamTaught: null };
}

function normalizeOffering(row, context) {
  const language = mapLanguageCode(row['원어강의']);
  const remote = mapRemoteStatus(row['원격강좌여부'] ?? row['원격강좌']);
  const teamTeaching = mapTeamTeachingStatus(row['팀티칭']);
  const category = mapCourseCategory(row['교과목구분']);
  const scheduleAndClassroom = nullableString(row['시간표']);

  return {
    academicYear: context.academicYear,
    semester: context.semester,
    officialCourseNumber: nullableString(row['교과목번호']),
    section: nullableString(row['분반']),
    managingCollegeName: nullableString(row['주관대학명'] ?? row['대학명']),
    departmentCodeOrName: nullableString(row['학과(부)']),
    managingDepartmentName: nullableString(row['주관학과명']),
    courseName: nullableString(row['교과목명']),
    ...category,
    yearLevel: nullableString(row['학년']),
    credits: nullableNumber(row['학점']),
    theoryHours: nullableNumber(row['이론시간']),
    practicalHours: nullableNumber(row['실습시간']),
    enrollmentLimit: nullableNumber(row['수강제한인원']),
    professor: nullableString(row['교수명']),
    schedule: scheduleAndClassroom,
    classroom: null,
    scheduleAndClassroom,
    ...remote,
    ...teamTeaching,
    ...language,
    generalEducationArea: nullableString(row['교양영역명']),
    remarks: nullableString(row['비고']),
    professorSyllabusUrl: null,
    professorSyllabusIdentifier: null,
    presentationRequirement: null,
    groupProjectRequirement: null,
    assignmentRequirement: null,
    examInformation: null,
    sourceUrl: context.sourceUrl,
    sourceAttachmentUrl: context.sourceAttachmentUrl,
    retrievedAt: context.retrievedAt,
  };
}

function parseCatalogWorkbook(buffer, context) {
  const workbook = readXlsxWorkbookBuffer(buffer);
  const sheetName = context.sheetName || (workbook.sheets.sheet ? 'sheet' : '개설강좌일람표');
  const sheet = workbook.sheets[sheetName];
  if (!sheet) throw new Error(`Official workbook is missing the ${sheetName} sheet`);

  const headerIndex = sheet.rawRows.findIndex(
    (row) => row.includes('교과목번호') && row.includes('분반') && row.includes('교과목명'),
  );
  if (headerIndex < 0) throw new Error('Official workbook header row was not found');

  const headers = sheet.rawRows[headerIndex].map((value) => nullableString(value));
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    throw new Error(`Official workbook is missing headers: ${missingHeaders.join(', ')}`);
  }

  const title = nullableString(sheet.rawRows[0]?.[0]);
  const expectedTitle = `${context.academicYear}학년도 ${context.semester}학기`;
  if (!title?.includes(expectedTitle)) {
    throw new Error(`Workbook title does not match requested term ${expectedTitle}`);
  }

  const offerings = sheet.rawRows
    .slice(headerIndex + 1)
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]])))
    .filter((row) => nullableString(row['교과목번호']) && nullableString(row['분반']))
    .map((row) => normalizeOffering(row, context));

  return { sheetName, headers, offerings };
}

async function readLocalPnuCourseOfferings(options) {
  const source = getSource(options.academicYear, options.semester);
  if (!source.localFileName) throw new Error('Requested source is not a reviewed local workbook');
  const backendRoot = options.backendRoot;
  if (!backendRoot) throw new Error('backendRoot is required for a reviewed local workbook');
  const sourcePath = join(backendRoot, 'data', 'source', `${options.academicYear}-${options.semester}`, source.localFileName);
  const workbookBuffer = await readFile(sourcePath);
  const retrievedAt = (options.now || (() => new Date()))().toISOString();
  const parsed = parseCatalogWorkbook(workbookBuffer, {
    academicYear: options.academicYear,
    semester: options.semester,
    sourceUrl: null,
    sourceAttachmentUrl: null,
    retrievedAt,
    sheetName: 'sheet',
  });
  return {
    academicYear: options.academicYear,
    semester: options.semester,
    sourceUrl: null,
    sourceAttachmentUrl: null,
    sourceFileName: source.localFileName,
    sourceLabel: source.sourceLabel,
    retrievedAt,
    sheetName: parsed.sheetName,
    sourceHeaders: parsed.headers,
    offeringCount: parsed.offerings.length,
    offerings: parsed.offerings,
  };
}

function decodeHtmlAttribute(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function findAttachmentUrl(html, source) {
  const anchors = [...String(html).matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const attachment = anchors.find((match) =>
    match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').includes(source.attachmentText),
  );
  if (!attachment) throw new Error(`Official attachment not found: ${source.attachmentText}`);
  return new URL(decodeHtmlAttribute(attachment[1]), source.noticeUrl).toString();
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

async function fetchGet(url, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? 15_000;
  const retries = options.retries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 500;

  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required');

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { Accept: '*/*', 'User-Agent': 'omo-korea-local-course-source-audit/1.0' },
      });
      if (response.ok) return response;

      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === retries) {
        const error = new Error(`GET ${url} failed with HTTP ${response.status}`);
        error.code = 'PNU_FETCH_FAILED';
        error.status = response.status;
        throw error;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`GET ${url} timed out after ${timeoutMs}ms`);
        timeoutError.code = 'PNU_FETCH_TIMEOUT';
        if (attempt === retries) throw timeoutError;
      } else if (error.code === 'PNU_FETCH_FAILED' || attempt === retries) {
        throw error;
      }
    } finally {
      clearTimeout(timer);
    }
    await delay(retryDelayMs * (attempt + 1));
  }

  throw new Error(`GET ${url} failed`);
}

async function fetchPnuCourseOfferings(options) {
  const source = getSource(options.academicYear, options.semester);
  if (source.localFileName) return readLocalPnuCourseOfferings(options);
  const requestOptions = {
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    retries: options.retries,
    retryDelayMs: options.retryDelayMs,
  };
  const wait = options.delayImpl || delay;
  const rateLimitMs = options.rateLimitMs ?? 750;

  const noticeResponse = await fetchGet(source.noticeUrl, requestOptions);
  const noticeHtml = await noticeResponse.text();
  const sourceAttachmentUrl = findAttachmentUrl(noticeHtml, source);
  await wait(rateLimitMs);
  const attachmentResponse = await fetchGet(sourceAttachmentUrl, requestOptions);
  const workbookBuffer = Buffer.from(await attachmentResponse.arrayBuffer());
  const retrievedAt = (options.now || (() => new Date()))().toISOString();
  const context = {
    academicYear: options.academicYear,
    semester: options.semester,
    sourceUrl: source.noticeUrl,
    sourceAttachmentUrl,
    retrievedAt,
  };
  const parsed = (options.parseWorkbook || parseCatalogWorkbook)(workbookBuffer, context);

  return {
    academicYear: options.academicYear,
    semester: options.semester,
    sourceUrl: source.noticeUrl,
    sourceAttachmentUrl,
    retrievedAt,
    sheetName: parsed.sheetName,
    sourceHeaders: parsed.headers,
    offeringCount: parsed.offerings.length,
    offerings: parsed.offerings,
  };
}

function localOutputPath(backendRoot, academicYear, semester) {
  return join(
    backendRoot,
    'data',
    'local',
    'pnu-course-offerings',
    `${academicYear}-${semester}.json`,
  );
}

async function writeLocalOutput(report, backendRoot) {
  const outputRoot = resolve(backendRoot, 'data', 'local', 'pnu-course-offerings');
  const outputPath = resolve(localOutputPath(backendRoot, report.academicYear, report.semester));
  if (outputPath !== outputRoot && !outputPath.startsWith(`${outputRoot}${sep}`)) {
    throw new Error('Refusing to write outside the gitignored local output directory');
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return outputPath;
}

module.exports = {
  COURSE_CATEGORY_CODES,
  LANGUAGE_CODES,
  LANGUAGE_LABEL_CODES,
  PUBLIC_SOURCES,
  REQUIRED_HEADERS,
  fetchGet,
  fetchPnuCourseOfferings,
  findAttachmentUrl,
  getSource,
  localOutputPath,
  mapCourseCategory,
  mapLanguageCode,
  mapRemoteStatus,
  mapTeamTeachingStatus,
  normalizeOffering,
  parseArguments,
  parseCatalogWorkbook,
  readLocalPnuCourseOfferings,
  writeLocalOutput,
};
