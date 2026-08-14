-- Persisted AI translations for extracurricular programs for all languages.
--
-- The request path reads this table so translated programs survive server
-- restarts and the page never blocks on the AI provider for items that have
-- already been translated once.

-- Run this script in the Supabase SQL Editor.
-- WARNING: This will drop the existing `program_translation` table and recreate it,
-- clearing any currently cached translations.

drop table if exists program_translation;

create table program_translation (
  program_id bigint references extracurricular_program (program_id) on delete cascade,
  language varchar(5) not null,
  title text,
  category text,
  description text,
  match_hint text,
  updated_at timestamptz not null default now(),
  primary key (program_id, language)
);

create index program_translation_updated_at_idx
  on program_translation (updated_at desc);
