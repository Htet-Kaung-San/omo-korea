import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { getMonthGrid, sameCalendarDay, type MonthCell } from '@/utils/timetable'

interface MonthCalendarProps {
  year: number
  month: number
  selectedDate: Date
  classDays: Set<number>
  onSelectDate: (date: Date) => void
  onShiftMonth: (delta: number) => void
}

export function MonthCalendar({
  year,
  month,
  selectedDate,
  classDays,
  onSelectDate,
  onShiftMonth,
}: MonthCalendarProps) {
  const { locale, t } = useLanguage()
  const cells = getMonthGrid(year, month)
  const monthLabel = new Date(year, month, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })

  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    // Monday-start labels
    const d = new Date(2024, 0, 1 + i) // Mon Jan 1 2024
    return d.toLocaleDateString(locale, { weekday: 'short' })
  })

  return (
    <section className="rounded-[18px] bg-white px-3 py-3 shadow-sm ring-1 ring-black/5">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[16px] font-bold tracking-tight text-pnu-text">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onShiftMonth(-1)}
            className="rounded-full p-1.5 text-pnu-blue transition hover:bg-pnu-blue/10"
            aria-label={t('schedule.prevMonth')}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={() => onShiftMonth(1)}
            className="rounded-full p-1.5 text-pnu-blue transition hover:bg-pnu-blue/10"
            aria-label={t('schedule.nextMonth')}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div className="mb-1.5 grid grid-cols-7">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[10px] font-semibold text-pnu-muted"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell) => (
          <MonthDayButton
            key={cell.date.toISOString()}
            cell={cell}
            selected={sameCalendarDay(cell.date, selectedDate)}
            hasClass={cell.inMonth && classDays.has(cell.dayOfMonth)}
            onSelect={() => onSelectDate(cell.date)}
          />
        ))}
      </div>
    </section>
  )
}

function MonthDayButton({
  cell,
  selected,
  hasClass,
  onSelect,
}: {
  cell: MonthCell
  selected: boolean
  hasClass: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col items-center justify-center py-0.5"
    >
      <span
        className={[
          'flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold transition',
          selected
            ? 'bg-pnu-blue text-white shadow-sm'
            : cell.inMonth
              ? 'text-pnu-text'
              : 'text-pnu-muted/40',
        ].join(' ')}
      >
        {cell.dayOfMonth}
      </span>
      <span
        className={[
          'mt-0.5 h-1 w-1 rounded-full',
          hasClass && !selected ? 'bg-pnu-blue' : 'bg-transparent',
        ].join(' ')}
        aria-hidden
      />
    </button>
  )
}
