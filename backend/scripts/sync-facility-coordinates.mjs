import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import { OFFICIAL_PNU_FACILITIES } from "../data/pnuFacilities.mjs";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
  console.error("Error: Configure valid SUPABASE_URL and SUPABASE_KEY in backend/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Strict bounding box check for PNU Jangjeon Campus (Busan, Geumjeong-gu).
 * Lat: 35.220 ~ 35.245, Lng: 129.070 ~ 129.095
 */
function isWithinPNUBusan(lat, lng) {
  return lat >= 35.220 && lat <= 35.245 && lng >= 129.070 && lng <= 129.095;
}

/**
 * Generate candidate search query strings strictly using ONLY name_ko.
 */
function buildSearchQueries(facility) {
  const candidates = [];

  // Match official record if DB row is missing name_ko
  const matchedOfficial = OFFICIAL_PNU_FACILITIES.find(
    (f) =>
      (facility.building_number && f.building_number === facility.building_number) ||
      f.name?.toLowerCase() === facility.name?.toLowerCase() ||
      (facility.name_ko && f.name_ko === facility.name_ko)
  );

  const nameKo = (facility.name_ko || matchedOfficial?.name_ko || "").trim();
  const bNo = facility.building_number || matchedOfficial?.building_number || "";

  if (!nameKo) {
    return { candidates: ["부산대학교"], nameKo: "", bNo };
  }

  // 1. Direct candidate with 부산대학교 prefix
  const full = nameKo.includes("부산대") || nameKo.includes("부산대학교") ? nameKo : `부산대학교 ${nameKo}`;
  candidates.push(full);

  // 2. Clean spaces and special characters: "MEMS / NANO 클린룸동" -> "부산대학교 MEMS NANO 클린룸동"
  const spaceClean = full.replace(/[\/·]/g, " ").replace(/\s+/g, " ").trim();
  candidates.push(spaceClean);

  // 3. Handle parentheses: "제3공학관(융합기계관)" -> "부산대학교 제3공학관", "부산대학교 융합기계관"
  if (nameKo.includes("(")) {
    const mainPart = nameKo.replace(/\([^)]*\)/g, "").trim();
    if (mainPart) {
      candidates.push(mainPart.includes("부산대") ? mainPart : `부산대학교 ${mainPart}`);
    }
    const match = nameKo.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      const inside = match[1].trim();
      candidates.push(inside.includes("부산대") ? inside : `부산대학교 ${inside}`);
    }
  }

  // 4. Handle " 및 ": "중앙도서관 및 AX·정보화혁신본부"
  if (nameKo.includes(" 및 ")) {
    const parts = nameKo.split(" 및 ").map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      candidates.push(part.includes("부산대") ? part : `부산대학교 ${part}`);
    }
  }

  // 5. Handle trailing suffixes: " A동", " B동", " 가동", " 나동", " 다동", " 강의동", " 연구동", " 관리동"
  const baseBuilding = nameKo.replace(/\s+(A동|B동|가동|나동|다동|강의동|연구동|관리동|교수연구동|A|B)$/gi, "").trim();
  if (baseBuilding && baseBuilding !== nameKo) {
    candidates.push(baseBuilding.includes("부산대") ? baseBuilding : `부산대학교 ${baseBuilding}`);
  }

  return {
    candidates: Array.from(new Set(candidates)),
    nameKo,
    bNo,
  };
}

/**
 * Geocode building via REST API if client secret is available.
 */
async function geocodeViaRestApi(query) {
  const clientId = process.env.NCP_CLIENT_ID || process.env.NAVER_CLIENT_ID || process.env.VITE_NAVER_MAP_CLIENT_ID;
  const clientSecret = process.env.NCP_CLIENT_SECRET || process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  try {
    const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
        "Accept": "application/json",
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const addr = json?.addresses?.[0];
    if (addr && addr.x && addr.y) {
      return {
        lat: parseFloat(addr.y),
        lng: parseFloat(addr.x),
        address: addr.roadAddress || addr.jibunAddress,
        source: "Naver Geocoding REST API",
      };
    }
  } catch (err) {
    console.warn(`[REST API] Geocode failed for "${query}":`, err.message);
  }
  return null;
}

