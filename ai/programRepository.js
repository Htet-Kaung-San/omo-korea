const supabase = require('../supabaseClient');
const { normalizeProgramRow } = require('./programDataAdapter');

async function fetchNormalizedPrograms(options = {}) {
  const { data, error } = await supabase
    .from('extracurricular_program')
    .select('program_id, name, category, deadline')
    .order('program_id', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || [])
    .map((row) => normalizeProgramRow(row, options))
    .filter(Boolean);
}

module.exports = {
  fetchNormalizedPrograms,
};
