import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { sameCalendarDay, type WeekDayOption } from '@/utils/timetable'

const CARD_SHADOW = '0 10px 28px rgba(15,23,42,0.06)'

interface DateStripProps {
  days: WeekDayOption[]
  selectedDate: Date
  locale: string
  monthView: boolean
  onSelectDate: (date: Date) => void
  onShiftWeek: (delta: number) => void
  onToggleMonthView: () => void
}

export function DateStrip({
  days,
  selectedDate,
  locale,
  monthView,
  onSelectDate,
  onShiftWeek,
  onToggleMonthView,
}: DateStripProps) {
  const { t } = useLanguage()
  const first = days[0]?.date
  const last = days[days.length - 1]?.date

  const rangeLabel =
    first && last
      ? t('schedule.weekRange', {
          start: first.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
          end: last.toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        })
      : ''

  return (
    <section
      className="rounded-[20px] bg-white px-3 py-3 ring-1 ring-black/5"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onShiftWeek(-1)}
          className="rounded-lg p-1.5 text-pnu-muted transition hover:bg-black/5 hover:text-pnu-text"
          aria-label={t('schedule.prevWeek')}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
        </button>

        <p className="min-w-0 flex-1 truncate text-center text-[13px] font-bold tracking-tight text-pnu-text">
          {rangeLabel}
        </p>

        <button
          type="button"
          onClick={onToggleMonthView}
          className={[
            'inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition',
            monthView
              ? 'bg-pnu-blue/10 text-pnu-blue'
              : 'text-pnu-blue hover:bg-pnu-blue/8',
          ].join(' ')}
          aria-pressed={monthView}
        >
          <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
          {monthView ? t('schedule.viewWeekly') : t('schedule.viewMonthly')}
        </button>

        <button
          type="button"
          onClick={() => onShiftWeek(1)}
          className="rounded-lg p-1.5 text-pnu-muted transition hover:bg-black/5 hover:text-pnu-text"
          aria-label={t('schedule.nextWeek')}
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      {!monthView ? (
        <div className="mt-2.5 flex items-stretch overflow-hidden rounded-[12px] ring-1 ring-black/6">
          {days.map(({ date }, index) => {
            const active = sameCalendarDay(date, selectedDate)
            const weekday = date.toLocaleDateString(locale, { weekday: 'short' })
            const month = date.toLocaleDateString(locale, { month: 'short' })
            const dayNum = date.getDate()

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => onSelectDate(date)}
                className={[
                  'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-2 transition',
                  index > 0 ? 'border-l border-black/6' : '',
                  active
                    ? 'bg-[#E8F3FF] text-pnu-blue'
                    : 'bg-white text-pnu-muted hover:bg-black/[0.02]',
                ].join(' ')}
              >
                <span
                  className={[
                    'text-[10px] font-semibold leading-none',
                    active ? 'text-pnu-blue' : 'text-pnu-muted',
                  ].join(' ')}
                >
                  {weekday}
                </span>
                <span
                  className={[
                    'text-[10px] font-bold leading-none',
                    active ? 'text-pnu-blue' : 'text-pnu-muted',
                  ].join(' ')}
                >
                  {month} {dayNum}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
