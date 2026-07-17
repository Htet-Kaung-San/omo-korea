import { Link } from 'react-router-dom'
import { ChevronRight, Clock, MapPin } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import type { NextClassInfo } from '@/utils/timetable'

interface NextClassCardProps {
  nextClass: NextClassInfo | null
  locale: string
}

function formatStartsIn(minutes: number, t: (key: string, vars?: Record<string, string | number>) => string): string {
  if (minutes < 0) return t('home.nextClassNow')
  if (minutes < 60) return t('home.nextClassStartsInMin', { count: minutes })
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  if (hours < 24) {
    return rem > 0
      ? t('home.nextClassStartsInHoursMin', { hours, minutes: rem })
      : t('home.nextClassStartsInHours', { count: hours })
  }
  const days = Math.floor(hours / 24)
  return t('home.nextClassStartsInDays', { count: days })
}

export function NextClassCard({ nextClass, locale }: NextClassCardProps) {
  const { t } = useLanguage()
  const todayLabel = new Date().toLocaleDateString(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[17px] font-semibold tracking-tight text-pnu-text">{t('home.nextClass')}</h2>
        <Link
          to="/schedule"
          className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-pnu-blue"
        >
          {t('home.viewFullSchedule')}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {nextClass ? (
        <div className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-[12px] font-medium text-pnu-muted">
              {nextClass.isToday ? t('home.nextClassToday', { date: todayLabel }) : todayLabel}
            </p>
            {nextClass.isToday ? (
              <span className="shrink-0 rounded-full bg-[#E8F8ED] px-2.5 py-1 text-[11px] font-bold text-[#248A3D]">
                {formatStartsIn(nextClass.startsInMinutes, t)}
              </span>
            ) : null}
          </div>
          <p className="text-[17px] font-semibold tracking-tight text-pnu-text">
            {nextClass.enrollment.course_name || t('home.nextClassUntitled')}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] font-medium text-pnu-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-pnu-blue" />
              {nextClass.slot.dayLabel} {nextClass.slot.start} – {nextClass.slot.end}
            </span>
            {nextClass.enrollment.classroom ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-pnu-blue" />
                {nextClass.enrollment.classroom}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rounded-[20px] bg-white p-4 text-sm text-pnu-muted shadow-sm ring-1 ring-black/5">
          <p>{t('home.nextClassEmpty')}</p>
          <Link
            to="/schedule"
            className="mt-2 inline-flex items-center gap-0.5 text-[13px] font-semibold text-pnu-blue"
          >
            {t('home.nextClassAddCta')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  )
}
