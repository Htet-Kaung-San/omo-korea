const supabase = require('../supabaseClient');
const { localizeRow, localizeRows } = require('../middleware/languageMiddleware');
const { countryMatches } = require('../utils/countryMatch');

const FALLBACK_QUICK_ACCESS = {
  police: { number: '112', label: 'Police' },
  fire_medical: { number: '119', label: 'Fire / Medical' },
  disease_control: { number: '1339', label: 'Disease control' },
};

const FALLBACK_DATABASE_CONTACTS = [
  {
    id: 'embassy-myanmar',
    type: 'embassy',
    country: 'Myanmar',
    name: 'Embassy of Myanmar',
    phone: '+82-2-798-0327',
    country_flag: '🇲🇲',
    map_query: 'Embassy of Myanmar Seoul',
  },
  {
    id: 'embassy-mongolia',
    type: 'embassy',
    country: 'Mongolia',
    name: 'Embassy of Mongolia',
    phone: '+82-2-794-1350',
    country_flag: '🇲🇳',
    map_query: 'Embassy of Mongolia Seoul',
  },
  {
    id: 'embassy-china',
    type: 'embassy',
    country: 'China',
    name: 'Embassy of China',
    phone: '+82-2-738-1038',
    country_flag: '🇨🇳',
    map_query: 'Embassy of China Seoul',
  },
  {
    id: 'embassy-vietnam',
    type: 'embassy',
    country: 'Vietnam',
    name: 'Embassy of Vietnam',
    phone: '+82-2-734-7948',
    country_flag: '🇻🇳',
    map_query: 'Embassy of Vietnam Seoul',
  },
];

const FALLBACK_GUIDE_TEXT =
  "Stay calm. Say: '저 다쳤어요 (I'm hurt)' or '도와주세요 (Please help).' Share your location and student ID if possible.";

const FALLBACK_VISA_OFFICES = [
  {
    name: 'Busan Immigration Office',
    unit: 'Main Branch',
    phone: '051-461-3000',
    address: 'Busan, Jung-gu, Jungang-daero 146',
  },
];

// Needs human/legal review before presenting as verified legal advice.
const JEONSE_FRAUD_PREVENTION = {
  notice:
    "Before signing any housing contract, check the Certified Copy of Real Estate Register (등기부등본) to secure your deposit.",
};

const COUNTRY_FLAGS = {
  Mongolia: '🇲🇳',
  Myanmar: '🇲🇲',
  China: '🇨🇳',
  Vietnam: '🇻🇳',
  Japan: '🇯🇵',
  'South Korea': '🇰🇷',
};

function normalizeType(value) {
  return String(value || '').trim().toLowerCase();
}

function isPoliceRow(row) {
  return normalizeType(row.type).includes('police') || normalizeType(row.type).includes('경찰');
}

function isFireRow(row) {
  return (
    normalizeType(row.type).includes('fire') ||
    normalizeType(row.type).includes('rescue') ||
    normalizeType(row.type).includes('소방')
  );
}

function isImmigrationRow(row) {
  return (
    normalizeType(row.type).includes('immigration') ||
    normalizeType(row.type).includes('출입국')
  );
}

function isEmbassyRow(row) {
  return normalizeType(row.type).includes('embassy');
}

function mapEmergencyContact(row) {
  const country = row.country ?? null;

  return {
    id: String(row.contact_id ?? row.id),
    type: isEmbassyRow(row) ? 'embassy' : 'other',
    name: row.type ?? 'Contact',
    phone: row.phone_number ?? row.phone ?? null,
    country_flag: COUNTRY_FLAGS[country] ?? null,
    distance: row.distance ?? null,
    map_query: isEmbassyRow(row) ? row.type : row.type ?? null,
    country,
  };
}

function buildQuickAccess(rows) {
  const policeRow = rows.find(isPoliceRow);
  const fireRow = rows.find(isFireRow);
  const immigrationRow = rows.find(isImmigrationRow);

  return {
    police: {
      number: policeRow?.phone_number ?? FALLBACK_QUICK_ACCESS.police.number,
      label: policeRow?.type ?? FALLBACK_QUICK_ACCESS.police.label,
    },
    fire_medical: {
      number: fireRow?.phone_number ?? FALLBACK_QUICK_ACCESS.fire_medical.number,
      label: fireRow?.type ?? FALLBACK_QUICK_ACCESS.fire_medical.label,
    },
    disease_control: {
      number: immigrationRow?.phone_number ?? FALLBACK_QUICK_ACCESS.disease_control.number,
      label: immigrationRow?.type ?? FALLBACK_QUICK_ACCESS.disease_control.label,
    },
  };
}

async function getEmergencyGuide(language = 'en', nationality = null) {
  const { data, error } = await supabase
    .from('emergency_contact')
    .select('contact_id, type, country, phone_number')
    .order('contact_id', { ascending: true });

  if (error) {
    console.warn('[emergencyGuideService] Supabase query failed:', error.message);
  }

  if (!error && Array.isArray(data) && data.length > 0) {
    const localizedRows = localizeRows(data, language, ['type', 'country']);
    const embassyContacts = localizedRows
      .filter(isEmbassyRow)
      .map(mapEmergencyContact)
      .filter(
        (contact) =>
          !nationality || countryMatches(contact.country, nationality),
      );
    const nearestContacts = localizedRows.filter((row) => !isEmbassyRow(row)).map(mapEmergencyContact);

    return {
      quick_access: buildQuickAccess(localizedRows),
      database_contacts: [...embassyContacts, ...nearestContacts],
      guide_text: FALLBACK_GUIDE_TEXT,
      visa_offices: FALLBACK_VISA_OFFICES,
      jeonse_fraud_prevention: JEONSE_FRAUD_PREVENTION,
      source: 'supabase',
    };
  }

  const fallbackEmbassies = FALLBACK_DATABASE_CONTACTS.filter(
    (contact) =>
      contact.type === 'embassy' &&
      (!nationality || countryMatches(contact.country, nationality)),
  );

  return {
    quick_access: FALLBACK_QUICK_ACCESS,
    database_contacts: fallbackEmbassies,
    guide_text: FALLBACK_GUIDE_TEXT,
    visa_offices: FALLBACK_VISA_OFFICES,
    jeonse_fraud_prevention: JEONSE_FRAUD_PREVENTION,
    source: 'fallback',
  };
}

module.exports = {
  getEmergencyGuide,
};
