const ragService = require("./ragService");

/**
 * Publishes scraped notices into the knowledge base so the assistant can see them.
 *
 * The scraper has been collecting notices from five PNU boards every fifteen
 * minutes for weeks, and none of it reached the assistant: "is there a notice
 * about the semiconductor camp?" was answered from general knowledge while the
 * notice sat in Postgres. The pipeline ended one step short of the feature it
 * was for.
 *
 * Only recent notices are published. A notice is an announcement with a
 * deadline attached, so one from two semesters ago is not merely useless — it
 * competes for retrieval slots with the one that still matters, and a student
 * told about a closed application is worse off than one told nothing. Anything
 * older than the window is removed from the knowledge base while staying in the
 * notice table, which the Notices screen still lists in full.
 */
const DEFAULT_WINDOW_DAYS = Number(process.env.NOTICE_KB_WINDOW_DAYS || 120);

/** Paces the initial backfill; steady-state runs embed only a handful. */
const EMBED_DELAY_MS = 150;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const CATEGORY = "Notice";

/** Marks a kb_document as owned by this sync, so nothing else gets pruned. */
const TITLE_PREFIX = "[공지] ";

function cutoffDate(windowDays, now) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - windowDays);
  return cutoff.toISOString().slice(0, 10);
}

/**
 * The text that gets embedded and shown as a source.
 *
 * Scraped notices carry little more than a title, so the body adds the things
 * that make one answerable: when it was posted, which office posted it, and a
 * link the student can open. Without the date the assistant cannot tell a
 * student whether a deadline has passed.
 */
function documentBody(notice) {
  const lines = [notice.title];
  if (notice.posted_date) lines.push(`Posted: ${notice.posted_date}`);
  if (notice.source) lines.push(`Board: ${notice.source}`);
  const body = String(notice.content || "").trim();
  // The scraper often stores "<title>\nSource: <label>", which adds nothing.
  if (body && !body.startsWith(notice.title)) lines.push(body);
  if (notice.source_url) lines.push(`Source: ${notice.source_url}`);
  return lines.join("\n");
}

const documentTitle = (notice) => `${TITLE_PREFIX}${notice.title}`.slice(0, 500);

/**
 * @param {object} supabaseClient
 * @param {{ windowDays?: number, now?: Date, embed?: boolean }} options
 */
async function syncNoticesToKnowledgeBase(supabaseClient, options = {}) {
  const { windowDays = DEFAULT_WINDOW_DAYS, now = new Date() } = options;
  // Embedding is optional so the notice cron keeps working without an
  // embedding key. A sync that stores notices but cannot embed them is a
  // degraded feature; a sync that throws leaves the Notices screen stale too.
  const embed = options.embed ?? ragService.isEmbeddingConfigured();

  const cutoff = cutoffDate(windowDays, now);

  const { data: notices, error: noticeError } = await supabaseClient
    .from("notice")
    .select("notice_id, title, content, source, source_url, posted_date")
    .gte("posted_date", cutoff)
    .order("posted_date", { ascending: false });
  if (noticeError) throw new Error(`Failed to read notices: ${noticeError.message}`);

  const { data: existingDocs, error: docError } = await supabaseClient
    .from("kb_document")
    .select("id, title, content")
    .eq("category", CATEGORY);
  if (docError) throw new Error(`Failed to read kb_document: ${docError.message}`);

  // Which of them actually have vectors. A document with no chunks is
  // invisible to retrieval, and that is exactly what the notice cron produces
  // when it runs without an embedding key — it writes the documents, cannot
  // embed them, and on the next run their content is unchanged, so a
  // content-only comparison would skip them forever. Anything unembedded is
  // retried instead.
  const { data: chunkRows, error: chunkError } = await supabaseClient
    .from("kb_chunk")
    .select("document_id");
  if (chunkError) throw new Error(`Failed to read kb_chunk: ${chunkError.message}`);
  const embeddedDocIds = new Set((chunkRows || []).map((row) => row.document_id));

  const byTitle = new Map((existingDocs || []).map((doc) => [doc.title, doc]));
  const wanted = new Set();

  // Boards re-post the same announcement under a later date, so a title can
  // appear more than once. Two notices mapping to one document made each run
  // rewrite it as the other, re-embedding both forever — a small permanent
  // cost on a fifteen-minute cron. A re-post supersedes its earlier copy, so
  // only the most recent survives, which is also the one whose deadline is
  // still meaningful to a student.
  const newestByTitle = new Map();
  for (const notice of notices || []) {
    if (!notice.title) continue;
    const seen = newestByTitle.get(notice.title);
    if (!seen || String(notice.posted_date || "") > String(seen.posted_date || "")) {
      newestByTitle.set(notice.title, notice);
    }
  }
  const deduplicated = [...newestByTitle.values()];

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let embedded = 0;
  const failures = [];

  for (const notice of deduplicated) {
    const title = documentTitle(notice);
    const content = documentBody(notice);
    wanted.add(title);

    const existing = byTitle.get(title);
    let docId = existing?.id;

    if (!existing) {
      const { data: inserted, error } = await supabaseClient
        .from("kb_document")
        .insert({ category: CATEGORY, title, content })
        .select("id")
        .single();
      if (error) {
        failures.push({ title, error: error.message });
        continue;
      }
      docId = inserted.id;
      created += 1;
    } else if (existing.content !== content) {
      const { error } = await supabaseClient
        .from("kb_document")
        .update({ content })
        .eq("id", existing.id);
      if (error) {
        failures.push({ title, error: error.message });
        continue;
      }
      // The stored chunks describe the previous wording.
      await supabaseClient.from("kb_chunk").delete().eq("document_id", existing.id);
      updated += 1;
    } else if (embeddedDocIds.has(existing.id)) {
      unchanged += 1;
      continue;
    }
    // else: content is current but the document was never embedded — fall
    // through so the embedding below picks it up.

    if (embed && docId) {
      try {
        await ragService.syncDocument(docId);
        embedded += 1;
        await sleep(EMBED_DELAY_MS);
      } catch (err) {
        failures.push({ title, error: `embedding failed: ${err.message}` });
      }
    }
  }

  // Drop documents for notices that have aged out of the window.
  const stale = (existingDocs || []).filter((doc) => !wanted.has(doc.title));
  for (const doc of stale) {
    await supabaseClient.from("kb_chunk").delete().eq("document_id", doc.id);
    await supabaseClient.from("kb_document").delete().eq("id", doc.id);
  }

  return {
    considered: (notices || []).length,
    deduplicated: (notices || []).length - deduplicated.length,
    created,
    updated,
    unchanged,
    embedded,
    pruned: stale.length,
    embeddingSkipped: !embed,
    failures,
  };
}

module.exports = {
  syncNoticesToKnowledgeBase,
  DEFAULT_WINDOW_DAYS,
  CATEGORY,
  TITLE_PREFIX,
};
