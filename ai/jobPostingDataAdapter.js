function normalizeJobPostingRow(row, options = {}) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return null;
  }

  const interests = [];

  if (options.includeTypeAsInterest && row.type) {
    interests.push(row.type);
  }

  // Meaningful job personalization needs future DB columns such as description,
  // skills, eligibleMajors, careerAreas, interests, languages, location, salary,
  // and source_url.
  return {
    id: row.job_id,
    title: row.title,
    company: row.company,
    type: row.type,
    deadline: row.deadline,
    description: null,
    academicAreas: [],
    activities: [],
    strengths: [],
    careerAreas: [],
    learningStyles: [],
    interests,
    languages: [],
  };
}

module.exports = {
  normalizeJobPostingRow,
};
