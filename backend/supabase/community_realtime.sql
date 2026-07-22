-- Enable Supabase Realtime + read access for community_post (frontend direct reads)
-- Run once in Supabase SQL Editor after community.sql

-- 1) Add community_post to Realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'community_post'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE community_post;
    END IF;
  END IF;
END $$;

-- 2) RLS: allow anon/authenticated SELECT (app auth is custom JWT via backend API for writes)
ALTER TABLE community_post ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_post_public_read ON community_post;
CREATE POLICY community_post_public_read ON community_post
  FOR SELECT
  TO anon, authenticated
  USING (reported = false);
