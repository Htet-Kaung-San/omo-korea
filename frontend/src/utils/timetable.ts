import type { Enrollment } from '@/types/api'
import { getCourseSchedule, type ScheduledSlot } from '@/data/courseSchedules'

export interface TimeSlot {
  day: number // 1: Mon, ..., 5: Fri
  start: string // "09:00"
  end: string // "10:30"
}

export interface NextClassInfo {
  enrollment: Enrollment
  slot: ScheduledSlot
  startsInMinutes: number
  isToday: boolean
}

export type ClassStatus = 'completed' | 'now' | 'upcoming'

export interface DayClassItem {
  enrollment: Enrollment
  slot: ScheduledSlot
  status: ClassStatus
  startsInMinutes: number | null
}

export interface WeekDayOption {
  /** Timetable day 1 Mon … 5 Fri */
  day: number
  date: Date
  isToday: boolean
}

export interface DaySummary {
  classCount: number
  completedCount: number
  nextStartsInMinutes: number | null
}

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** JS getDay(): 0 Sun … 6 Sat → timetable day 1 Mon … 5 Fri (0 if weekend) */
export function toTimetableDay(jsDay: number): number {
  if (jsDay === 0 || jsDay === 6) return 0
  return jsDay
}

/** Monday of the week containing `ref` (local time). */
export function getWeekMonday(ref = new Date()): Date {
  const d = new Date(ref)
  d.setHours(0, 0, 0, 0)
  const jsDay = d.getDay()
  const offset = jsDay === 0 ? -6 : 1 - jsDay
  d.setDate(d.getDate() + offset)
  return d
}

/** Mon–Sun options for the week containing `ref`. */
export function getWeekdayOptions(ref = new Date()): WeekDayOption[] {
  const monday = getWeekMonday(ref)
  const todayKey = new Date(ref)
  todayKey.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + offset)
    const key = new Date(date)
    key.setHours(0, 0, 0, 0)
    return {
      day: toTimetableDay(date.getDay()),
      date,
      isToday: key.getTime() === todayKey.getTime(),
    }
  })
}

export interface MonthCell {
  date: Date
  inMonth: boolean
  dayOfMonth: number
}

/** Calendar cells for a month grid starting Monday (42 cells). */
export function getMonthGrid(year: number, month: number): MonthCell[] {
  const first = new Date(year, month, 1)
  const mondayOffset = (first.getDay() + 6) % 7 // Mon=0 … Sun=6
  const start = new Date(year, month, 1 - mondayOffset)
  const cells: MonthCell[] = []

  for (let i = 0; i < 42; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    date.setHours(0, 0, 0, 0)
    cells.push({
      date,
      inMonth: date.getMonth() === month,
      dayOfMonth: date.getDate(),
    })
  }

  return cells
}

/** Day-of-month numbers in this month that have at least one class. */
export function getClassDayNumbers(
  enrollments: Enrollment[],
  year: number,
  month: number,
): Set<number> {
  const days = new Set<number>()
  const last = new Date(year, month + 1, 0).getDate()

  for (let d = 1; d <= last; d++) {
    const date = new Date(year, month, d)
    const timetableDay = toTimetableDay(date.getDay())
    if (timetableDay === 0) continue
    if (getClassesForDay(enrollments, timetableDay, date).length > 0) {
      days.add(d)
    }
  }

  return days
}

export function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function getClassStatus(
  slot: ScheduledSlot,
  selectedDate: Date,
  now = new Date(),
): ClassStatus {
  if (!sameCalendarDay(selectedDate, now)) {
    // Past weekdays → treat as completed; future → upcoming
    const sel = new Date(selectedDate)
    sel.setHours(0, 0, 0, 0)
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    return sel.getTime() < today.getTime() ? 'completed' : 'upcoming'
  }

  const minutes = now.getHours() * 60 + now.getMinutes()
  const start = parseMinutes(slot.start)
  const end = parseMinutes(slot.end)
  if (minutes >= end) return 'completed'
  if (minutes >= start && minutes < end) return 'now'
  return 'upcoming'
}

