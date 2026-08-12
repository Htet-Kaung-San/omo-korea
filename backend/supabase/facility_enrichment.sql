-- Enrich facility table for map / building detail UI to match exact 12 columns
ALTER TABLE facility
  ADD COLUMN IF NOT EXISTS name_ko VARCHAR(150),
  ADD COLUMN IF NOT EXISTS building_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS website VARCHAR(255),
  ADD COLUMN IF NOT EXISTS image TEXT,
  ADD COLUMN IF NOT EXISTS departments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;

-- Drop all non-schema columns
ALTER TABLE facility
  DROP COLUMN IF EXISTS hours,
  DROP COLUMN IF EXISTS floors,
  DROP COLUMN IF EXISTS image_url,
  DROP COLUMN IF EXISTS details,
  DROP COLUMN IF EXISTS subtitle;
