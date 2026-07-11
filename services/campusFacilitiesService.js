const supabase = require('../supabaseClient');
const { localizeRows } = require('../middleware/languageMiddleware');
const { getBusanCafeteriaMenus } = require('./pnuCafeteriaMenuScraperService');

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

  try {
    const cafeteriaData = await getBusanCafeteriaMenus({ menuDate, language });

    return {
      shuttle_bus_metadata: {
        key_stops: shuttleStops,
      },
      cafeterias: cafeteriaData.cafeterias,
      cafeteria_source: cafeteriaData.cafeteria_source,
      scraped_at: cafeteriaData.scraped_at,
      menu_date: cafeteriaData.menu_date,
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
    };
  }
}

module.exports = {
  getCampusFacilities,
};
