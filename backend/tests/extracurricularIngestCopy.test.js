/**
 * Guards the two facts in the extracurricular summaries that can mislead a
 * student, and one that can mislead a student in distress.
 *
 * These summaries are hand-written from Korean source pages and go straight
 * into the knowledge base, so whatever they say is what the assistant will
 * repeat as PNU information. Two of them carry claims that must not be softened
 * or dropped by a later edit:
 *
 *   1. The Power Up study scheme is open ONLY to first-year students in the
 *      Department of Mathematics Education. Without that restriction the
 *      assistant recommends a departmental scholarship to everyone who asks
 *      about study groups — and retrieval does surface it for exactly that
 *      question, verified against the live index.
 *
 *   2. Gatekeeper Training teaches students to recognise warning signs in
 *      OTHER people and refer them onward. It is not a counselling or crisis
 *      service. An assistant that described it as one would be answering a
 *      student who may be in crisis by pointing them at a training course.
 *
 * This reads the file as text on purpose: it should keep working regardless of
 * how the script is structured, and it should fail loudly if someone rewrites
 * the copy without reading the Korean source.
 */
const fs = require('fs');
const path = require('path');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'ingest-extracurricular-programs.mjs');
const source = fs.readFileSync(SCRIPT, 'utf8');

describe('extracurricular summaries keep the claims that matter', () => {
  test('the Power Up study scheme is stated as department-restricted', () => {
    const doc = source.slice(source.indexOf('Power Up'));
    expect(doc).toMatch(/ONLY to first-year students in the Department of Mathematics Education/);
    // The negative half matters as much: a student in another department must
    // be told they cannot apply, not merely left to infer it.
    expect(doc).toMatch(/Students in any other department are not eligible/);
  });

  test('gatekeeper training is not described as a crisis or counselling service', () => {
    const doc = source.slice(source.indexOf('Gatekeeper Training'));
    expect(doc).toMatch(/not a crisis or counselling service/i);
    // The counselling centre's own number stays reachable in the answer.
    expect(doc).toContain('051-510-8117');
  });

  test('every summary cites a source the student can check', () => {
    const summaries = source.match(/content:\s*\n?\s*"/g) || [];
    const sources = source.match(/Source: https:\/\/my\.pusan\.ac\.kr/g) || [];
    expect(summaries.length).toBeGreaterThan(0);
    expect(sources.length).toBe(summaries.length);
  });

  test('the PNU Buddy programme is not duplicated into the knowledge base', () => {
    // "PNU Buddy Program" already exists as a kb_document; a second copy would
    // put two competing descriptions of one programme into retrieval.
    expect(source).not.toMatch(/title:\s*"PNU Buddy/);
  });
});
