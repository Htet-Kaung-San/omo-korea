import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY);

async function syncFiles() {
  const { data: facilities, error } = await supabase
    .from("facility")
    .select("facility_id, building_number, name, name_ko, type, latitude, longitude")
    .order("facility_id", { ascending: true });

  if (error || !facilities) {
    console.error("Err:", error);
    return;
  }

  // 1. Update backend/data/pnuFacilities.mjs
  let jsContent = `/**
 * Official PNU Campus Facilities (91 buildings, excluding auxiliary buildings)
 * Source: https://www.pusan.ac.kr/kor/CMS/Contents/Contents.do?mCode=MN212
 */
export const OFFICIAL_PNU_FACILITIES = [\n`;

  for (const f of facilities) {
    const escapedName = f.name.replace(/"/g, '\\"');
    const escapedNameKo = f.name_ko.replace(/"/g, '\\"');
    jsContent += `  { building_number: "${f.building_number}", name: "${escapedName}", name_ko: "${escapedNameKo}", type: "${f.type}", latitude: ${Number(f.latitude)}, longitude: ${Number(f.longitude)} },\n`;
  }
  jsContent += `];\n`;

  fs.writeFileSync("d:/PNU/hackathon/hey_pnu/omo-korea/backend/data/pnuFacilities.mjs", jsContent, "utf8");
  console.log("Updated backend/data/pnuFacilities.mjs");

  // 2. Update backend/supabase/map_profile_migration.sql
  let sqlContent = `-- ============================================================================
-- Hey! PNU — Reset & Recreate Facility Table with Exact 12 Columns
-- Run this script in Supabase SQL Editor (https://supabase.com -> SQL Editor)
-- ============================================================================

-- 1. Drop existing facility table to reset IDs from 1
DROP TABLE IF EXISTS facility CASCADE;

-- 2. Create facility table with ONLY the 12 specified columns
CREATE TABLE facility (
    facility_id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    name_ko VARCHAR(150),
    building_number VARCHAR(50),
    type VARCHAR(50) NOT NULL,
    latitude NUMERIC(10, 6) DEFAULT 0 NOT NULL,
    longitude NUMERIC(10, 6) DEFAULT 0 NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    image TEXT,
    departments JSONB DEFAULT '[]'::jsonb,
    amenities JSONB DEFAULT '[]'::jsonb
);

-- 3. Seed all 91 official PNU campus buildings starting from ID 1
INSERT INTO facility (facility_id, building_number, name, name_ko, type, latitude, longitude) VALUES\n`;

  const rows = facilities.map((f) => {
    const escName = f.name.replace(/'/g, "''");
    const escNameKo = f.name_ko.replace(/'/g, "''");
    return `(${f.facility_id}, '${f.building_number}', '${escName}', '${escNameKo}', '${f.type}', ${Number(f.latitude).toFixed(6)}, ${Number(f.longitude).toFixed(6)})`;
  });

  sqlContent += rows.join(",\n") + `;\n\n` +
    `-- 4. Advance sequence so new manually inserted records get ID 92+\n` +
    `SELECT setval('facility_facility_id_seq', (SELECT MAX(facility_id) FROM facility));\n`;

  fs.writeFileSync("d:/PNU/hackathon/hey_pnu/omo-korea/backend/supabase/map_profile_migration.sql", sqlContent, "utf8");
  console.log("Updated backend/supabase/map_profile_migration.sql");

  // 3. Update local_db.json
  const localDbPath = "d:/PNU/hackathon/hey_pnu/omo-korea/backend/data/local_db.json";
  if (fs.existsSync(localDbPath)) {
    const localDb = JSON.parse(fs.readFileSync(localDbPath, "utf8"));
    localDb.facilities = facilities.map((f) => ({
      facility_id: f.facility_id,
      id: f.facility_id,
      building_number: f.building_number,
      name: f.name,
      name_ko: f.name_ko,
      type: f.type,
      latitude: Number(f.latitude),
      longitude: Number(f.longitude),
    }));
    fs.writeFileSync(localDbPath, JSON.stringify(localDb, null, 2), "utf8");
    console.log("Updated backend/data/local_db.json");
  }
}

syncFiles().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
