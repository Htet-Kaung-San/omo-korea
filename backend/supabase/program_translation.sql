-- Persisted AI translations for extracurricular programs (Korean source -> English).
--
-- The request path reads this table so translated programs survive server
-- restarts and the page never blocks on the AI provider for items that have
-- already been translated once. The boot warm-populator fills it in the
-- background; the detail endpoint tops up any single program on demand.
--
-- Run once in the Supabase SQL Editor after extracurricular_program exists.

create table if not exists program_translation (
  program_id bigint primary key references extracurricular_program (program_id) on delete cascade,
  title_en text,
  category_en text,
  description_en text,
  match_hint_en text,
  updated_at timestamptz not null default now()
);

create index if not exists program_translation_updated_at_idx
  on program_translation (updated_at desc);
