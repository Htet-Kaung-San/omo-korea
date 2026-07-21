-- Drop translated description columns (keep single `description` only).
-- Run in Supabase SQL Editor if you previously added description_XX columns.

ALTER TABLE extracurricular_program
  DROP COLUMN IF EXISTS description_en,
  DROP COLUMN IF EXISTS description_ko,
  DROP COLUMN IF EXISTS description_zh,
  DROP COLUMN IF EXISTS description_th,
  DROP COLUMN IF EXISTS description_bn,
  DROP COLUMN IF EXISTS description_mn,
  DROP COLUMN IF EXISTS description_vi,
  DROP COLUMN IF EXISTS description_hi,
  DROP COLUMN IF EXISTS description_kk,
  DROP COLUMN IF EXISTS description_id,
  DROP COLUMN IF EXISTS description_fa,
  DROP COLUMN IF EXISTS description_uz,
  DROP COLUMN IF EXISTS description_ja,
  DROP COLUMN IF EXISTS description_my,
  DROP COLUMN IF EXISTS description_ur,
  DROP COLUMN IF EXISTS description_ru,
  DROP COLUMN IF EXISTS description_am,
  DROP COLUMN IF EXISTS description_tr,
  DROP COLUMN IF EXISTS description_es;
