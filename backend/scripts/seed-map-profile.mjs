/**
 * Seed real PNU campus map facilities + academic records into live Supabase DB.
 *
 * Contains all 91 main campus buildings extracted from the official PNU Campus Map
 * (https://www.pusan.ac.kr/kor/CMS/Contents/Contents.do?mCode=MN212), excluding auxiliary buildings.
 *
 * Usage:
 *   npm run seed:map-profile
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { OFFICIAL_PNU_FACILITIES as facilities } from "../data/pnuFacilities.mjs";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
  console.error("Configure real SUPABASE_URL / SUPABASE_KEY in backend/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // First query existing rows
  let { data: existingRows, error: selectErr } = await supabase
    .from("facility")
    .select("facility_id, name, name_ko, building_number, latitude, longitude");

  if (selectErr) {
    // If schema cache doesn't have name_ko / building_number yet, fall back to basic select
    const fallbackSelect = await supabase.from("facility").select("facility_id, name, latitude, longitude");
    existingRows = fallbackSelect.data;
  }

  console.log(`\nUpserting ${facilities.length} official PNU campus facilities starting from ID 1...`);
  let requiresMigrationNotice = false;

  let idx = 1;
  for (const row of facilities) {
    const facility_id = idx;
    idx++;

    const existingMatch = existingRows?.find(
      (f) =>
        (f.building_number && f.building_number === row.building_number) ||
        (f.name_ko && f.name_ko === row.name_ko) ||
        f.name?.toLowerCase() === row.name.toLowerCase()
    );

    let payload = {
      facility_id,
      ...row,
      latitude: existingMatch?.latitude && Number(existingMatch.latitude) > 0 ? Number(existingMatch.latitude) : 0,
      longitude: existingMatch?.longitude && Number(existingMatch.longitude) > 0 ? Number(existingMatch.longitude) : 0,
    };

    if (existingMatch?.facility_id) {
      let { error } = await supabase
        .from("facility")
        .update(payload)
        .eq("facility_id", existingMatch.facility_id);

      if (error && error.message.includes("Could not find")) {
        requiresMigrationNotice = true;
        const { building_number, name_ko, image, ...basePayload } = payload;
        const retry = await supabase
          .from("facility")
          .update(basePayload)
          .eq("facility_id", existingMatch.facility_id);
        error = retry.error;
      }

      if (error) console.error("FAIL update", row.building_number, row.name, error.message);
      else console.log("updated:", `ID ${facility_id}`, `[${row.building_number}]`, row.name_ko || row.name);
    } else {
      let { error } = await supabase.from("facility").insert(payload);

      if (error && error.message.includes("Could not find")) {
        requiresMigrationNotice = true;
        const { building_number, name_ko, image, ...basePayload } = payload;
        const retry = await supabase.from("facility").insert(basePayload);
        error = retry.error;
      }

      if (error) console.error("FAIL insert", row.building_number, row.name, error.message);
      else console.log("inserted:", `ID ${facility_id}`, `[${row.building_number}]`, row.name_ko || row.name);
    }
  }

  // Clear out any duplicate/old facility entries that don't match our exact list
  let { data: allFacilities } = await supabase.from("facility").select("facility_id, name, building_number");
  if (!allFacilities) {
    const fallbackAll = await supabase.from("facility").select("facility_id, name");
    allFacilities = fallbackAll.data;
  }

  for (const f of allFacilities || []) {
    const isTarget = facilities.some((real) => (f.building_number && real.building_number === f.building_number) || real.name === f.name);
    if (!isTarget) {
      console.log("Cleaning up extra facility row:", f.building_number || "", f.name, f.facility_id);
      await supabase.from("facility").delete().eq("facility_id", f.facility_id);
    }
  }

  const { count } = await supabase
    .from("facility")
    .select("*", { count: "exact", head: true });
  console.log("\nDone. Total verified facility count in DB:", count);

  if (requiresMigrationNotice) {
    console.warn("\n[SCHEMA NOTICE] Live Supabase table 'facility' does not have 'building_number' and 'name_ko' columns yet.");
    console.warn("Please run 'backend/supabase/map_profile_migration.sql' in Supabase SQL Editor to enable building numbers and Korean names in DB.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
