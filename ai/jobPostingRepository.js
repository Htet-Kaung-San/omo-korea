const supabase = require('../supabaseClient');
const { normalizeJobPostingRow } = require('./jobPostingDataAdapter');

async function fetchNormalizedJobPostings(options = {}) {
  const { data, error } = await supabase
    .from('job_posting')
    .select('job_id, title, company, type, deadline')
    .order('deadline', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || [])
    .map((row) => normalizeJobPostingRow(row, options))
    .filter(Boolean);
}

module.exports = {
  fetchNormalizedJobPostings,
};
