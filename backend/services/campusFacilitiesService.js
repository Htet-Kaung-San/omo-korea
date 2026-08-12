const supabase = require('../supabaseClient');
const { localizeRows } = require('../middleware/languageMiddleware');
const { getBusanCafeteriaMenus } = require('./pnuCafeteriaMenuScraperService');
const {
  isGeminiConfigured,
  translateCafeteriaMenus,
} = require('./geminiService');

const FALLBACK_SHUTTLE_STOPS = [
  { id: 'main-gate', name: 'Main Gate', description: 'Central campus entrance' },
  { id: 'library', name: 'Central Library', description: 'Library stop' },
  { id: 'engineering', name: 'Engineering Building', description: 'Engineering complex' },
  { id: 'dormitory', name: 'International Dormitory', description: 'On-campus housing' },
];

const FALLBACK_CAFETERIAS = [
  {
    id: 'cafeteria-main',
    name: 'Student Cafeteria (Main)',
    location: 'Near Central Library',
    hours: 'Mon–Fri 07:30–19:00',
    description: 'Main student dining hall with Korean and international options.',
  },
  {
    id: 'cafeteria-engineering',
    name: 'Engineering Cafeteria',
    location: 'Engineering Building B1',
    hours: 'Mon–Fri 08:00–18:00',
    description: 'Quick meals and snacks near engineering classrooms.',
  },
];

function mapFacility(row) {
  return {
    id: String(row.facility_id ?? row.id),
    type: row.type ?? row.facility_type ?? 'other',
    name: row.name ?? 'Facility',
    location: row.location ?? null,
    hours: row.hours ?? row.opening_hours ?? null,
    description: row.description ?? null,
  };
}

async function getShuttleStops(language = 'en') {
  const { data, error } = await supabase.from('facility').select('*');

  if (!error && Array.isArray(data) && data.length > 0) {
    const localized = localizeRows(data, language, ['name', 'location', 'hours', 'description']);
    const shuttleStops = localized
      .filter((item) => (item.type ?? item.facility_type) === 'shuttle_stop')
      .map(mapFacility);

    if (shuttleStops.length > 0) {
      return shuttleStops;
    }
  }

  return FALLBACK_SHUTTLE_STOPS;
}

async function getCampusFacilities(language = 'en', { menuDate = '' } = {}) {
  const shuttleStops = await getShuttleStops(language);
  const lang = String(language || 'en').toLowerCase().split('-')[0];
  // Cafeteria menus only: Korean for ko, English for every other UI language.
  const cafeteriaLang = lang === 'ko' ? 'ko' : 'en';

  try {
    // Always read Korean source first (cached / Supabase / background scrape),
    // never blocking the request on a live scrape. The menu is then translated
    // to English; the background pre-scrape warms the translation cache at boot,
    // so this is normally a cache hit and stays fast. On a cold cache we block
    // and translate so the page always shows English.
    const cafeteriaData = await getBusanCafeteriaMenus({
      menuDate,
      language: 'ko',
      nonBlocking: true,
    });
    let cafeterias = cafeteriaData.cafeterias;
    let menuTranslated = false;

    if (cafeterias.length === 0) {
      return {
        shuttle_bus_metadata: {
          key_stops: shuttleStops,
        },
        cafeterias: FALLBACK_CAFETERIAS,
        cafeteria_source: 'fallback',
        scraped_at: null,
        menu_translated: false,
      };
    }

    if (cafeteriaLang !== 'ko' && (isGeminiConfigured() || process.env.OPENROUTER_API_KEY)) {
      const result = await translateCafeteriaMenus(
        cafeterias,
        cafeteriaLang,
        `${cafeteriaData.scraped_at || ''}|${cafeteriaData.menu_date || menuDate || 'current'}`,
      );
      cafeterias = result.cafeterias;
      menuTranslated = Boolean(result.translated);
    }

    return {
      shuttle_bus_metadata: {
        key_stops: shuttleStops,
      },
      cafeterias,
      cafeteria_source: cafeteriaData.cafeteria_source,
      scraped_at: cafeteriaData.scraped_at,
      menu_date: cafeteriaData.menu_date,
      menu_translated: menuTranslated,
    };
  } catch (error) {
    console.warn('[campusFacilitiesService] Cafeteria scrape unavailable:', error.message);

    return {
      shuttle_bus_metadata: {
        key_stops: shuttleStops,
      },
      cafeterias: FALLBACK_CAFETERIAS,
      cafeteria_source: 'fallback',
      scraped_at: null,
      menu_translated: false,
    };
  }
}

module.exports = {
  getCampusFacilities,
};
