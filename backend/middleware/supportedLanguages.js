/** PDF + Accept-Language supported ISO 639-1 codes (lowercase). */
const SUPPORTED_LANGUAGE_PREFS = [
  'en',
  'ko',
  'zh',
  'th',
  'bn',
  'mn',
  'vi',
  'hi',
  'kk',
  'id',
  'fa',
  'uz',
  'ja',
  'my',
  'ur',
  'ru',
  'am',
  'tr',
  'es',
];

const SUPPORTED_LANGUAGE_PREF_SET = new Set(SUPPORTED_LANGUAGE_PREFS);

/** Map display names / legacy uppercase prefs to the stored ISO code. */
const LANGUAGE_PREF_ALIASES = {
  english: 'en',
  en: 'en',
  eng: 'en',
  korean: 'ko',
  ko: 'ko',
  kr: 'ko',
  chinese: 'zh',
  zh: 'zh',
  cn: 'zh',
  thai: 'th',
  th: 'th',
  bengali: 'bn',
  bn: 'bn',
  mongolian: 'mn',
  mn: 'mn',
  vietnamese: 'vi',
  vi: 'vi',
  hindi: 'hi',
  hi: 'hi',
  kazakh: 'kk',
  kk: 'kk',
  indonesian: 'id',
  id: 'id',
  persian: 'fa',
  farsi: 'fa',
  fa: 'fa',
  uzbek: 'uz',
  uz: 'uz',
  japanese: 'ja',
  ja: 'ja',
  burmese: 'my',
  myanmar: 'my',
  my: 'my',
  urdu: 'ur',
  ur: 'ur',
  russian: 'ru',
  ru: 'ru',
  amharic: 'am',
  am: 'am',
  turkish: 'tr',
  tr: 'tr',
  spanish: 'es',
  es: 'es',
};

/**
 * Resolve a client language_pref to a durable stored ISO code.
 * Returns null when the value cannot be mapped to a supported language
 * (never silently remaps unsupported langs to English).
 */
function resolveLanguagePref(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const raw = String(value).trim();
  const lower = raw.toLowerCase();
  const base = lower.split(/[-_]/)[0];

  const fromAlias =
    LANGUAGE_PREF_ALIASES[lower] ||
    LANGUAGE_PREF_ALIASES[base] ||
    (SUPPORTED_LANGUAGE_PREF_SET.has(base) ? base : null);

  return fromAlias || null;
}

function isSupportedLanguagePref(value) {
  return SUPPORTED_LANGUAGE_PREF_SET.has(String(value || '').toLowerCase());
}

module.exports = {
  SUPPORTED_LANGUAGE_PREFS,
  SUPPORTED_LANGUAGE_PREF_SET,
  LANGUAGE_PREF_ALIASES,
  resolveLanguagePref,
  isSupportedLanguagePref,
};
