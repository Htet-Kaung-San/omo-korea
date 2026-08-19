/**
 * Telling a broken notice board apart from a quiet one.
 *
 * A scrape reports success whenever the HTTP request succeeds, so both real
 * failure modes have looked like ordinary runs:
 *
 *   - the board 404s. This logs a console warning nobody reads, and the cron
 *     still exits 0. e-onestop.pusan.ac.kr was retired and failed on every run
 *     for weeks before anyone noticed.
 *   - the board's markup changes. The fetch returns 200, the selectors match
 *     nothing, the board contributes zero notices, and nothing is logged at
 *     all — this one is completely silent.
 *
 * Zero notices cannot be treated as failure on its own: a board with nothing
 * posted in the last month legitimately returns zero. What separates the two
 * is history — a source with notices stored from earlier runs that now returns
 * none has almost certainly had its parser broken.
 */
const { assessNoticeSources, describeSourceProblems } = require('../services/noticeSourceHealth');

/** Stub whose `notice` table holds the given source values. */
function supabaseWith(sources) {
  return {
    from: () => ({ select: () => Promise.resolve({ data: sources.map((source) => ({ source })), error: null }) }),
  };
}

const failing = () => ({
  from: () => ({ select: () => Promise.resolve({ data: null, error: { message: 'connection refused' } }) }),
});

describe('spotting a board that has stopped working', () => {
  test('a source with history that returns nothing is reported', () => {
    // The silent case: HTTP 200, selectors match nothing, no error raised.
    return assessNoticeSources(supabaseWith(['cse', 'cse', 'cse']), [
      { source: 'cse', count: 0, error: null },
    ]).then((health) => {
      expect(health.problems).toHaveLength(1);
      expect(health.problems[0].kind).toBe('parsed-nothing');
      expect(health.problems[0].detail).toContain('3 stored');
      expect(health.healthy).toHaveLength(0);
    });
  });

  test('a source that has never produced anything is not accused', async () => {
    // A genuinely quiet or newly added board. Reporting this would train the
    // team to ignore the alert, which is how the real failure stayed hidden.
    const health = await assessNoticeSources(supabaseWith(['cse']), [
      { source: 'newboard', count: 0, error: null },
    ]);

    expect(health.problems).toHaveLength(0);
    expect(health.healthy).toEqual([{ source: 'newboard', count: 0, known: 0 }]);
  });

  test('a fetch failure is reported even though it was already logged', async () => {
    // The e-onestop case: a warning went to the console every run and the job
    // still went green.
    const health = await assessNoticeSources(supabaseWith([]), [
      { source: 'onestop', count: 0, error: new Error('Notice board fetch failed (404)') },
    ]);

    expect(health.problems).toHaveLength(1);
    expect(health.problems[0].kind).toBe('fetch-failed');
    expect(health.problems[0].detail).toContain('404');
  });

  test('a fetch failure is reported even for a source with no history', async () => {
    // An error is conclusive on its own — unlike a zero count, it needs no
    // corroboration from what the board produced before.
    const health = await assessNoticeSources(supabaseWith([]), [
      { source: 'brandnew', count: 0, error: new Error('timeout') },
    ]);

    expect(health.problems[0].kind).toBe('fetch-failed');
  });

  test('working sources are reported as healthy with their counts', async () => {
    const health = await assessNoticeSources(supabaseWith(['cse', 'pnu-main']), [
      { source: 'cse', count: 43, error: null },
      { source: 'pnu-main', count: 75, error: null },
    ]);

    expect(health.problems).toHaveLength(0);
    expect(health.healthy.map((s) => s.source)).toEqual(['cse', 'pnu-main']);
    expect(health.healthy[0].count).toBe(43);
  });

  test('one broken board does not hide the others', async () => {
    const health = await assessNoticeSources(supabaseWith(['cse', 'cse', 'onestop']), [
      { source: 'cse', count: 43, error: null },
      { source: 'onestop', count: 0, error: null },
      { source: 'dormitory', count: 18, error: null },
    ]);

    expect(health.problems.map((p) => p.source)).toEqual(['onestop']);
    expect(health.healthy.map((s) => s.source)).toEqual(['cse', 'dormitory']);
  });

  test('an unreadable history reports itself rather than blaming the boards', async () => {
    // Not being able to check must not manufacture failures, or a database
    // hiccup would mark every board broken.
    const health = await assessNoticeSources(failing(), [
      { source: 'cse', count: 0, error: null },
    ]);

    expect(health.checkFailed).toContain('connection refused');
    expect(health.problems).toHaveLength(0);
  });

  test('the summary names the board and why it is suspected', () => {
    const text = describeSourceProblems([
      { source: 'onestop', kind: 'fetch-failed', detail: 'Notice board fetch failed (404)' },
    ]);

    expect(text).toContain('onestop');
    expect(text).toContain('fetch-failed');
    expect(text).toContain('404');
  });
});
