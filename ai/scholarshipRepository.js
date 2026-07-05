const supabase = require('../supabaseClient');
const { normalizeScholarshipRow } = require('./scholarshipDataAdapter');

async function fetchNormalizedScholarships() {
  // Requires valid SUPABASE_URL and SUPABASE_KEY in .env at runtime.
  const { data, error } = await supabase
    .from('scholarship')
    .select('*')
    .order('deadline', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(normalizeScholarshipRow).filter(Boolean);
}

module.exports = {
  fetchNormalizedScholarships,
};
