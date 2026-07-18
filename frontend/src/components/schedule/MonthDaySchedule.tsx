import {
  BookOpen,
  Code2,
  Cpu,
  MapPin,
  Monitor,
  UserRound,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import type { ClassStatus, DayClassItem } from '@/utils/timetable'

interface MonthDayScheduleProps {
  date: Date
  classes: DayClassItem[]
  locale: string
  onViewFullSchedule: () => void
}

const DOT: Record<ClassStatus, string> = {
  completed: 'bg-[#34C759]',
  now: 'bg-pnu-blue',
  upcoming: 'bg-[#AF52DE]',
}

const PILL: Record<ClassStatus, string> = {
  completed: 'bg-[#E8F8ED] text-[#248A3D]',
  now: 'bg-[#E8F3FF] text-pnu-blue',
  upcoming: 'bg-[#EDE9FE] text-[#7C3AED]',
}

const ICONS = [
  { wrap: 'bg-[#E8F3FF] text-pnu-blue', Icon: Code2 },
  { wrap: 'bg-[#EDE9FE] text-[#7C3AED]', Icon: Cpu },
  { wrap: 'bg-[#E8F8ED] text-[#248A3D]', Icon: Monitor },
  { wrap: 'bg-[#FFF4E5] text-[#C2410C]', Icon: BookOpen },
] as const

export function MonthDaySchedule({
  date,
  classes,
  locale,
  onViewFullSchedule,
}: MonthDayScheduleProps) {
  const { t } = useLanguage()
  const heading = date.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <section className="rounded-t-[22px] bg-white px-4 pb-4 pt-4 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-bold text-pnu-text">{heading}</h3>
        <span className="text-[12px] font-medium text-pnu-muted">
          {t('schedule.classesCount', { count: classes.length })}
        </span>
      </div>

      {classes.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-pnu-muted">
          {t('schedule.emptyDay')}
        </p>
      ) : (
        <ul className="relative space-y-3 before:absolute before:bottom-3 before:left-[7px] before:top-3 before:w-px before:bg-black/10">
          {classes.map((item, index) => {
            const { enrollment, slot, status } = item
            const tone = ICONS[index % ICONS.length]
            const CourseIcon = tone.Icon
            const statusLabel =
              status === 'completed'
                ? t('schedule.statusCompleted')
                : status === 'now'
                  ? t('schedule.statusCurrent')
                  : t('schedule.statusUpcoming')

            return (
              <li
                key={`${enrollment.enrollment_id}-${slot.start}`}
                className="relative flex gap-3 pl-5"
              >
                <span
                  className={`absolute left-0 top-5 z-[1] h-2 w-2 rounded-full ring-2 ring-white ${DOT[status]}`}
                />
                <div className="w-[52px] shrink-0 pt-1 text-[10px] font-semibold leading-tight text-pnu-muted">
                  <p>{slot.start}</p>
                  <p>{slot.end}</p>
                </div>
                <div className="min-w-0 flex-1 rounded-[14px] bg-[#F8FAFC] p-3 ring-1 ring-black/5">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] ${tone.wrap}`}
                    >
                      <CourseIcon className="h-4 w-4" strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[13px] font-bold text-pnu-text">
                          {enrollment.course_name || t('schedule.untitledClass')}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${PILL[status]}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      {enrollment.category ? (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-pnu-muted">
                          <UserRound className="h-3 w-3" />
                          {enrollment.category}
                        </p>
                      ) : null}
                      {enrollment.classroom ? (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-pnu-muted">
                          <MapPin className="h-3 w-3" />
                          {enrollment.classroom}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onViewFullSchedule}
        className="mt-4 w-full rounded-[12px] border border-pnu-blue py-2.5 text-[13px] font-semibold text-pnu-blue transition active:scale-[0.99]"
      >
        {t('schedule.viewFullSchedule')}
      </button>
    </section>
  )
}
