/**
 * Guards the graduation-regulation summaries against the corrections that two
 * rounds of verification against the Korean source produced.
 *
 * These summaries are written from 부산대학교 졸업논문 등에 관한 시행세칙 and go
 * straight into the knowledge base, so whatever they say the assistant repeats
 * as PNU's own rules. The first draft was reviewed line by line against the
 * Korean and the verdict was do-not-ingest: it told international students they
 * were not held to the English requirement (false for 국제학부), dropped the
 * 편입학생 column so every rule was stated two years early for transfer
 * students, and rendered 자연계열 as "natural science" — a mistranslation that
 * would have a medicine or engineering student submit a 10-page thesis against
 * a 20-page floor.
 *
 * Each assertion below is a claim that was WRONG at some point and was fixed.
 * If one disappears, the summary has drifted back toward a version a reviewer
 * already rejected.
 */
const fs = require('fs');
const path = require('path');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'ingest-graduation-regulations.mjs');
const source = fs.readFileSync(SCRIPT, 'utf8');

describe('graduation summaries keep the corrections review forced', () => {
  test('경영학과 is not offered the 언어교육원 route', () => {
    // 별표 2-1 lists TOPIK 5급 alone for 경영학과. A student who completes
    // 언어교육원 level 5 instead is refused at 졸업사정 with no time to recover.
    expect(source).toMatch(/언어교육원 route is not offered to 경영학과/);
  });

  test('국제학부 is described as measured on English, not as exempt', () => {
    // The first draft said "international students are not held to this
    // English requirement", which is flatly false for 국제학부.
    expect(source).toMatch(/국제학부[^"]*measured on English tests/);
    expect(source).not.toMatch(/International students are not held to this English requirement/);
  });

  test('the dual-degree English track is named with its intake years', () => {
    // 별표 2-1's newest row. Those students are enrolled now, and telling them
    // to pursue TOPIK 4 sends them after a test they do not need.
    expect(source).toMatch(/September 2025 \(September 2027 for transfers\)/);
  });

  test('the transfer-student route is stated, not dropped', () => {
    // Every rule in 별표 2-1 appears twice, two years apart. The first draft
    // kept only the freshman column.
    expect(source).toMatch(/transfer student \(편입학생\)/);
    expect(source).toMatch(/transfer date exactly two years later/);
  });

  test('별표 1 is described as keyed to graduation date, not admission year', () => {
    // Roughly 95 of its dated cells key on a graduation date. Saying
    // "admission year" sends students to the wrong row.
    expect(source).toMatch(/keyed to a graduation date rather than an admission year/);
  });

  test('the one-of-four restriction is not presented as a cap on everything', () => {
    // Departments routinely require a language score AND volunteer hours AND
    // a thesis. The restriction covers only those four alternatives.
    expect(source).toMatch(/restriction covers only those four/);
  });

  test('자연계열 is left untranslated with a warning', () => {
    // It is not "natural science" — it covers engineering and medicine, and
    // the regulation never defines it.
    expect(source).toMatch(/자연계열/);
    expect(source).not.toMatch(/natural science theses/);
    expect(source).toMatch(/does not define which 계열/);
  });

  test('the substitute Korean test is stated as discretionary', () => {
    // 제8조⑦ says 인정할 수 있으며 — the university MAY recognise it. A student
    // who skips TOPIK relying on a promise may fail to graduate.
    expect(source).toMatch(/may accept a substitute Korean test/);
    expect(source).not.toMatch(/substitute test that the university will accept/);
  });

  test('every document cites its articles and routes doubt to 국제처', () => {
    const refs = source.match(/Reference: 제\d+조/g) || [];
    const docs = source.match(/^\s{4}title:/gm) || [];
    expect(refs.length).toBe(docs.length);
    expect(source).toMatch(/International Affairs Office \(국제처\)/);
    expect(source).toMatch(/revised 2026-01-15/);
  });
});
