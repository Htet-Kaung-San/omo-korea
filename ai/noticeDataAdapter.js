function normalizeNoticeRow(row, options = {}) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return null;
  }

  const tags = [];

  if (options.includeTitleTag && row.title !== undefined && row.title !== null) {
    tags.push(row.title);
  }

  // Better notice personalization needs future DB columns like category, priority,
  // deadline, tags, targetMajors, targetNationalities, minYear, maxYear, source_url.
  return {
    id: row.notice_id,
    title: row.title,
    body: row.content,
    postedDate: row.posted_date,
    category: null,
    priority: 'NORMAL',
    deadline: null,
    targetMajors: [],
    targetNationalities: [],
    minYear: null,
    maxYear: null,
    tags,
    languages:
      row.language !== undefined && row.language !== null ? [row.language] : [],
  };
}

module.exports = {
  normalizeNoticeRow,
};
