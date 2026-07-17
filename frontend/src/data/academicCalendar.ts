import rawEvents from './academicCalendar.events.json'

export type AcademicSemester = 1 | 2

export interface AcademicCalendarEvent {
  id: string
  year: number
  semester: AcademicSemester
  startAt: string
  endAt: string
  /** Official Korean title from PNU OneStop / CMS 학사일정 */
  titleKo: string
}

/** Full PNU academic calendar (CMS rolling list + 1학기 seed from official notice). */
export const ACADEMIC_CALENDAR_EVENTS: AcademicCalendarEvent[] =
  rawEvents as AcademicCalendarEvent[]

export function getAcademicCalendarYears(
  events: AcademicCalendarEvent[] = ACADEMIC_CALENDAR_EVENTS,
): number[] {
  return [...new Set(events.map((event) => event.year))].sort((a, b) => b - a)
}

export function filterAcademicCalendarEvents(
  year: number,
  semester: AcademicSemester,
  events: AcademicCalendarEvent[] = ACADEMIC_CALENDAR_EVENTS,
): AcademicCalendarEvent[] {
  return events
    .filter((event) => event.year === year && event.semester === semester)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
}

/** Upcoming / ongoing events across all terms, soonest first. */
export function getUpcomingAcademicEvents(
  now = new Date(),
  events: AcademicCalendarEvent[] = ACADEMIC_CALENDAR_EVENTS,
): AcademicCalendarEvent[] {
  const nowMs = now.getTime()
  return events
    .filter((event) => new Date(event.endAt).getTime() >= nowMs)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
}

export function getDefaultAcademicTerm(now = new Date()): {
  year: number
  semester: AcademicSemester
} {
  const years = getAcademicCalendarYears()
  const year = years[0] ?? now.getFullYear()
  const month = now.getMonth() + 1
  const semester: AcademicSemester = month >= 3 && month <= 8 ? 1 : 2
  const hasTerm = ACADEMIC_CALENDAR_EVENTS.some(
    (event) => event.year === year && event.semester === semester,
  )
  if (hasTerm) return { year, semester }
  return { year, semester: 1 }
}

/** Strip leading academic-year prefix for cleaner UI. */
export function formatCalendarTitleKo(titleKo: string): string {
  return titleKo
    .replace(/^20\d{2}\s*학년도\s*/, '')
    .replace(/^20\d{2}\s*년도\s*/, '')
    .trim()
}