async function main() {
  console.log("--- Hey! PNU Supabase Facility Coordinate Sync (Using ONLY name_ko) ---");
  console.log("Fetching facilities from Supabase...");

  let { data: facilities, error } = await supabase
    .from("facility")
    .select("facility_id, name, name_ko, building_number, type, latitude, longitude")
    .order("facility_id", { ascending: true });

  if (error) {
    console.warn("Primary select failed (" + error.message + "). Trying fallback select...");
    const fallback = await supabase
      .from("facility")
      .select("facility_id, name, type, latitude, longitude")
      .order("facility_id", { ascending: true });
    facilities = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error("Failed to query facilities from Supabase:", error.message);
    process.exit(1);
  }

  if (!facilities || facilities.length === 0) {
    console.log("No facilities found in Supabase facility table.");
    process.exit(0);
  }

  console.log(`Found ${facilities.length} facility entries in Supabase.`);

  let browser = null;
  let page = null;

  // Launch Playwright for Naver Map POI lookup
  try {
    console.log("Launching headless browser for Naver Map search...");
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      locale: "ko-KR",
    });
    page = await context.newPage();
  } catch (err) {
    console.warn("Could not launch Playwright browser:", err.message);
  }

  const results = [];

  for (const facility of facilities) {
    const { candidates: candidateQueries, nameKo, bNo } = buildSearchQueries(facility);
    const displayName = nameKo ? `${facility.name} (${nameKo})` : facility.name;
    console.log(`\nProcessing ID ${facility.facility_id}: [${bNo || "N/A"}] "${displayName}" -> Candidates (name_ko only): ${JSON.stringify(candidateQueries)}`);

    let geoResult = null;
    let successfulQuery = "";

    for (const searchQuery of candidateQueries) {
      if (geoResult) break;

      const restCandidate = await geocodeViaRestApi(searchQuery);
      if (restCandidate && isWithinPNUBusan(restCandidate.lat, restCandidate.lng)) {
        geoResult = restCandidate;
        successfulQuery = searchQuery;
        break;
      }

      if (page) {
        let captured = null;

        const responseHandler = async (response) => {
          const url = response.url();
          if (url.includes("/api/search") || url.includes("/search2/")) {
            try {
              const json = await response.json();
              const placeList =
                json?.result?.place?.list ||
                json?.places ||
                json?.result?.site?.list ||
                [];

              for (const place of placeList) {
                if (place && place.x && place.y) {
                  const lat = parseFloat(place.y);
                  const lng = parseFloat(place.x);
                  const addrStr = (place.address || place.roadAddress || place.name || "").toString();

                  if (isWithinPNUBusan(lat, lng)) {
                    captured = {
                      lat,
                      lng,
                      title: place.name || place.title,
                      address: addrStr,
                      source: "Naver Map Web POI",
                    };
                    break;
                  }
                }
              }
            } catch {
              /* non-json response */
            }
          }
        };

        page.on("response", responseHandler);

        try {
          const searchUrl = `https://map.naver.com/p/search/${encodeURIComponent(searchQuery)}`;
          await page.goto(searchUrl, { waitUntil: "load", timeout: 10000 });
          await page.waitForTimeout(2000);

          if (!captured) {
            const currentUrl = page.url();
            const match = currentUrl.match(/c=([1-9][0-9.]*),([1-9][0-9.]*)/);
            if (match) {
              const lng = parseFloat(match[1]);
              const lat = parseFloat(match[2]);
              if (isWithinPNUBusan(lat, lng)) {
                captured = {
                  lng,
                  lat,
                  title: searchQuery,
                  source: "Naver Map Canvas URL",
                };
              }
            }
          }

          if (captured) {
            geoResult = captured;
            successfulQuery = searchQuery;
          }
        } catch (err) {
          console.warn(`  [Web POI Search] Timeout/Error for "${searchQuery}":`, err.message);
        } finally {
          page.off("response", responseHandler);
        }
      }
    }

    if (geoResult) {
      console.log(`  -> Found coordinates: [Lat: ${geoResult.lat}, Lng: ${geoResult.lng}] (${geoResult.source})`);
      
      const { error: updateError } = await supabase
        .from("facility")
        .update({
          latitude: geoResult.lat,
          longitude: geoResult.lng,
        })
        .eq("facility_id", facility.facility_id);

      if (updateError) {
        console.error(`  [Supabase DB Update FAIL] ID ${facility.facility_id}: ${updateError.message}`);
      } else {
        console.log(`  [Supabase DB Update SUCCESS] Updated ID ${facility.facility_id}`);
      }

      results.push({
        id: facility.facility_id,
        name: facility.name,
        name_ko: nameKo,
        building_number: bNo,
        query: successfulQuery,
        lat: geoResult.lat,
        lng: geoResult.lng,
        status: "UPDATED",
      });
    } else {
      console.warn(`  -> Could not locate coordinates for candidates: ${JSON.stringify(candidateQueries)}`);
      results.push({
        id: facility.facility_id,
        name: facility.name,
        name_ko: nameKo,
        building_number: bNo,
        query: candidateQueries.join(" / "),
        lat: facility.latitude,
        lng: facility.longitude,
        status: "SKIPPED",
      });
    }
  }

  if (browser) {
    await browser.close();
  }

  console.log("\n================ SYNC SUMMARY ================");
  console.table(results);
  console.log("Facility coordinates sync completed successfully.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
