import { AlertTriangle, MapPin } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import type { ScheduleItem, ScheduledSlot } from '@/utils/timetable'
import { getScheduleSlots } from '@/utils/timetable'

const HOUR_HEIGHT = 56
const DEFAULT_START_HOUR = 8
const DEFAULT_END_HOUR = 20
const COURSE_COLORS = [
  '#DDE8F8',
  '#F8E3E3',
  '#DFF0E8',
  '#FFF6CC',
  '#ECE5FA',
  '#E0F2FE',
] as const

interface Props {
  entries: ScheduleItem[]
  locale: string
}

interface GridEntry {
  item: ScheduleItem
  slot: ScheduledSlot
  startMinutes: number
  endMinutes: number
  lane: number
  laneCount: number
  hasConflict: boolean
}

function minutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function entryTitle(item: ScheduleItem) {
  return item.course_name || ('courseNameEn' in item ? item.courseNameEn : null) || 'Untitled class'
}

function entryProfessor(item: ScheduleItem) {
  return item.professor || null
}

function entryColor(item: ScheduleItem, index: number) {
  if ('color' in item && /^#[0-9a-f]{6}$/i.test(item.color || '')) return item.color as string
  return COURSE_COLORS[index % COURSE_COLORS.length]
}

function layoutDay(entries: Omit<GridEntry, 'lane' | 'laneCount' | 'hasConflict'>[]): GridEntry[] {
  const sorted = [...entries].sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes)
  const laneEnds: number[] = []
  const provisional = sorted.map((entry) => {
    let lane = laneEnds.findIndex((end) => end <= entry.startMinutes)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = entry.endMinutes
    return { ...entry, lane }
  })
  const laneCount = Math.max(1, laneEnds.length)

  return provisional.map((entry, index) => ({
    ...entry,
    laneCount,
    hasConflict: provisional.some((candidate, candidateIndex) => (
      candidateIndex !== index
      && entry.startMinutes < candidate.endMinutes
      && candidate.startMinutes < entry.endMinutes
    )),
  }))
}

export function WeeklyTimetableGrid({ entries, locale }: Props) {
  const { t } = useLanguage()
  const days = Array.from({ length: 7 }, (_, index) => ({
    number: index + 1,
    label: new Date(2024, 0, index + 1).toLocaleDateString(locale, { weekday: 'long' }),
  }))

  const rawEntries = entries.flatMap((item) => getScheduleSlots(item).map((slot) => ({
    item,
    slot,
    startMinutes: minutes(slot.start),
    endMinutes: minutes(slot.end),
  }))).filter((entry) => entry.slot.day >= 1 && entry.slot.day <= 7 && entry.endMinutes > entry.startMinutes)

  const startHour = rawEntries.length
    ? Math.max(0, Math.min(DEFAULT_START_HOUR, ...rawEntries.map((entry) => Math.floor(entry.startMinutes / 60))))
    : DEFAULT_START_HOUR
  const endHour = rawEntries.length
    ? Math.min(24, Math.max(DEFAULT_END_HOUR, ...rawEntries.map((entry) => Math.ceil(entry.endMinutes / 60))))
    : DEFAULT_END_HOUR
  const gridHeight = (endHour - startHour) * HOUR_HEIGHT
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index)
  const byDay = days.map((_, dayIndex) => layoutDay(
    rawEntries.filter((entry) => entry.slot.day === dayIndex + 1),
  ))

  return (
    <section className="overflow-hidden rounded-[20px] bg-white ring-1 ring-black/5">
      <div className="no-scrollbar overflow-x-auto">
        <div className="min-w-[890px]">
          <div className="grid grid-cols-[48px_repeat(7,minmax(118px,1fr))] border-b border-black/8 bg-[#FAFBFD]">
            <div />
            {days.map((day) => (
              <div key={day.number} className="border-l border-black/8 px-1 py-3 text-center">
                <p className="text-[10px] font-bold text-pnu-text">{day.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[48px_repeat(7,minmax(118px,1fr))]">
            <div className="relative bg-[#FAFBFD]" style={{ height: gridHeight }}>
              {hours.slice(0, -1).map((hour) => (
                <span key={hour} className="absolute right-2 -translate-y-1/2 text-[9px] font-medium text-pnu-muted" style={{ top: (hour - startHour) * HOUR_HEIGHT }}>
                  {String(hour).padStart(2, '0')}:00
                </span>
              ))}
            </div>

            {byDay.map((dayEntries, dayIndex) => (
              <div key={dayIndex} className="relative border-l border-black/8" style={{ height: gridHeight }}>
                {hours.map((hour) => (
                  <span key={hour} className="pointer-events-none absolute inset-x-0 border-t border-black/7" style={{ top: (hour - startHour) * HOUR_HEIGHT }} />
                ))}
                {dayEntries.map((entry, index) => {
                  const top = ((entry.startMinutes - startHour * 60) / 60) * HOUR_HEIGHT
                  const height = Math.max(30, ((entry.endMinutes - entry.startMinutes) / 60) * HOUR_HEIGHT)
                  const width = 100 / entry.laneCount
                  const classroom = entry.slot.classroom || entry.item.classroom
                  return (
                    <article
                      key={`${entry.item.enrollment_id}-${entry.slot.start}-${index}`}
                      className={`absolute overflow-hidden rounded-md border px-1.5 py-1 text-[9px] leading-tight shadow-sm ${entry.hasConflict ? 'border-rose-400' : 'border-white/80'}`}
                      style={{
                        top: top + 1,
                        height: height - 2,
                        left: `calc(${entry.lane * width}% + 2px)`,
                        width: `calc(${width}% - 4px)`,
                        backgroundColor: entryColor(entry.item, Number(entry.item.course_id) || index),
                      }}
                      title={`${entryTitle(entry.item)} · ${entry.slot.start}–${entry.slot.end}`}
                    >
                      <div className="flex items-start gap-1">
                        <p className="min-w-0 flex-1 font-bold text-slate-800">{entryTitle(entry.item)}</p>
                        {entry.hasConflict ? <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-rose-600" aria-label={t('schedule.conflict')} /> : null}
                      </div>
                      <p className="mt-0.5 text-slate-600">{entry.slot.start}–{entry.slot.end}</p>
                      {entryProfessor(entry.item) ? <p className="mt-0.5 truncate text-slate-600">{entryProfessor(entry.item)}</p> : null}
                      {classroom ? <p className="mt-0.5 flex items-center gap-0.5 truncate text-slate-600"><MapPin className="h-2.5 w-2.5 shrink-0" />{classroom}</p> : null}
                    </article>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      {rawEntries.length === 0 ? <p className="border-t border-black/6 px-4 py-4 text-center text-xs text-pnu-muted">{t('schedule.weeklyEmpty')}</p> : null}
    </section>
  )
}
