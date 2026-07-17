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

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** JS getDay(): 0 Sun … 6 Sat → timetable day 1 Mon … 5 Fri (0 if weekend) */
function toTimetableDay(jsDay: number): number {
  if (jsDay === 0 || jsDay === 6) return 0
  return jsDay
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
      let dayOffset = 0
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
