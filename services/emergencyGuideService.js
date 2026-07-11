const supabase = require('../supabaseClient');
const { localizeRow, localizeRows } = require('../middleware/languageMiddleware');

const FALLBACK_QUICK_ACCESS = {
  police: { number: '112', label: 'Police' },
  fire_medical: { number: '119', label: 'Fire / Medical' },
  disease_control: { number: '1339', label: 'Disease control' },
};

const FALLBACK_DATABASE_CONTACTS = [
  {
    id: 'embassy-mongolia',
    type: 'embassy',
    name: 'Embassy of Mongolia',
    phone: '+82-2-794-1350',
    country_flag: '🇲🇳',
    map_query: 'Embassy of Mongolia Seoul',
  },
];

const FALLBACK_GUIDE_TEXT =
  "Stay calm. Say: '저 다쳤어요 (I'm hurt)' or '도와주세요 (Please help).' Share your location and student ID if possible.";

const COUNTRY_FLAGS = {
  Mongolia: '🇲🇳',
  Myanmar: '🇲🇲',
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

async function getEmergencyGuide(language = 'en') {
  const { data, error } = await supabase
    .from('emergency_contact')
    .select('contact_id, type, country, phone_number')
    .order('contact_id', { ascending: true });

  if (error) {
    console.warn('[emergencyGuideService] Supabase query failed:', error.message);
  }

  if (!error && Array.isArray(data) && data.length > 0) {
    const localizedRows = localizeRows(data, language, ['type', 'country']);
    const embassyContacts = localizedRows.filter(isEmbassyRow).map(mapEmergencyContact);
    const nearestContacts = localizedRows.filter((row) => !isEmbassyRow(row)).map(mapEmergencyContact);

    return {
      quick_access: buildQuickAccess(localizedRows),
      database_contacts: [...embassyContacts, ...nearestContacts],
      guide_text: FALLBACK_GUIDE_TEXT,
      source: 'supabase',
    };
  }

  return {
    quick_access: FALLBACK_QUICK_ACCESS,
    database_contacts: FALLBACK_DATABASE_CONTACTS,
    guide_text: FALLBACK_GUIDE_TEXT,
    source: 'fallback',
  };
}

module.exports = {
  getEmergencyGuide,
};
