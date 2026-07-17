import { useMemo, useState } from 'react'
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  Plane,
  type LucideIcon,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import {
  formatCalendarTitleKo,
  getUpcomingAcademicEvents,
  type AcademicCalendarEvent,
} from '@/data/academicCalendar'
import { translateCalendarTitle } from '@/i18n/calendar/titleTranslate'

const PREVIEW_COUNT = 3

type EventTone = {
  icon: LucideIcon
  iconBox: string
  accent: string
}

function eventTone(titleKo: string, index: number): EventTone {
  const title = titleKo.toLowerCase()
  if (/장학|scholarship/.test(title)) {
    return {
      icon: CalendarDays,
      iconBox: 'bg-rose-50 text-rose-500',
      accent: 'text-rose-500',
    }
  }
  if (/수강|등록|신청|복학|휴학|registration|enroll/.test(title)) {
    return {
      icon: BookOpen,
      iconBox: 'bg-sky-50 text-sky-600',
      accent: 'text-sky-600',
    }
  }
  if (/비자|체류|외국인|visa|immigration/.test(title)) {
    return {
      icon: Plane,
      iconBox: 'bg-emerald-50 text-emerald-600',
      accent: 'text-emerald-600',
    }
  }
  if (/졸업|학위|졸업식|graduation/.test(title)) {
    return {
      icon: GraduationCap,
      iconBox: 'bg-indigo-50 text-indigo-600',
      accent: 'text-indigo-600',
    }
  }
  const palette: EventTone[] = [
    { icon: CalendarDays, iconBox: 'bg-rose-50 text-rose-500', accent: 'text-rose-500' },
    { icon: BookOpen, iconBox: 'bg-sky-50 text-sky-600', accent: 'text-sky-600' },
    { icon: Plane, iconBox: 'bg-emerald-50 text-emerald-600', accent: 'text-emerald-600' },
  ]
  return palette[index % palette.length]
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function daysUntil(targetIso: string, now = new Date()): number {
  const target = startOfDay(new Date(targetIso))
  const today = startOfDay(now)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatShortDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function statusLabel(
  event: AcademicCalendarEvent,
  t: (key: string, vars?: Record<string, string | number>) => string,
  locale: string,
  now = new Date(),
): string {
  const startMs = new Date(event.startAt).getTime()
  const endMs = new Date(event.endAt).getTime()
  const nowMs = now.getTime()

  if (nowMs >= startMs && nowMs <= endMs) {
    return t('home.happeningNow')
  }

  const days = daysUntil(event.startAt, now)
  if (days <= 0) return t('home.dueToday')
  if (days <= 30) return t('home.daysLeft', { count: days })
  return formatShortDate(event.startAt, locale)
}

export function AcademicCalendarSection() {
  const { language, locale, t } = useLanguage()
  const [expanded, setExpanded] = useState(false)

  const events = useMemo(() => getUpcomingAcademicEvents(), [])
  const visibleEvents = expanded ? events : events.slice(0, PREVIEW_COUNT)
  const canToggle = events.length > PREVIEW_COUNT

  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[17px] font-semibold tracking-tight text-pnu-text">{t('home.upcoming')}</h2>
        {canToggle ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="text-[13px] font-semibold text-pnu-blue"
          >
            {expanded ? t('common.viewLess') : t('common.viewAll')}
          </button>
        ) : null}
      </div>

      <div className="rounded-[20px] bg-white px-2 shadow-sm ring-1 ring-black/5">
        {events.length === 0 ? (
          <p className="px-3 py-5 text-sm text-pnu-muted">{t('home.academicCalendarEmpty')}</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {visibleEvents.map((event, index) => {
              const tone = eventTone(event.titleKo, index)
              const Icon = tone.icon
              const title = translateCalendarTitle(
                formatCalendarTitleKo(event.titleKo),
                language,
              )
              return (
                <li key={event.id}>
                  <div className="flex items-center gap-3 px-2 py-3.5">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${tone.iconBox}`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-pnu-text">{title}</p>
                      <p className={`mt-0.5 text-[12px] font-semibold ${tone.accent}`}>
                        {statusLabel(event, t, locale)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-pnu-muted">
                      <span className="text-[11px] font-medium">
                        {formatShortDate(event.startAt, locale)}
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-40" />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
