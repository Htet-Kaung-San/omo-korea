function normalizeProgramRow(row, options = {}) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return null;
  }

  const tags = [];

  if (row.category) {
    tags.push(row.category);
  }

  if (options.includeTitleTag && row.name) {
    tags.push(row.name);
  }

  // Better personalization needs future DB columns: tags, careerTags, eligibleMajors,
  // languages, minYear, maxYear, description, and source_url.
  return {
    id: row.program_id,
    title: row.name,
    description: null,
    date: row.deadline,
    category: row.category,
    tags,
    careerTags: [],
    eligibleMajors: [],
    languages: [],
    minYear: null,
    maxYear: null,
  };
}

module.exports = {
  normalizeProgramRow,
};
