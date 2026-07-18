import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import {
  filterAcademicCalendarEvents,
  formatCalendarTitleKo,
  getAcademicCalendarYears,
  getDefaultAcademicTerm,
  type AcademicSemester,
} from '@/data/academicCalendar'
import { translateCalendarTitle } from '@/i18n/calendar/titleTranslate'

function formatRange(startIso: string, endIso: string, locale: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()

  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
  if (sameDay) return start.toLocaleDateString(locale, opts)
  return `${start.toLocaleDateString(locale, opts)} – ${end.toLocaleDateString(locale, opts)}`
}

export function AcademicCalendarPage() {
  const { language, locale, t } = useLanguage()
  const years = useMemo(() => getAcademicCalendarYears(), [])
  const defaults = useMemo(() => getDefaultAcademicTerm(), [])
  const [year, setYear] = useState(defaults.year)
  const [semester, setSemester] = useState<AcademicSemester>(defaults.semester)

  const events = useMemo(
    () => filterAcademicCalendarEvents(year, semester),
    [year, semester],
  )

  return (
    <div>
      <PageHeader title={t('home.academicCalendar')} back />

      <div className="space-y-3 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-[14px] bg-white px-3 py-2 shadow-sm ring-1 ring-black/5">
            <span className="shrink-0 text-[11px] font-semibold text-pnu-muted">
              {t('home.academicCalendarYear')}
            </span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-pnu-text outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <div className="flex shrink-0 gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-black/5">
            {([1, 2] as AcademicSemester[]).map((s) => {
              const active = semester === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSemester(s)}
                  className={[
                    'rounded-full px-3 py-1.5 text-[11px] font-semibold transition',
                    active ? 'bg-pnu-blue text-white' : 'text-pnu-muted',
                  ].join(' ')}
                >
                  {t(
                    s === 1
                      ? 'home.academicCalendarSemester1'
                      : 'home.academicCalendarSemester2',
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <p className="px-0.5 text-[12px] font-medium text-pnu-muted">
          {t('home.academicCalendarTotal', { count: events.length })}
        </p>

        {events.length === 0 ? (
          <p className="rounded-[16px] bg-white px-4 py-8 text-center text-[13px] text-pnu-muted shadow-sm ring-1 ring-black/5">
            {t('home.academicCalendarEmpty')}
          </p>
        ) : (
          <ul className="overflow-hidden rounded-[16px] bg-white shadow-sm ring-1 ring-black/5">
            {events.map((event) => {
              const title = translateCalendarTitle(
                formatCalendarTitleKo(event.titleKo),
                language,
              )
              return (
                <li
                  key={event.id}
                  className="flex items-start gap-3 border-b border-black/5 px-3 py-3 last:border-b-0"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-pnu-blue/10 text-pnu-blue">
                    <CalendarDays className="h-4 w-4" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold leading-snug text-pnu-text">
                      {title}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-pnu-muted">
                      {formatRange(event.startAt, event.endAt, locale)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
