const supabase = require('../supabaseClient');
const { normalizeNoticeRow } = require('./noticeDataAdapter');

async function fetchNormalizedNotices(options = {}) {
  const { data, error } = await supabase
    .from('notice')
    .select('notice_id, title, content, language, posted_date')
    .order('posted_date', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || [])
    .map((row) => normalizeNoticeRow(row, options))
    .filter(Boolean);
}

module.exports = {
  fetchNormalizedNotices,
};
