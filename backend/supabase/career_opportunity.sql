-- Shared job / internship / volunteer opportunity cache.
-- Run in Supabase SQL Editor once. Safe to re-run.

CREATE TABLE IF NOT EXISTS career_opportunity (
  opportunity_id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  role TEXT,
  deadline DATE,
  application_type TEXT,
  source_url TEXT NOT NULL,
  location TEXT,
  job_type TEXT NOT NULL CHECK (job_type IN ('internship', 'part-time', 'full-time', 'volunteer')),
  language TEXT NOT NULL DEFAULT 'ko',
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS career_opportunity_active_deadline_idx
  ON career_opportunity (is_active, deadline);

CREATE INDEX IF NOT EXISTS career_opportunity_job_type_idx
  ON career_opportunity (job_type);
