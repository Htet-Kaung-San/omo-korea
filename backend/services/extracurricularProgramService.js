/**
 * Manual Supabase catalog (program_id, name, category, deadline, source_url)
 * → AI-ranked recommendations for the Academic programs UI.
 */
const supabase = require('../supabaseClient');
const { recommendPrograms } = require('../ai/programRecommendationEngine');

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

function startOfUtcDay(date = new Date()) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function parseDateOnly(value) {
  if (!value) return null;
  const raw = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [y, m, d] = raw.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Still open through tomorrow (or no deadline). */
function isOpenForApplication(row, now = new Date()) {
  const tomorrow = startOfUtcDay(now) + 24 * 60 * 60 * 1000;
  const deadline = parseDateOnly(row.deadline);
  if (deadline === null) return true;
  return deadline >= tomorrow;
}

function categoryTags(category) {
  const raw = String(category || '').trim();
  if (!raw) return [];
  const tags = [normalizeTag(raw)];
  for (const part of raw.split(/[\/|,·•]/)) {
    const tag = normalizeTag(part);
    if (tag) tags.push(tag);
  }
  return [...new Set(tags.filter(Boolean))];
}

function mapProgramRow(row, extras = {}) {
  return {
    id: String(row.program_id ?? row.id),
    title: row.name || 'Untitled program',
    description: row.category ? String(row.category) : '',
    date: formatDeadline(row.deadline),
    category: row.category || null,
    sourceUrl: row.source_url || null,
    score: extras.score,
    matchHint: extras.matchHint,
  };
}

function toEngineProgram(row) {
  return {
    id: String(row.program_id ?? row.id),
    title: row.name || 'Untitled program',
    description: row.category || '',
    date: row.deadline || '',
    category: row.category || null,
    tags: categoryTags(row.category),
    careerTags: categoryTags(row.category),
    eligibleMajors: [],
    languages: [],
    _row: row,
  };
}

async function fetchOpenCatalogPrograms({ fetchLimit = 100 } = {}) {
  const { data, error } = await supabase
    .from('extracurricular_program')
    .select('program_id, name, category, deadline, source_url')
    .order('deadline', { ascending: true, nullsFirst: false })
    .limit(fetchLimit);

  if (error) throw error;
  return (data || []).filter((row) => isOpenForApplication(row));
}

async function fetchRecommendedPrograms({
  studentProfile = {},
  userTags = [],
  limit = 20,
} = {}) {
  const tags = collectUserTags(userTags, studentProfile.interests, studentProfile.interestTags);
  const profile = {
    ...studentProfile,
    interests: tags.length ? tags : studentProfile.interests || [],
  };

  let openRows = [];
  try {
    const { data, error } = await supabase.rpc('recommended_programs', {
      user_tags: tags,
      result_limit: Math.max(limit * 3, 30),
    });
    if (!error && Array.isArray(data)) {
      openRows = data.filter((row) => isOpenForApplication(row));
    } else if (error) {
      console.warn(
        '[extracurricular] recommended_programs RPC unavailable, using table query:',
        error.message,
      );
    }
  } catch (err) {
    console.warn('[extracurricular] RPC error:', err.message);
  }

  if (!openRows.length) {
    openRows = await fetchOpenCatalogPrograms();
  }

  if (!openRows.length) return [];

  const catalog = openRows.map(toEngineProgram);
  const ranked = recommendPrograms(profile, catalog, { limit });

  const picked =
    ranked.length > 0
      ? ranked
      : catalog.slice(0, limit).map((program) => ({
          ...program,
          score: 0,
          matchHint: '',
        }));

  return picked.map((program) => {
    const row =
      program._row ||
      openRows.find((r) => String(r.program_id) === String(program.id));
    return mapProgramRow(row, {
      score: program.score,
      matchHint: program.matchHint,
    });
  });
}

module.exports = {
  collectUserTags,
  fetchRecommendedPrograms,
};
