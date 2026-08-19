/**
 * Decides whether a notice sync actually worked.
 *
 * A scrape reports success as long as the HTTP request succeeded, so the two
 * ways a board really fails both look like a normal run:
 *
 *   - the board 404s or times out. This is logged as a console warning, but
 *     the sync still resolves and the cron job still exits 0, so nobody sees
 *     it. e-onestop.pusan.ac.kr was retired and failed on every run for weeks
 *     before anyone noticed.
 *   - the board's markup changes. The fetch returns 200, the selectors match
 *     nothing, and the board contributes zero notices with no error at all.
 *     Nothing anywhere reports this.
 *
 * The second is the dangerous one, because a board that silently stops
 * producing notices looks exactly like a board with nothing new to say. What
 * separates them is history: if a source has notices stored from previous runs
 * and now returns none, its parser has almost certainly broken. That check is
 * what this module does.
 */

/**
 * @param {object} supabaseClient
 * @param {Array<{source: string, count: number, error: Error|null}>} results
 *   One entry per configured source, as reported by scrapeRecentNotices.
 */
async function assessNoticeSources(supabaseClient, results) {
  const problems = [];
  const healthy = [];

  // How many notices each source has produced historically. A source that has
  // never produced any is new or genuinely quiet, and returning zero proves
  // nothing about it.
  const { data: stored, error } = await supabaseClient
    .from("notice")
    .select("source");
  if (error) {
    // Not being able to check is itself worth reporting, but it must not
    // pretend the sources are broken.
    return {
      healthy: [],
      problems: [],
      checkFailed: `Could not read notice history: ${error.message}`,
    };
  }

  const storedCounts = new Map();
  for (const row of stored || []) {
    storedCounts.set(row.source, (storedCounts.get(row.source) || 0) + 1);
  }

  for (const result of results) {
    const known = storedCounts.get(result.source) || 0;

    if (result.error) {
      problems.push({
        source: result.source,
        kind: "fetch-failed",
        detail: result.error.message,
      });
      continue;
    }

    if (result.count === 0 && known > 0) {
      problems.push({
        source: result.source,
        kind: "parsed-nothing",
        detail:
          `returned 0 notices but has ${known} stored from earlier runs — ` +
          "the board's markup has probably changed and its parser no longer matches",
      });
      continue;
    }

    healthy.push({ source: result.source, count: result.count, known });
  }

  return { healthy, problems, checkFailed: null };
}

/** One-line summary for a log or a CI failure message. */
function describeSourceProblems(problems) {
  return problems
    .map((problem) => `  ✗ ${problem.source} (${problem.kind}): ${problem.detail}`)
    .join("\n");
}

module.exports = { assessNoticeSources, describeSourceProblems };
