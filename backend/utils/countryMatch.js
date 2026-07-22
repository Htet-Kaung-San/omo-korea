const COUNTRY_ALIASES = {
  myanmar: ["myanmar", "burma"],
  china: ["china", "chinese"],
  vietnam: ["vietnam", "vietnamese"],
  japan: ["japan", "japanese"],
  mongolia: ["mongolia", "mongolian"],
  "south korea": ["south korea", "korea", "korean", "republic of korea"],
  india: ["india", "indian"],
  nepal: ["nepal", "nepalese", "nepali"],
  thailand: ["thailand", "thai"],
  indonesia: ["indonesia", "indonesian"],
  philippines: ["philippines", "filipino", "filipina"],
  uzbekistan: ["uzbekistan", "uzbek"],
};

function normalizeCountry(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function countryKey(value) {
  const normalized = normalizeCountry(value);
  if (!normalized) return null;

  for (const [key, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (normalized === key || aliases.includes(normalized)) {
      return key;
    }
  }

  return normalized;
}

function countryMatches(countryA, countryB) {
  if (!countryA || !countryB) return false;
  const a = countryKey(countryA);
  const b = countryKey(countryB);
  return a !== null && b !== null && a === b;
}

module.exports = {
  countryMatches,
  countryKey,
};
