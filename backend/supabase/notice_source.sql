-- Extend existing notice table for scraped PNU board posts.
-- Run in Supabase SQL Editor once.

ALTER TABLE notice
  ALTER COLUMN title TYPE TEXT,
  ALTER COLUMN content TYPE TEXT;

ALTER TABLE notice
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS notice_source_url_uidx
  ON notice (source_url)
  WHERE source_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS notice_posted_date_idx
  ON notice (posted_date DESC);

CREATE INDEX IF NOT EXISTS notice_source_idx
  ON notice (source);
