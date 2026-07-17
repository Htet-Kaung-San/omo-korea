import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  BookOpen,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  Megaphone,
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

const PREVIEW_COUNT = 2
const CARD_SHADOW = '0 12px 30px rgba(15,23,42,0.08)'

type EventTone = {
  icon: LucideIcon
  iconBox: string
}

type StatusChip = {
  labelKey: string
  className: string
  dot: string
}

function eventTone(titleKo: string, index: number): EventTone {
  const title = titleKo.toLowerCase()

  if (/장학|scholarship/.test(title)) {
    return { icon: Award, iconBox: 'bg-[#FEF9C3] text-[#CA8A04]' }
  }
  if (/수강|등록|신청|복학|휴학|registration|enroll/.test(title)) {
    return { icon: BookOpen, iconBox: 'bg-[#E0F2FE] text-[#0284C7]' }
  }
  if (/비자|체류|외국인|visa|immigration/.test(title)) {
    return { icon: Plane, iconBox: 'bg-[#DCFCE7] text-[#16A34A]' }
  }
  if (/졸업|학위|졸업식|graduation/.test(title)) {
    return { icon: GraduationCap, iconBox: 'bg-[#F3E8FF] text-[#7C3AED]' }
  }
  if (/공지|notice|안내|안내문/.test(title)) {
    return { icon: Megaphone, iconBox: 'bg-[#FFEDD5] text-[#EA580C]' }
  }

  const palette: EventTone[] = [
    { icon: CalendarDays, iconBox: 'bg-[#FEE2E2] text-[#EF4444]' },
    { icon: BookOpen, iconBox: 'bg-[#E0F2FE] text-[#0284C7]' },
    { icon: GraduationCap, iconBox: 'bg-[#F3E8FF] text-[#7C3AED]' },
  ]
  return palette[index % palette.length]
}

function statusChip(event: AcademicCalendarEvent, now = new Date()): StatusChip {
  const startMs = new Date(event.startAt).getTime()
  const endMs = new Date(event.endAt).getTime()
  const nowMs = now.getTime()
  const title = event.titleKo.toLowerCase()

  if (nowMs >= startMs && nowMs <= endMs) {
    return {
      labelKey: 'home.chipOngoing',
      className: 'bg-red-50 text-red-600',
      dot: 'bg-red-500',
    }
  }

  if (/수강|등록|신청|복학|휴학|registration|enroll/.test(title)) {
    return {
      labelKey: 'home.chipRegistration',
      className: 'bg-emerald-50 text-emerald-700',
      dot: 'bg-emerald-500',
    }
  }

  if (
    /마감|deadline|장학|scholarship|제출|due/.test(title) ||
    endMs - startMs < 1000 * 60 * 60 * 36
  ) {
    return {
      labelKey: 'home.chipDeadline',
      className: 'bg-orange-50 text-orange-700',
      dot: 'bg-orange-500',
    }
  }

  return {
    labelKey: 'home.chipUpcoming',
    className: 'bg-sky-50 text-sky-700',
    dot: 'bg-sky-500',
  }
}

function formatShortDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })
}

export function AcademicCalendarSection() {
  const { language, locale, t } = useLanguage()

  const events = useMemo(() => getUpcomingAcademicEvents(), [])
  const visibleEvents = events.slice(0, PREVIEW_COUNT)

  return (
    <section className="shrink-0">
      <div
        className="rounded-[20px] bg-white p-3.5"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold tracking-tight text-pnu-text">
            {t('home.academicCalendar')}
          </h2>
          <Link
            to="/academic-calendar"
            className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-pnu-blue transition duration-200 active:scale-[0.98]"
          >
            {t('common.viewAll')}
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.2} />
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="mt-3 text-[12px] font-medium text-pnu-muted">
            {t('home.academicCalendarEmpty')}
          </p>
        ) : (
          <div className="mt-3 flex flex-col sm:flex-row sm:items-stretch">
            {visibleEvents.map((event, index) => {
              const tone = eventTone(event.titleKo, index)
              const Icon = tone.icon
              const chip = statusChip(event)
              const title = translateCalendarTitle(
                formatCalendarTitleKo(event.titleKo),
                language,
              )

              return (
                <Link
                  key={event.id}
                  to="/academic-calendar"
                  className={[
                    'group flex min-w-0 flex-1 items-start gap-2.5 transition duration-200 active:scale-[0.98]',
                    index > 0
                      ? 'mt-2.5 border-t border-black/8 pt-2.5 sm:mt-0 sm:border-t-0 sm:border-l sm:pl-2.5 sm:pt-0'
                      : 'sm:pr-2.5',
                  ].join(' ')}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${tone.iconBox}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.9} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${chip.className}`}
                    >
                      <span className={`h-1 w-1 rounded-full ${chip.dot}`} />
                      {t(chip.labelKey)}
                    </span>

                    <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-pnu-text">
                      {title}
                    </p>

                    <p className="mt-0.5 text-[11px] font-medium text-pnu-muted">
                      {formatShortDate(event.startAt, locale)}
                    </p>
                  </div>

                  <ChevronRight
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pnu-muted opacity-40"
                    strokeWidth={2}
                  />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
