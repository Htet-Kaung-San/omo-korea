import type { TimeSlot } from '@/utils/timetable'

const DAY_LABELS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

export interface ScheduledSlot extends TimeSlot {
  dayLabel: string
}

/** Consistent mock schedules assigned to course IDs for timetable mapping */
export const COURSE_SCHEDULES: Record<number, ScheduledSlot[]> = {
  1: [
    { day: 1, dayLabel: 'Mon', start: '09:00', end: '10:30' },
    { day: 3, dayLabel: 'Wed', start: '09:00', end: '10:30' },
  ],
  2: [
    { day: 1, dayLabel: 'Mon', start: '10:30', end: '12:00' },
    { day: 3, dayLabel: 'Wed', start: '10:30', end: '12:00' },
  ],
  3: [
    { day: 2, dayLabel: 'Tue', start: '09:00', end: '10:30' },
    { day: 4, dayLabel: 'Thu', start: '09:00', end: '10:30' },
  ],
  4: [
    { day: 2, dayLabel: 'Tue', start: '10:30', end: '12:00' },
    { day: 4, dayLabel: 'Thu', start: '10:30', end: '12:00' },
  ],
  5: [
    { day: 1, dayLabel: 'Mon', start: '13:00', end: '14:30' },
    { day: 3, dayLabel: 'Wed', start: '13:00', end: '14:30' },
  ],
  6: [
    { day: 2, dayLabel: 'Tue', start: '13:00', end: '14:30' },
    { day: 4, dayLabel: 'Thu', start: '13:00', end: '14:30' },
  ],
  7: [
    { day: 1, dayLabel: 'Mon', start: '14:30', end: '16:00' },
    { day: 3, dayLabel: 'Wed', start: '14:30', end: '16:00' },
  ],
  8: [
    { day: 2, dayLabel: 'Tue', start: '14:30', end: '16:00' },
    { day: 4, dayLabel: 'Thu', start: '14:30', end: '16:00' },
  ],
  9: [{ day: 5, dayLabel: 'Fri', start: '09:00', end: '12:00' }],
  10: [{ day: 5, dayLabel: 'Fri', start: '13:00', end: '16:00' }],
  11: [{ day: 3, dayLabel: 'Wed', start: '16:00', end: '17:30' }],
  12: [{ day: 4, dayLabel: 'Thu', start: '16:00', end: '17:30' }],
}

/** Normalize course ids like `c2` / `"2"` / `2` → schedule key */
export function normalizeCourseId(courseId: string | number): number {
  if (typeof courseId === 'number' && Number.isFinite(courseId)) return courseId
  const digits = String(courseId).replace(/\D/g, '')
  return digits ? Number(digits) : NaN
}

export function getCourseSchedule(courseId: string | number): ScheduledSlot[] {
  const id = normalizeCourseId(courseId)
  return Number.isFinite(id) ? (COURSE_SCHEDULES[id] ?? []) : []
}

export function dayLabel(day: number): string {
  return DAY_LABELS[day] ?? ''
}
