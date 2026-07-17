import type { CafeteriaMenuColumn, CafeteriaMenuRow, CampusFacility } from '@/types/api'

export const GEUMJEONG_STUDENT_CAFETERIA_NAME = '금정회관 학생 식당'

export interface TodayMealSlide {
  mealType: string
  mealLabel: string
  price: string | null
  items: string[]
  note: string | null
  dayLabel: string
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function todayDateTokens(today: Date) {
  const y = today.getFullYear()
  const m = pad2(today.getMonth() + 1)
  const d = pad2(today.getDate())
  return [
    `${y}.${m}.${d}`,
    `${y}-${m}-${d}`,
    `${y}/${m}/${d}`,
    `${m}.${d}`,
    `${Number(m)}.${Number(d)}`,
  ]
}

/** Find the column index for today inside a weekly cafeteria menu. */
export function findTodayColumnIndex(
  columns: CafeteriaMenuColumn[],
  today: Date = new Date(),
): number {
  if (columns.length === 0) return -1

  const tokens = todayDateTokens(today)
  const byDate = columns.findIndex((column) =>
    tokens.some((token) => column.day_label.includes(token)),
  )
  if (byDate >= 0) return byDate

  const key = DAY_KEYS[today.getDay()]
  const byKey = columns.findIndex((column) => column.day.toLowerCase() === key)
  if (byKey >= 0) return byKey

  // Korean weekday labels: 일 월 화 수 목 금 토
  const ko = ['일', '월', '화', '수', '목', '금', '토'][today.getDay()]
  return columns.findIndex((column) => column.day_label.trim().startsWith(ko))
}

export function findGeumjeongStudentCafeteria(
  cafeterias: CampusFacility[],
): CampusFacility | null {
  const exact = cafeterias.find((hall) => hall.name.trim() === GEUMJEONG_STUDENT_CAFETERIA_NAME)
  if (exact) return exact

  return (
    cafeterias.find(
      (hall) =>
        hall.name.includes('금정회관') &&
        (hall.name.includes('학생') || hall.name.toLowerCase().includes('student')),
    ) ?? null
  )
}

export function getTodayMealSlides(
  hall: CampusFacility,
  today: Date = new Date(),
): TodayMealSlide[] {
  const rows = hall.menu?.rows ?? []
  if (rows.length === 0) return []

  const sampleColumns = rows[0]?.columns ?? []
  const dayIndex = findTodayColumnIndex(sampleColumns, today)
  if (dayIndex < 0) return []

  return rows
    .map((row: CafeteriaMenuRow) => {
      const column = row.columns[dayIndex]
      if (!column) return null
      return {
        mealType: row.meal_type,
        mealLabel: row.meal_label.replace(/\n/g, ' · '),
        price: column.price ?? null,
        items: column.items ?? [],
        note: column.note ?? null,
        dayLabel: column.day_label,
      }
    })
    .filter((slide): slide is TodayMealSlide => Boolean(slide))
}

function isLunchMeal(mealType: string) {
  const value = mealType.toLowerCase()
  return value.includes('중식') || value.includes('lunch')
}

function isDinnerMeal(mealType: string) {
  const value = mealType.toLowerCase()
  return value.includes('석식') || value.includes('dinner')
}

/** Prefer lunch + dinner for the home preview grid. */
export function getTodayLunchDinnerSlides(
  hall: CampusFacility,
  today: Date = new Date(),
): TodayMealSlide[] {
  const slides = getTodayMealSlides(hall, today)
  const lunch = slides.find((slide) => isLunchMeal(slide.mealType))
  const dinner = slides.find((slide) => isDinnerMeal(slide.mealType))
  return [lunch, dinner].filter((slide): slide is TodayMealSlide => Boolean(slide))
}