/** Classes scheduled on a timetable day (1–5), sorted by start time. */
export function getClassesForDay(
  enrollments: Enrollment[],
  day: number,
  selectedDate: Date,
  now = new Date(),
): DayClassItem[] {
  const list: DayClassItem[] = []
  const isSelectedToday = sameCalendarDay(selectedDate, now)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  for (const enrollment of enrollments) {
    const slots = getCourseSchedule(enrollment.course_id)
    for (const slot of slots) {
      if (slot.day !== day) continue
      const status = getClassStatus(slot, selectedDate, now)
      const startMin = parseMinutes(slot.start)
      const startsInMinutes =
        isSelectedToday && status === 'upcoming' ? startMin - currentMinutes : null
      list.push({ enrollment, slot, status, startsInMinutes })
    }
  }

  return list.sort((a, b) => a.slot.start.localeCompare(b.slot.start))
}

export function getDaySummary(classes: DayClassItem[]): DaySummary {
  const next = classes.find((c) => c.status === 'upcoming' || c.status === 'now')
  return {
    classCount: classes.length,
    completedCount: classes.filter((c) => c.status === 'completed').length,
    nextStartsInMinutes:
      next?.status === 'now'
        ? 0
        : next?.startsInMinutes ?? null,
  }
}

/** Next upcoming/now class for a specific day list. */
export function getNextClassOnDay(classes: DayClassItem[]): DayClassItem | null {
  return classes.find((c) => c.status === 'upcoming' || c.status === 'now') ?? null
}

/**
 * Checks if two schedule slots overlap on the same day.
 */
export function slotsOverlap(s1: TimeSlot, s2: TimeSlot): boolean {
  if (s1.day !== s2.day) return false

  const t1start = parseMinutes(s1.start)
  const t1end = parseMinutes(s1.end)
  const t2start = parseMinutes(s2.start)
  const t2end = parseMinutes(s2.end)

  return t1start < t2end && t2start < t1end
}

/**
 * Find the next upcoming class from enrollments (today remaining, else soonest later this week).
 */
export function getNextClass(enrollments: Enrollment[], now = new Date()): NextClassInfo | null {
  if (enrollments.length === 0) return null

  const currentDay = toTimetableDay(now.getDay())
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  type Candidate = NextClassInfo & { sortKey: number }

  const candidates: Candidate[] = []

  for (const enrollment of enrollments) {
    const slots = getCourseSchedule(enrollment.course_id)
    for (const slot of slots) {
      let dayOffset: number
      if (currentDay === 0) {
        // Weekend → next Monday + day-1
        dayOffset = (1 - now.getDay() + 7) % 7 || 7
        dayOffset += slot.day - 1
      } else if (slot.day > currentDay) {
        dayOffset = slot.day - currentDay
      } else if (slot.day < currentDay) {
        dayOffset = 7 - (currentDay - slot.day)
      } else {
        // Same weekday
        const startMin = parseMinutes(slot.start)
        if (startMin <= currentMinutes) {
          dayOffset = 7
        } else {
          dayOffset = 0
        }
      }

      const startMin = parseMinutes(slot.start)
      const startsInMinutes = dayOffset * 24 * 60 + (startMin - currentMinutes)
      candidates.push({
        enrollment,
        slot,
        startsInMinutes,
        isToday: dayOffset === 0,
        sortKey: startsInMinutes,
      })
    }
  }

  if (candidates.length === 0) return null
  candidates.sort((a, b) => a.sortKey - b.sortKey)
  const best = candidates[0]
  return {
    enrollment: best.enrollment,
    slot: best.slot,
    startsInMinutes: best.startsInMinutes,
    isToday: best.isToday,
  }
}
