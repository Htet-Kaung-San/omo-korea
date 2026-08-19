/**
 * Format a major or department name for clean UI presentation.
 * If the name contains a sub-major delimiter (e.g. ' - '),
 * takes only the first primary department part.
 * Example:
 *   'Computer Science and Engineering - Computer Engineering major' -> 'Computer Science and Engineering'
 *   '정보컴퓨터공학부 - 컴퓨터공학전공' -> '정보컴퓨터공학부'
 *   'Business Administration' -> 'Business Administration'
 */
export function formatMajorName(name: string | null | undefined): string {
  if (!name) return ''
  const trimmed = String(name).trim()
  if (!trimmed) return ''
  const parts = trimmed.split(/\s*-\s*/)
  return parts[0].trim() || trimmed
}
