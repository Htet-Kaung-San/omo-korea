const COUNTRY_ALIASES: Record<string, string[]> = {
  myanmar: ['myanmar', 'burma'],
  china: ['china', 'chinese'],
  vietnam: ['vietnam', 'vietnamese'],
  japan: ['japan', 'japanese'],
  mongolia: ['mongolia', 'mongolian'],
  'south korea': ['south korea', 'korea', 'korean', 'republic of korea'],
  india: ['india', 'indian'],
  nepal: ['nepal', 'nepalese', 'nepali'],
  thailand: ['thailand', 'thai'],
  indonesia: ['indonesia', 'indonesian'],
  philippines: ['philippines', 'filipino', 'filipina'],
  uzbekistan: ['uzbekistan', 'uzbek'],
}

function normalizeCountry(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function countryKey(value: string | null | undefined) {
  const normalized = normalizeCountry(String(value || ''))
  if (!normalized) return null

  for (const [key, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (normalized === key || aliases.includes(normalized)) {
      return key
    }
  }

  return normalized
}

export function countryMatches(
  countryA: string | null | undefined,
  countryB: string | null | undefined,
) {
  if (!countryA || !countryB) return false
  const a = countryKey(countryA)
  const b = countryKey(countryB)
  return a !== null && b !== null && a === b
}
