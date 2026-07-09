const CATEGORY_MAP = {
  REQUIRED: 'REQUIRED',
  ELECTIVE: 'ELECTIVE',
  GEN_ED: 'GEN_ED',
  전공필수: 'REQUIRED',
  전공선택: 'ELECTIVE',
  교양: 'GEN_ED',
};

function normalizeCategory(category) {
  return CATEGORY_MAP[String(category || '').trim()] || 'ELECTIVE';
}

function pickDepartment(row, options) {
  if (options.majorName) {
    return options.majorName;
  }

  if (row.major && row.major.major_name) {
    return row.major.major_name;
  }

  return String(row.major_id);
}

function normalizeCourseRow(row, options = {}) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return null;
  }

  const type = normalizeCategory(row.category);

  return {
    id: row.course_id,
    nameKo: row.course_name,
    nameEn: row.course_name,
    type,
    credits: row.credit,
    department: pickDepartment(row, options),
    // Better tags, prerequisites, and semester planning need future DB columns.
    tags: options.includeCategoryTag ? [type] : [],
    prerequisites: [],
  };
}

module.exports = {
  normalizeCourseRow,
};
