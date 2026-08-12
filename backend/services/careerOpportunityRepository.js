const supabase = require("../supabaseClient");

function mapCareerOpportunityRow(row) {
  return {
    id: `${row.source}:${row.external_id}`,
    source: row.source,
    company: row.company,
    title: row.title,
    deadline: row.deadline || "",
    role: row.role || null,
    applicationType: row.application_type || null,
    sourceUrl: row.source_url,
    location: row.location || null,
    jobType: row.job_type || null,
    logoUrl: null,
    matchReason: row.raw_data?.matchReason || null,
  };
}

async function fetchStoredCareerOpportunities({ limit = 20, jobType = null } = {}) {
  let query = supabase
    .from("career_opportunity")
    .select(
      "source, external_id, company, title, role, deadline, application_type, source_url, location, job_type, raw_data",
    )
    .eq("is_active", true)
    .order("deadline", { ascending: true, nullsFirst: false })
    .order("scraped_at", { ascending: false })
    .limit(limit);

  if (jobType) {
    query = query.eq("job_type", jobType);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data || []).map(mapCareerOpportunityRow);
}

async function upsertCareerOpportunities(opportunities = []) {
  if (!opportunities.length) {
    return { rows: [], count: 0 };
  }

  const rows = opportunities.map((item) => ({
    source: item.source,
    external_id: item.externalId,
    company: item.company,
    title: item.title,
    role: item.role || null,
    deadline: item.deadline || null,
    application_type: item.applicationType || null,
    source_url: item.sourceUrl,
    location: item.location || null,
    job_type: item.jobType,
    language: item.language || "ko",
    scraped_at: item.scrapedAt || new Date().toISOString(),
    is_active: item.isActive !== false,
    raw_data: item.rawData || {},
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("career_opportunity")
    .upsert(rows, { onConflict: "source,external_id" })
    .select();

  if (error) {
    throw error;
  }

  return { rows: data || [], count: data?.length || rows.length };
}

module.exports = {
  fetchStoredCareerOpportunities,
  mapCareerOpportunityRow,
  upsertCareerOpportunities,
};
