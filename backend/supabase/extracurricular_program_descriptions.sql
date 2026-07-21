-- Single program body column for in-app display (source_url = original post link).
-- Run once in Supabase SQL Editor after extracurricular_program exists.
--
-- If you added description_en / description_ko / … columns earlier, run
-- extracurricular_program_descriptions_drop_i18n.sql first.

ALTER TABLE extracurricular_program
  ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN extracurricular_program.description IS 'Program details shown in the app';

-- Example:
-- update extracurricular_program
-- set description = '1:1 resume clinic. Pre-registration required.'
-- where program_id = 1;
