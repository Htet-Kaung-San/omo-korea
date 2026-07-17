import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { CampusFacility } from '@/types/api'
import { findGeumjeongStudentCafeteria } from '@/utils/cafeteria'

interface CafeteriaMenuViewProps {
  cafeterias: CampusFacility[]
  loading?: boolean
  onWeekChange: (menuDate: string) => void
}

function formatWeekLabel(menu: CampusFacility['menu']) {
  if (menu?.week_label) return menu.week_label
  if (menu?.week_start && menu?.week_end) return `${menu.week_start} ~ ${menu.week_end}`
  return null
}

function defaultCafeteriaId(cafeterias: CampusFacility[], hallsWithMenus: CampusFacility[]) {
  const preferred =
    findGeumjeongStudentCafeteria(hallsWithMenus) ?? findGeumjeongStudentCafeteria(cafeterias)
  return preferred?.id ?? hallsWithMenus[0]?.id ?? cafeterias[0]?.id ?? ''
}

export function CafeteriaMenuView({ cafeterias, loading = false, onWeekChange }: CafeteriaMenuViewProps) {
  const { t } = useLanguage()
  const hallsWithMenus = useMemo(
    () => cafeterias.filter((hall) => hall.menu && hall.menu.rows.length > 0),
    [cafeterias],
  )
  const hallOptions = hallsWithMenus.length > 0 ? hallsWithMenus : cafeterias
  const [activeId, setActiveId] = useState(() => defaultCafeteriaId(cafeterias, hallsWithMenus))

  useEffect(() => {
    if (cafeterias.length === 0) return
    const stillValid = hallOptions.some((hall) => hall.id === activeId)
    if (!activeId || !stillValid) {
      setActiveId(defaultCafeteriaId(cafeterias, hallsWithMenus))
    }
  }, [activeId, cafeterias, hallOptions, hallsWithMenus])

  const activeHall =
    hallOptions.find((hall) => hall.id === activeId) ??
    findGeumjeongStudentCafeteria(hallOptions) ??
    hallOptions[0]
  const menu = activeHall?.menu
  const dayColumns = menu?.rows[0]?.columns ?? []
  const weekLabel = formatWeekLabel(menu)

  if (!activeHall) {
    return <p className="text-sm text-pnu-muted">{t('campusLife.noMenuData')}</p>
  }

  return (
    <div className="space-y-4">
      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-pnu-muted">
          {t('campusLife.selectLocation')}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {hallOptions.map((hall) => {
            const isActive = hall.id === activeHall.id
            return (
              <button
                key={hall.id}
                type="button"
                onClick={() => setActiveId(hall.id)}
                className={`rounded-full border px-2 py-2.5 text-center text-[10px] font-bold leading-tight transition ${
                  isActive
                    ? 'border-pnu-blue bg-pnu-blue text-white'
                    : 'border-pnu-border bg-white text-pnu-text hover:border-pnu-blue-light/50'
                }`}
              >
                {hall.name}
              </button>
            )
          })}
        </div>
      </section>

      {weekLabel ? (
        <section className="rounded-2xl border border-pnu-border bg-white px-3 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={loading || !menu?.prev_menu_date}
              onClick={() => menu?.prev_menu_date && onWeekChange(menu.prev_menu_date)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-pnu-border text-pnu-text transition hover:border-pnu-blue disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t('campusLife.prevWeek')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-sm font-bold text-pnu-blue">{weekLabel}</p>
              <p className="mt-1 truncate text-sm font-semibold text-pnu-text">{activeHall.name}</p>
            </div>
            <button
              type="button"
              disabled={loading || !menu?.next_menu_date}
              onClick={() => menu?.next_menu_date && onWeekChange(menu.next_menu_date)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-pnu-border text-pnu-text transition hover:border-pnu-blue disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t('campusLife.nextWeek')}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : null}

      {menu && dayColumns.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-pnu-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-pnu-border bg-slate-50">
                  <th className="sticky left-0 z-10 min-w-[88px] border-r border-pnu-border bg-slate-50 px-3 py-3 text-left font-bold text-pnu-text">
                    {t('campusLife.mealDivision')}
                  </th>
                  {dayColumns.map((column) => (
                    <th
                      key={column.day}
                      className="min-w-[120px] border-r border-pnu-border px-2 py-3 text-center font-bold text-pnu-text last:border-r-0"
                    >
                      <div>{column.day_label.split(' ')[0]}</div>
                      <div className="mt-1 text-[11px] font-normal text-pnu-muted">
                        {column.day_label.split(' ').slice(1).join(' ')}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {menu.rows.map((row) => (
                  <tr key={row.meal_type} className="border-b border-pnu-border last:border-b-0">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-r border-pnu-border bg-white px-3 py-3 text-left align-top font-bold text-pnu-text"
                    >
                      {row.meal_label.split('\n').map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </th>
                    {row.columns.map((column) => (
                      <td
                        key={`${row.meal_type}-${column.day}`}
                        className="border-r border-pnu-border px-2 py-3 align-top text-pnu-text last:border-r-0"
                      >
                        {column.note ? (
                          <p className="text-center text-pnu-muted">{column.note}</p>
                        ) : column.price || column.items.length > 0 ? (
                          <div className="space-y-1">
                            {column.price ? (
                              <p className="font-bold text-pnu-blue">{column.price}</p>
                            ) : null}
                            {column.items.map((item) => (
                              <p key={item} className="leading-snug text-pnu-muted">
                                {item}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-pnu-muted">-</p>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <p className="rounded-2xl border border-dashed border-pnu-border bg-white p-4 text-sm text-pnu-muted">
          {t('campusLife.noMenuDetails')}
        </p>
      )}
    </div>
  )
}
