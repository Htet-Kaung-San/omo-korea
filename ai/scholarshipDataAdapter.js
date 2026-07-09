function pickField(row, primaryKey, fallbackKey) {
  return row[primaryKey] !== undefined ? row[primaryKey] : row[fallbackKey];
}

function pickAnyField(row, keys) {
  const matchingKey = keys.find((key) => row[key] !== undefined);
  return matchingKey !== undefined ? row[matchingKey] : undefined;
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

  const tags = normalizeArrayField(pickField(row, 'tags', 'keyword_tags'));
  const normalized = {
    id: pickField(row, 'id', 'scholarship_id'),
    title: pickAnyField(row, ['title', 'scholarship_name', 'name']),
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
    tags: tags.length > 0 ? tags : normalizeArrayField(row.type),
  };

  if (row.type !== undefined) {
    normalized.metadata = {
      type: row.type,
    };
  }

  return normalized;
}

module.exports = {
  normalizeScholarshipRow,
};
