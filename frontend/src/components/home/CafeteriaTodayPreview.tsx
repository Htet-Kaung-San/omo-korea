import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, UtensilsCrossed } from 'lucide-react'
import { api } from '@/api'
import { useLanguage } from '@/context/LanguageContext'
import type { TodayMealSlide } from '@/utils/cafeteria'
import {
  findGeumjeongStudentCafeteria,
  getTodayLunchDinnerSlides,
} from '@/utils/cafeteria'

const CARD_SHADOW = '0 12px 32px rgba(15,23,42,0.08)'
const CAFETERIA_PATH = '/campus-life/cafeteria'

function MealPanel({ meal, emptyLabel }: { meal: TodayMealSlide; emptyLabel: string }) {
  const shortLabel = meal.mealType.trim() || meal.mealLabel.split('·')[0]?.trim() || meal.mealLabel

  return (
    <div className="min-w-0 rounded-2xl bg-[#F8FAFC] px-3 py-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-[13px] font-bold text-pnu-text">{shortLabel}</p>
        {meal.price ? (
          <p className="shrink-0 text-[11px] font-semibold text-pnu-blue">{meal.price}</p>
        ) : null}
      </div>
      {meal.note ? (
        <p className="text-[12px] leading-snug text-pnu-muted">{meal.note}</p>
      ) : meal.items.length > 0 ? (
        <ul className="space-y-1">
          {meal.items.slice(0, 5).map((item) => (
            <li key={item} className="text-[12px] leading-snug text-pnu-text">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-pnu-muted">{emptyLabel}</p>
      )}
    </div>
  )
}

export function CafeteriaTodayPreview() {
  const { language, t } = useLanguage()
  const [meals, setMeals] = useState<TodayMealSlide[]>([])
  const [hallName, setHallName] = useState('금정회관 학생 식당')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    api
      .getCampusFacilities()
      .then((facilities) => {
        if (cancelled) return
        const hall = findGeumjeongStudentCafeteria(facilities.cafeterias)
        if (!hall) {
          setMeals([])
          return
        }
        setHallName(hall.name)
        setMeals(getTodayLunchDinnerSlides(hall))
      })
      .catch(() => {
        if (!cancelled) setMeals([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [language])

  const dayLabel = meals[0]?.dayLabel ?? ''

  return (
    <section className="shrink-0">
      <div className="mb-2.5 flex items-end justify-between gap-2 px-0.5">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-pnu-text">
            {t('home.cafeteriaPreview')}
          </h2>
          <p className="mt-0.5 text-[11px] font-medium text-pnu-muted">
            {t('home.cafeteriaPreviewSubtitle')}
          </p>
        </div>
        <Link
          to={CAFETERIA_PATH}
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-pnu-blue"
        >
          {t('common.viewAll')}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div
        className="overflow-hidden rounded-[24px] bg-white px-4 py-4"
        style={{ boxShadow: CARD_SHADOW }}
      >
        {loading ? (
          <p className="text-[12px] text-pnu-muted">{t('common.loading')}</p>
        ) : meals.length === 0 ? (
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4E5] text-[#EA580C]">
              <UtensilsCrossed className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-pnu-text">{hallName}</p>
              <p className="mt-1 text-[12px] text-pnu-muted">{t('home.cafeteriaPreviewEmpty')}</p>
              <Link
                to={CAFETERIA_PATH}
                className="mt-2 inline-flex text-[12px] font-semibold text-pnu-blue"
              >
                {t('home.cafeteriaPreviewOpenFull')}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4E5] text-[#EA580C]">
                <UtensilsCrossed className="h-4 w-4" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-pnu-text">{hallName}</p>
                {dayLabel ? (
                  <p className="mt-0.5 text-[11px] text-pnu-muted">
                    {t('home.cafeteriaPreviewToday', { date: dayLabel })}
                  </p>
                ) : null}
              </div>
            </div>

            <div
              className={[
                'grid gap-2.5',
                meals.length > 1 ? 'grid-cols-2' : 'grid-cols-1',
              ].join(' ')}
            >
              {meals.map((meal) => (
                <MealPanel
                  key={meal.mealType}
                  meal={meal}
                  emptyLabel={t('home.cafeteriaPreviewNoItems')}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
