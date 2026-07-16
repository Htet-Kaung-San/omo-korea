/**
 * Read path for published extracurricular_program rows.
 * Only returns status=published with a non-null source_url.
 */
const supabase = require('../supabaseClient');

function normalizeTag(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_가-힣]/g, '');
}

function collectUserTags(...lists) {
  const tags = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const tag = normalizeTag(item);
      if (tag) tags.push(tag);
    }
  }
  return [...new Set(tags)];
}

function formatDeadline(value) {
  if (!value) return '';
  const raw = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw.replace(/-/g, '.');
  }
  return String(value);
}

function mapProgramRow(row, extras = {}) {
  const sourceUrl = row.source_url || null;
  let externalApplyUrl = row.external_apply_url || null;
  if (externalApplyUrl && sourceUrl && externalApplyUrl === sourceUrl) {
    externalApplyUrl = null;
  }

  return {
    id: String(row.program_id ?? row.id),
    title: row.name || row.title || 'Untitled program',
    description: row.description || '',
    date: formatDeadline(row.deadline),
    category: row.category || null,
    hostDepartment: row.host_department || null,
    sourceUrl,
    externalApplyUrl,
    score: extras.score,
    matchHint: extras.matchHint,
  };
}

async function fetchPublishedProgramsDirect({ limit = 20 } = {}) {
  let query = supabase
    .from('extracurricular_program')
    .select('*')
    .eq('status', 'published')
    .not('source_url', 'is', null)
    .order('deadline', { ascending: true, nullsFirst: false })
    .limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).filter((row) => Boolean(row.source_url));
}

/**
 * Prefer recommended_programs RPC; fall back to a published-only table query.
 */
async function fetchRecommendedPrograms({ userTags = [], limit = 20 } = {}) {
  const tags = collectUserTags(userTags);

  const { data, error } = await supabase.rpc('recommended_programs', {
    user_tags: tags,
    result_limit: limit,
  });

  if (!error && Array.isArray(data)) {
    return data
      .filter((row) => row.status === 'published' && row.source_url)
      .map((row) => mapProgramRow(row));
  }

  if (error) {
    console.warn(
      '[extracurricular] recommended_programs RPC unavailable, using table query:',
      error.message,
    );
  }

  const rows = await fetchPublishedProgramsDirect({ limit });
  return rows.map((row) => mapProgramRow(row));
}

module.exports = {
  collectUserTags,
  mapProgramRow,
  fetchRecommendedPrograms,
  fetchPublishedProgramsDirect,
};
