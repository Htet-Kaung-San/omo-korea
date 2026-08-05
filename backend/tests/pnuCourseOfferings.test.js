const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const {
  fetchGet,
  fetchPnuCourseOfferings,
  localOutputPath,
  mapLanguageCode,
  normalizeOffering,
  parseArguments,
} = require('../scripts/lib/pnuCourseOfferings.cjs');

const backendRoot = join(__dirname, '..');

function response({ status = 200, text = '', bytes = new Uint8Array([1, 2, 3]) } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
    arrayBuffer: async () => bytes.buffer,
  };
}

describe('PNU course offering prototype', () => {
  test('requires explicit valid academic year and semester arguments', () => {
    expect(parseArguments(['--year', '2026', '--semester', '1'])).toEqual({
      academicYear: 2026,
      semester: '1',
    });
    expect(() => parseArguments([])).toThrow(/--year is required/);
    expect(() => parseArguments(['--year', '26', '--semester', '1'])).toThrow(
      /four-digit academic year/,
    );
    expect(() => parseArguments(['--year', '2026', '--semester', '3'])).toThrow(
      /must be 1, 2, SUMMER, or WINTER/,
    );
  });

  test('maps only official language codes and exact official labels', () => {
    expect(mapLanguageCode('E')).toMatchObject({
      originalLanguageCode: 'E',
      originalLanguageName: 'ENGLISH',
      teachingLanguage: 'ENGLISH',
      isEnglishTaught: true,
    });
    expect(mapLanguageCode('중국어')).toMatchObject({
      originalLanguageCode: 'C',
      originalLanguageName: 'CHINESE',
      teachingLanguage: 'OTHER',
      isEnglishTaught: false,
    });
    expect(mapLanguageCode(null)).toMatchObject({
      originalLanguageCode: null,
      teachingLanguage: null,
      isEnglishTaught: null,
    });
    expect(mapLanguageCode('English title')).toMatchObject({
      originalLanguageCode: null,
      teachingLanguage: null,
      isEnglishTaught: null,
    });
    for (const [code, name] of [
      ['C', 'CHINESE'],
      ['J', 'JAPANESE'],
      ['F', 'FRENCH'],
      ['G', 'GERMAN'],
      ['R', 'RUSSIAN'],
    ]) {
      expect(mapLanguageCode(code)).toMatchObject({
        originalLanguageCode: code,
        originalLanguageName: name,
        teachingLanguage: 'OTHER',
        isEnglishTaught: false,
      });
    }
  });

  test('preserves official course number, section, and unknown nulls', () => {
    const offering = normalizeOffering(
      {
        교과목번호: 'AI0123456',
        분반: '001',
        교과목명: 'Example',
        원어강의: null,
        원격강좌여부: null,
      },
      {
        academicYear: 2026,
        semester: '1',
        sourceUrl: 'https://onestop.pusan.ac.kr/source',
        sourceAttachmentUrl: 'https://onestop.pusan.ac.kr/file.xlsx',
        retrievedAt: '2026-08-03T00:00:00.000Z',
      },
    );

    expect(offering).toMatchObject({
      officialCourseNumber: 'AI0123456',
      section: '001',
      professor: null,
      originalLanguageCode: null,
      isEnglishTaught: null,
      isRemoteCourse: null,
      remoteCourseStatus: null,
      schedule: null,
      classroom: null,
      presentationRequirement: null,
      groupProjectRequirement: null,
      assignmentRequirement: null,
      examInformation: null,
    });
  });

  test('uses GET only and keeps the official attachment request rate-limited', async () => {
    const calls = [];
    const waits = [];
    const noticeHtml =
      '<a href="/file/course.xlsx">2. 2026학년도 1학기 학부 개설강좌 일람표.xlsx</a>';
    const fetchImpl = jest
      .fn()
      .mockImplementationOnce(async (url, options) => {
        calls.push({ url, options });
        return response({ text: noticeHtml });
      })
      .mockImplementationOnce(async (url, options) => {
        calls.push({ url, options });
        return response();
      });

    const report = await fetchPnuCourseOfferings({
      academicYear: 2026,
      semester: '1',
      fetchImpl,
      retries: 0,
      rateLimitMs: 750,
      delayImpl: async (milliseconds) => waits.push(milliseconds),
      now: () => new Date('2026-08-03T00:00:00.000Z'),
      parseWorkbook: (_buffer, context) => ({
        sheetName: '개설강좌일람표',
        headers: ['교과목번호', '분반'],
        offerings: [
          normalizeOffering(
            { 교과목번호: 'AI0123456', 분반: '001' },
            context,
          ),
        ],
      }),
    });

    expect(calls).toHaveLength(2);
    calls.forEach((call) => expect(call.options.method).toBe('GET'));
    expect(waits).toEqual([750]);
    expect(report.offerings[0]).toMatchObject({
      officialCourseNumber: 'AI0123456',
      section: '001',
    });
  });

  test('reports timeout and failed-response errors clearly', async () => {
    const hangingFetch = (_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });

    await expect(
      fetchGet('https://onestop.pusan.ac.kr/slow', {
        fetchImpl: hangingFetch,
        timeoutMs: 5,
        retries: 0,
      }),
    ).rejects.toMatchObject({ code: 'PNU_FETCH_TIMEOUT' });
    await expect(
      fetchGet('https://onestop.pusan.ac.kr/fail', {
        fetchImpl: async () => response({ status: 404 }),
        retries: 0,
      }),
    ).rejects.toMatchObject({ code: 'PNU_FETCH_FAILED', status: 404 });
  });

  test('contains no database client or write operations', () => {
    const files = [
      join(backendRoot, 'scripts', 'fetch-pnu-course-offerings.mjs'),
      join(backendRoot, 'scripts', 'lib', 'pnuCourseOfferings.cjs'),
    ];
    const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');

    expect(source).not.toMatch(/@supabase|createClient|supabaseClient/);
    expect(source).not.toMatch(/\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.delete\s*\(/);
  });

  test('keeps the only output path gitignored', () => {
    const outputPath = localOutputPath(backendRoot, 2026, '1');
    const ignoredPath = execFileSync('git', ['check-ignore', outputPath], {
      cwd: backendRoot,
      encoding: 'utf8',
    }).trim();

    expect(ignoredPath).toContain('2026-1.json');
  });
});
