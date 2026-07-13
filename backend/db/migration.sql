-- 1. Enable the vector extension for semantic similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the raw document table (Pattern A CMS / Admin Source)
CREATE TABLE IF NOT EXISTS kb_document (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- e.g. 'Curriculum', 'Visa', 'Scholarship', 'Academics'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_country VARCHAR(100) DEFAULT 'ALL', -- e.g. 'Vietnam', 'Mongolia' or 'ALL'
    target_gender VARCHAR(20) DEFAULT 'ALL' CHECK (target_gender IN ('ALL', 'Male', 'Female')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create the vector chunks table for RAG embeddings retrieval
CREATE TABLE IF NOT EXISTS kb_chunk (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES kb_document(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding vector(768) NOT NULL, -- 768 dimensions for Gemini text-embedding-004
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create an HNSW index for high-speed vector cosine similarity search
CREATE INDEX IF NOT EXISTS idx_kb_chunk_embedding ON kb_chunk USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_kb_chunk_document ON kb_chunk(document_id);

-- 5. Create vector similarity RPC function for client execution
CREATE OR REPLACE FUNCTION match_kb_chunks(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_category varchar DEFAULT NULL,
  filter_country varchar DEFAULT 'ALL',
  filter_gender varchar DEFAULT 'ALL'
)
RETURNS TABLE (
  id int,
  document_id int,
  chunk_text text,
  title varchar,
  category varchar,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.chunk_text,
    d.title,
    d.category,
    (1 - (c.embedding <=> query_embedding))::float AS similarity
  FROM kb_chunk c
  JOIN kb_document d ON c.document_id = d.id
  WHERE (filter_category IS NULL OR d.category = filter_category)
    AND (filter_country = 'ALL' OR d.target_country = 'ALL' OR d.target_country = filter_country)
    AND (filter_gender = 'ALL' OR d.target_gender = 'ALL' OR d.target_gender = filter_gender)
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. Add onboarding wizard fields to student table if not exists
ALTER TABLE student ADD COLUMN IF NOT EXISTS is_in_korea BOOLEAN DEFAULT TRUE;
ALTER TABLE student ADD COLUMN IF NOT EXISTS mbti VARCHAR(10);
ALTER TABLE student ADD COLUMN IF NOT EXISTS d2_semester VARCHAR(20);
ALTER TABLE student ADD COLUMN IF NOT EXISTS completed_courses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE student ADD COLUMN IF NOT EXISTS deletion_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE student ADD COLUMN IF NOT EXISTS intake_term VARCHAR(20) DEFAULT 'March';
ALTER TABLE student ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 7. Expand language_pref beyond legacy EN/KO/ZH (see migrations/20260713_expand_language_pref.sql)
ALTER TABLE student DROP CONSTRAINT IF EXISTS student_language_pref_check;

UPDATE student
SET language_pref = lower(language_pref)
WHERE language_pref IS NOT NULL
  AND language_pref <> lower(language_pref);

ALTER TABLE student
  ALTER COLUMN language_pref SET DEFAULT 'en';

ALTER TABLE student
  ADD CONSTRAINT student_language_pref_check
  CHECK (
    language_pref IS NULL
    OR language_pref IN (
      'en', 'ko', 'zh', 'th', 'bn', 'mn', 'vi', 'hi', 'kk', 'id',
      'fa', 'uz', 'ja', 'my', 'ur', 'ru', 'am', 'tr', 'es'
    )
  );
