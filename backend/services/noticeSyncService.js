const { assessNoticeSources } = require("./noticeSourceHealth");
const { syncNoticesToKnowledgeBase } = require("./noticeKnowledgeService");
let activeSynchronization = null;

const NOTICE_SELECT_FIELDS = [
  'notice_id',
  'title',
  'content',
  'language',
  'posted_date',
  'source',
  'source_url',
  'external_id',
  'scraped_at',
].join(',');

function noticeWriteValues(row) {
  return {
    title: row.title,
    content: row.content,
    language: row.language,
    posted_date: row.posted_date,
    source: row.source,
    source_url: row.source_url,
    external_id: row.external_id,
    scraped_at: row.scraped_at,
  };
}

function normalizedText(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function preferredText(existingValue, incomingValue) {
  const existing = normalizedText(existingValue);
  const incoming = normalizedText(incomingValue);

  if (!existing) return incomingValue;
  if (!incoming || existing === incoming) return existingValue;
  if (incoming.includes(existing)) return incomingValue;
  if (existing.includes(incoming)) return existingValue;

  return incoming.length >= existing.length * 1.25
    ? incomingValue
    : existingValue;
}

function preferredValue(existingValue, incomingValue) {
  return incomingValue === null || incomingValue === undefined || incomingValue === ''
    ? existingValue
    : incomingValue;
}

function preferredPostedDate(existingValue, incomingValue) {
  if (!incomingValue) return existingValue;
  if (existingValue && String(existingValue).slice(0, 10) === String(incomingValue).slice(0, 10)) {
    return existingValue;
  }
  return incomingValue;
}

function mergeNoticeValues(existing, incoming) {
  const values = noticeWriteValues(incoming);
  return {
    ...values,
    title: preferredText(existing.title, values.title),
    content: preferredText(existing.content, values.content),
    language: preferredValue(existing.language, values.language),
    posted_date: preferredPostedDate(existing.posted_date, values.posted_date),
    source: preferredValue(existing.source, values.source),
    source_url: existing.source_url || values.source_url,
    external_id: preferredValue(existing.external_id, values.external_id),
  };
}

function comparableValue(field, value) {
  if (field === 'title' || field === 'content') return normalizedText(value);
  if (field === 'posted_date' && value) {
    return String(value).slice(0, 10);
  }
  return value === undefined ? null : value;
}

function hasMaterialChanges(existing, values) {
  return Object.entries(values).some(([field, value]) => {
    if (field === 'source_url' || field === 'scraped_at') return false;
    return comparableValue(field, existing[field]) !== comparableValue(field, value);
  });
}

async function updateNoticeById(supabaseClient, noticeId, row) {
  const values = noticeWriteValues(row);
  delete values.source_url;

  const { error } = await supabaseClient
    .from("notice")
    .update(values)
    .eq("notice_id", noticeId);

  if (error) throw error;
}

async function findFullNoticeBySourceUrl(supabaseClient, sourceUrl) {
  const { data, error } = await supabaseClient
    .from('notice')
    .select(NOTICE_SELECT_FIELDS)
    .eq('source_url', sourceUrl)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function findFullNoticeByExternalIdentity(supabaseClient, row) {
  if (!row?.source || !row?.external_id) return null;

  const { data, error } = await supabaseClient
    .from('notice')
    .select(NOTICE_SELECT_FIELDS)
    .eq('source', row.source)
    .eq('external_id', row.external_id)
    .order('notice_id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function findFullNotice(supabaseClient, row) {
  const identityMatch = await findFullNoticeByExternalIdentity(
    supabaseClient,
    row,
  );
  if (identityMatch) return identityMatch;

  return findFullNoticeBySourceUrl(supabaseClient, row.source_url);
}

async function persistScrapedNotices(supabaseClient, rows) {
  let inserted = 0;
  let updated = 0;
  let unchanged = 0;

  for (const row of rows) {
    if (!row?.source_url) {
      const error = new Error("Scraped notice is missing source_url");
      error.statusCode = 500;
      error.code = "NOTICE_SOURCE_URL_REQUIRED";
      throw error;
    }

    const existing = await findFullNotice(supabaseClient, row);

    if (existing?.notice_id) {
      const merged = mergeNoticeValues(existing, row);
      if (!hasMaterialChanges(existing, merged)) {
        unchanged += 1;
        continue;
      }
      await updateNoticeById(supabaseClient, existing.notice_id, merged);
      updated += 1;
      continue;
    }

    const { error: insertError } = await supabaseClient
      .from("notice")
      .insert(noticeWriteValues(row));

    if (!insertError) {
      inserted += 1;
      continue;
    }

    // Another synchronization may have inserted the same source URL after
    // our lookup. Respect the unique index and converge by updating that row.
    if (insertError.code === "23505") {
      const concurrentRow = await findFullNotice(supabaseClient, row);

      if (concurrentRow?.notice_id) {
        const merged = mergeNoticeValues(concurrentRow, row);
        if (hasMaterialChanges(concurrentRow, merged)) {
          await updateNoticeById(
            supabaseClient,
            concurrentRow.notice_id,
            merged,
          );
          updated += 1;
        } else {
          unchanged += 1;
        }
        continue;
      }
    }

    throw insertError;
  }

  return { inserted, updated, unchanged };
}

function createSyncInProgressError() {
  const error = new Error("Notice synchronization is already in progress");
  error.statusCode = 409;
  error.code = "NOTICE_SYNC_IN_PROGRESS";
  return error;
}

async function synchronizeNotices({
  supabaseClient,
  scrapeNotices,
  rejectIfRunning = true,
}) {
  if (activeSynchronization) {
    if (rejectIfRunning) throw createSyncInProgressError();
    return activeSynchronization;
  }

  activeSynchronization = (async () => {
    // Collect one outcome per board. scrapeNotices ignores unknown options,
    // so injected test doubles are unaffected.
    const sourceResults = [];
    const scraped = await scrapeNotices({
      onSourceResult: (source, outcome) => {
        sourceResults.push({ source: source.source, ...outcome });
      },
    });
    const persisted = await persistScrapedNotices(
      supabaseClient,
      scraped,
    );

    // Publish the recent ones into the knowledge base so the assistant can
    // answer about them. Deliberately non-fatal: storing notices is the
    // primary job here and the Notices screen depends on it, so a knowledge
    // base that is unreachable — or a cron without an embedding key — must not
    // fail the sync that feeds the screen.
    let knowledgeBase = null;
    try {
      knowledgeBase = await syncNoticesToKnowledgeBase(supabaseClient);
    } catch (err) {
      console.error("Notice knowledge-base sync failed:", err.message);
      knowledgeBase = { error: err.message };
    }

    // Whether the run actually worked, as opposed to merely finishing.
    let sourceHealth = null;
    if (sourceResults.length > 0) {
      try {
        sourceHealth = await assessNoticeSources(supabaseClient, sourceResults);
      } catch (err) {
        sourceHealth = { healthy: [], problems: [], checkFailed: err.message };
      }
    }

    return {
      scraped,
      ...persisted,
      knowledgeBase,
      sourceHealth,
    };
  })();

  try {
    return await activeSynchronization;
  } finally {
    activeSynchronization = null;
  }
}

module.exports = {
  hasMaterialChanges,
  mergeNoticeValues,
  persistScrapedNotices,
  synchronizeNotices,
};
