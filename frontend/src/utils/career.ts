import type { CareerJobType, CareerOpportunity } from '@/types/api'

const TYPE_PATTERNS: Array<{ type: CareerJobType; pattern: RegExp }> = [
  { type: 'volunteer', pattern: /volunteer|봉사|봉사활동/i },
  { type: 'part-time', pattern: /part[- ]?time|아르바이트|시간제|파트/i },
  { type: 'full-time', pattern: /full[- ]?time|정규직|신입사원|채용/i },
  { type: 'internship', pattern: /intern|인턴|internship|실습/i },
]

/** Infer category chips from listing text when the API omits jobType. */
export function inferCareerJobType(opportunity: CareerOpportunity): CareerJobType {
  if (opportunity.jobType) return opportunity.jobType
  const haystack = [opportunity.title, opportunity.role, opportunity.applicationType]
    .filter(Boolean)
    .join(' ')
  for (const { type, pattern } of TYPE_PATTERNS) {
    if (pattern.test(haystack)) return type
  }
  return 'internship'
}

/** Convert JobKorea-style deadlines (~08/15) into D-n badges when possible. */
export function formatDeadlineBadge(deadline: string | null | undefined): string {
  if (!deadline) return '—'
  const trimmed = deadline.trim()
  if (/^D-?\d+/i.test(trimmed)) return trimmed.replace(/^d-/i, 'D-')

  const match = trimmed.match(/~?\s*(\d{1,2})\s*\/\s*(\d{1,2})/)
  if (!match) return trimmed

  const month = Number(match[1])
  const day = Number(match[2])
  const now = new Date()
  const target = new Date(now.getFullYear(), month - 1, day)
  target.setHours(0, 0, 0, 0)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (target < today) {
    target.setFullYear(target.getFullYear() + 1)
  }
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000)
  if (diff < 0) return 'Closed'
  return `D-${diff}`
}

export function companyInitials(company: string): string {
  const parts = company.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const LOGO_TONES = [
  'bg-[#1428A0] text-white',
  'bg-[#FEE500] text-[#191919]',
  'bg-[#A50034] text-white',
  'bg-[#002C5F] text-white',
  'bg-emerald-600 text-white',
  'bg-sky-600 text-white',
  'bg-violet-600 text-white',
  'bg-orange-500 text-white',
]

export function companyLogoTone(company: string): string {
  let hash = 0
  for (let i = 0; i < company.length; i += 1) {
    hash = (hash + company.charCodeAt(i) * (i + 1)) % LOGO_TONES.length
  }
  return LOGO_TONES[hash] ?? LOGO_TONES[0]
}

export function matchesCareerQuery(opportunity: CareerOpportunity, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [opportunity.title, opportunity.company, opportunity.role, opportunity.location]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q))
}

export function matchesCareerType(
  opportunity: CareerOpportunity,
  filter: CareerJobType | 'all',
): boolean {
  if (filter === 'all') return true
  return inferCareerJobType(opportunity) === filter
}

export function jobTypeLabelKey(type: CareerJobType): string {
  switch (type) {
    case 'internship':
      return 'career.filterInternship'
    case 'part-time':
      return 'career.filterPartTime'
    case 'full-time':
      return 'career.filterFullTime'
    case 'volunteer':
      return 'career.filterVolunteer'
  }
}
