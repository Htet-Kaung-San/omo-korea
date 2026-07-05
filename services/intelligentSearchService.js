const supabase = require('../supabaseClient');

const DEFAULT_LIMIT_PER_SOURCE = 5;

const EMPTY_RESULTS = {
  knowledgeBase: [],
  notices: [],
  scholarships: [],
  courses: [],
  majors: [],
};

const SOURCES = [
  {
    group: 'knowledgeBase',
    sourceType: 'knowledge_base',
    table: 'kb_document',
    select: 'title, content, category, target_country, target_gender',
    idFields: [],
    titleFields: ['title'],
    summaryFields: ['content'],
    searchFields: ['title', 'content', 'category', 'target_country', 'target_gender'],
    metadataFields: ['category', 'target_country', 'target_gender'],
  },
  {
    group: 'notices',
    sourceType: 'notice',
    table: 'notice',
    select: 'title, content, language, posted_date',
    idFields: [],
    titleFields: ['title'],
    summaryFields: ['content'],
    searchFields: ['title', 'content', 'language'],
    metadataFields: ['language', 'posted_date'],
  },
  {
    group: 'scholarships',
    sourceType: 'scholarship',
    table: 'scholarship',
    select: 'scholarship_id, name, type, description, deadline, amount',
    idFields: ['scholarship_id'],
    titleFields: ['name'],
    summaryFields: ['description'],
    searchFields: ['name', 'type', 'description'],
    metadataFields: ['type', 'deadline', 'amount'],
  },
  {
    group: 'courses',
    sourceType: 'course',
    table: 'course',
    select: 'course_id, course_name, credit, major_id, category',
    idFields: ['course_id'],
    titleFields: ['course_name'],
    summaryFields: ['category'],
    searchFields: ['course_name', 'category'],
    metadataFields: ['credit', 'major_id', 'category'],
  },
  {
    group: 'majors',
    sourceType: 'major',
    table: 'major',
    select: 'major_id, major_name, department',
    idFields: ['major_id'],
    titleFields: ['major_name'],
    summaryFields: ['department'],
    searchFields: ['major_name', 'department'],
    metadataFields: ['department'],
  },
];

function emptyResponse(query = '') {
  return {
    query,
    results: {
      knowledgeBase: [],
      notices: [],
      scholarships: [],
      courses: [],
      majors: [],
    },
    errors: [],
  };
}

function getLimitPerSource(options) {
  return Number.isInteger(options.limitPerSource) && options.limitPerSource > 0
    ? options.limitPerSource
    : DEFAULT_LIMIT_PER_SOURCE;
}

function escapeOrValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function buildOrFilter(fields, query) {
  const escapedQuery = escapeOrValue(query);
  return fields.map((field) => `${field}.ilike.%${escapedQuery}%`).join(',');
}

function stringifyValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function firstValue(row, fields) {
  for (const field of fields) {
    const value = stringifyValue(row[field]).trim();
    if (value) {
      return value;
    }
  }

  return '';
}

function makeSummary(row, fields) {
  const summary = firstValue(row, fields);
  return summary.length > 240 ? `${summary.slice(0, 237)}...` : summary;
}

function buildMetadata(row, fields) {
  return fields.reduce((metadata, field) => {
    metadata[field] = row[field] ?? null;
    return metadata;
  }, {});
}

function includesQuery(value, normalizedQuery) {
  return stringifyValue(value).toLowerCase().includes(normalizedQuery.toLowerCase());
}

function equalsQuery(value, normalizedQuery) {
  return stringifyValue(value).trim().toLowerCase() === normalizedQuery.toLowerCase();
}

function scoreRow(row, source, normalizedQuery) {
  let score = 0;

  for (const field of source.titleFields) {
    if (equalsQuery(row[field], normalizedQuery)) {
      score += 100;
    } else if (includesQuery(row[field], normalizedQuery)) {
      score += 60;
    }
  }

  for (const field of source.summaryFields) {
    if (includesQuery(row[field], normalizedQuery)) {
      score += 25;
    }
  }

  for (const field of source.metadataFields) {
    if (includesQuery(row[field], normalizedQuery)) {
      score += 10;
    }
  }

  for (const field of source.idFields) {
    if (equalsQuery(row[field], normalizedQuery)) {
      score += 40;
    } else if (includesQuery(row[field], normalizedQuery)) {
      score += 15;
    }
  }

  return score;
}

function normalizeRow(row, source, normalizedQuery, index) {
  const id = firstValue(row, source.idFields) || `${source.table}:${index}`;
  const title = firstValue(row, source.titleFields) || id;

  return {
    sourceType: source.sourceType,
    id,
    title,
    summary: makeSummary(row, source.summaryFields),
    metadata: buildMetadata(row, source.metadataFields),
    score: scoreRow(row, source, normalizedQuery),
  };
}

async function searchSource(source, normalizedQuery, limitPerSource) {
  try {
    const { data, error } = await supabase
      .from(source.table)
      .select(source.select)
      .or(buildOrFilter(source.searchFields, normalizedQuery))
      // Fetch a small surplus before local scoring so weak DB order does not hide better matches.
      .limit(limitPerSource * 3);

    if (error) {
      return {
        error: {
          sourceType: source.sourceType,
          table: source.table,
          message: error.message || String(error),
        },
        results: [],
      };
    }

    const results = (data || [])
      .map((row, index) => normalizeRow(row, source, normalizedQuery, index))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limitPerSource);

    return {
      error: null,
      results,
    };
  } catch (err) {
    return {
      error: {
        sourceType: source.sourceType,
        table: source.table,
        message: err.message || String(err),
      },
      results: [],
    };
  }
}

async function searchUniversityInformation(query, options = {}) {
  if (typeof query !== 'string') {
    return emptyResponse('');
  }

  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) {
    return emptyResponse(normalizedQuery);
  }

  const response = emptyResponse(normalizedQuery);
  const limitPerSource = getLimitPerSource(options);

  await Promise.all(
    SOURCES.map(async (source) => {
      const result = await searchSource(source, normalizedQuery, limitPerSource);
      response.results[source.group] = result.results;
      if (result.error) {
        response.errors.push(result.error);
      }
    })
  );

  return response;
}

module.exports = {
  searchUniversityInformation,
  EMPTY_RESULTS,
};
