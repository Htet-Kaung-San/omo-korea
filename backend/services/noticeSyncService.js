let activeSynchronization = null;

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

async function updateNoticeById(supabaseClient, noticeId, row) {
  const values = noticeWriteValues(row);
  delete values.source_url;

  const { error } = await supabaseClient
    .from("notice")
    .update(values)
    .eq("notice_id", noticeId);

  if (error) throw error;
}

async function findNoticeBySourceUrl(supabaseClient, sourceUrl) {
  const { data, error } = await supabaseClient
    .from("notice")
    .select("notice_id")
    .eq("source_url", sourceUrl)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function persistScrapedNotices(supabaseClient, rows) {
  let inserted = 0;
  let updated = 0;

  for (const row of rows) {
    if (!row?.source_url) {
      const error = new Error("Scraped notice is missing source_url");
      error.statusCode = 500;
      error.code = "NOTICE_SOURCE_URL_REQUIRED";
      throw error;
    }

    const existing = await findNoticeBySourceUrl(
      supabaseClient,
      row.source_url,
    );

    if (existing?.notice_id) {
      await updateNoticeById(supabaseClient, existing.notice_id, row);
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
      const concurrentRow = await findNoticeBySourceUrl(
        supabaseClient,
        row.source_url,
      );

      if (concurrentRow?.notice_id) {
        await updateNoticeById(
          supabaseClient,
          concurrentRow.notice_id,
          row,
        );
        updated += 1;
        continue;
      }
    }

    throw insertError;
  }

  return { inserted, updated };
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
    const scraped = await scrapeNotices();
    const persisted = await persistScrapedNotices(
      supabaseClient,
      scraped,
    );

    return {
      scraped,
      ...persisted,
    };
  })();

  try {
    return await activeSynchronization;
  } finally {
    activeSynchronization = null;
  }
}

module.exports = {
  persistScrapedNotices,
  synchronizeNotices,
};
