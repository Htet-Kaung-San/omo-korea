const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const {
  EXPECTED,
  SOURCES,
  buildSourceDataset,
  canonicalCurrentCode,
  mapCategory,
  normalizeName,
  sha256,
} = require('../scripts/lib/economicsInternationalTradeCurriculum.cjs');

describe('reviewed Economics and International Trade curriculum sources', () => {
  test('pins all four source workbooks by checksum', () => {
    for (const source of Object.values(SOURCES)) {
      expect(sha256(readFileSync(source.path))).toBe(source.sha256);
    }
  });

  test('builds the exact reviewed catalog and provenance rows', () => {
    const dataset = buildSourceDataset();

    expect(dataset.sourceCourses).toHaveLength(136);
    expect(dataset.curriculumRows).toHaveLength(EXPECTED.tourismCurriculumRows);
    expect(dataset.departmentWebsites).toHaveLength(EXPECTED.departmentWebsites);
    expect(dataset.sourceCourses.filter((row) => row.major_id === 68)).toHaveLength(43);
    expect(dataset.sourceCourses.filter((row) => row.major_id === 70)).toHaveLength(43);
    expect(dataset.sourceCourses.filter((row) => row.major_id === 71)).toHaveLength(50);
  });

  test('normalizes reviewed legacy codes and categories conservatively', () => {
    expect(canonicalCurrentCode('GS21549')).toBe('GS2100549');
    expect(canonicalCurrentCode('TC1500809')).toBe('TC1500809');
    expect(mapCategory('FOUNDATION')).toBe('REQUIRED');
    expect(mapCategory('BASIC')).toBe('REQUIRED');
    expect(mapCategory('ELECTIVE')).toBe('ELECTIVE');
    expect(() => mapCategory('UNKNOWN')).toThrow('Unsupported curriculum category');
    expect(normalizeName('리더쉽')).toBe(normalizeName('리더십'));
  });

  test('maps the official department websites to real production majors', () => {
    const websites = buildSourceDataset().departmentWebsites;
    expect(websites.find((row) => row.departmentEn === 'International Trade')).toMatchObject({
      majorId: 68,
      websiteUrl: 'https://pnutrade.pusan.ac.kr/',
    });
    expect(websites.find((row) => row.departmentEn === 'Tourism and Convention')).toMatchObject({
      majorId: 70,
      websiteUrl: 'https://convention.pusan.ac.kr/',
    });
    expect(websites.find((row) => row.departmentEn === 'Global Studies')).toMatchObject({
      majorId: 71,
      websiteUrl: 'https://dgs.pusan.ac.kr/',
    });
  });

  test('migration is service-role only and checksum gated', () => {
    const sql = readFileSync(
      join(__dirname, '..', 'supabase', 'economics_international_trade_curricula.sql'),
      'utf8',
    );
    expect(sql).toContain('alter table public.major_official_source enable row level security');
    expect(sql).toContain('preflight_reviewed_economics_curricula');
    expect(sql).toContain('apply_reviewed_economics_curricula');
    expect(sql).toContain('revoke all on function public.apply_reviewed_economics_curricula(jsonb, text)');
  });
});
