function pickField(row, primaryKey, fallbackKey) {
  return row[primaryKey] !== undefined ? row[primaryKey] : row[fallbackKey];
}

function normalizeArrayField(value) {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeScholarshipRow(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return null;
  }

  // Exact production column names must be confirmed before live query integration.
  return {
    id: row.id,
    title: pickField(row, 'title', 'scholarship_name'),
    deadline: row.deadline,
    description: pickField(row, 'description', 'details'),
    amount: pickField(row, 'amount', 'scholarship_amount'),
    provider: pickField(row, 'provider', 'organization'),
    eligibleMajors: normalizeArrayField(
      pickField(row, 'eligibleMajors', 'eligible_majors')
    ),
    eligibleNationalities: normalizeArrayField(
      pickField(row, 'eligibleNationalities', 'eligible_nationalities')
    ),
    minGpa: pickField(row, 'minGpa', 'min_gpa'),
    minTopikLevel: pickField(row, 'minTopikLevel', 'min_topik_level'),
    minYear: pickField(row, 'minYear', 'min_year'),
    maxYear: pickField(row, 'maxYear', 'max_year'),
    tags: normalizeArrayField(pickField(row, 'tags', 'keyword_tags')),
  };
}

module.exports = {
  normalizeScholarshipRow,
};
