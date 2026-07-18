import {
  BookOpen,
  Cpu,
  MapPin,
  Monitor,
  Sigma,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import type { DayClassItem } from '@/utils/timetable'

interface DayClassListProps {
  classes: DayClassItem[]
  /** When true, render rows only (parent supplies the card). */
  embedded?: boolean
}

const COURSE_TONES = [
  {
    wrap: 'bg-[#E8F8ED] text-[#248A3D]',
    Icon: BookOpen,
  },
  {
    wrap: 'bg-[#EDE9FE] text-[#7C3AED]',
    Icon: Cpu,
  },
  {
    wrap: 'bg-[#E8F3FF] text-pnu-blue',
    Icon: Monitor,
  },
  {
    wrap: 'bg-[#FFF4E5] text-[#C2410C]',
    Icon: Sigma,
  },
] as const

const CATEGORY_PILLS = {
  elective: 'bg-[#E8F8ED] text-[#248A3D]',
  selective: 'bg-[#EDE9FE] text-[#7C3AED]',
  genEd: 'bg-[#E8F3FF] text-pnu-blue',
} as const

type CategoryKind = keyof typeof CATEGORY_PILLS

function resolveCategoryKind(category?: string): CategoryKind {
  const c = (category ?? '').trim().toLowerCase()
  if (
    c === 'gen_ed' ||
    c === 'gen-ed' ||
    c === 'gened' ||
    c.includes('general') ||
    c.includes('교양')
  ) {
    return 'genEd'
  }
  if (
    c === 'required' ||
    c === 'selective' ||
    c.includes('전공') ||
    c.includes('필수')
  ) {
    return 'selective'
  }
  if (c === 'elective' || c.includes('선택') || c.includes('elect')) {
    return 'elective'
  }
  const hash = [...(category ?? 'elective')].reduce((n, ch) => n + ch.charCodeAt(0), 0)
  return (['elective', 'selective', 'genEd'] as const)[hash % 3]
}

function categoryLabelKey(kind: CategoryKind): string {
  if (kind === 'genEd') return 'schedule.categoryGenEd'
  if (kind === 'selective') return 'schedule.categorySelective'
  return 'schedule.categoryElective'
}

export function DayClassList({ classes, embedded = false }: DayClassListProps) {
  const { t } = useLanguage()

  if (classes.length === 0) {
    if (embedded) {
      return (
        <p className="px-1 py-6 text-center text-[13px] font-medium text-pnu-muted">
          {t('schedule.emptyDay')}
        </p>
      )
    }
    return (
      <div className="rounded-[18px] bg-white px-4 py-8 text-center text-[13px] text-pnu-muted shadow-sm ring-1 ring-black/5">
        {t('schedule.emptyDay')}
      </div>
    )
  }

  return (
    <ul className={embedded ? 'divide-y divide-black/6' : 'space-y-2.5'}>
      {classes.map((item, index) => {
        const { enrollment, slot } = item
        const courseTone = COURSE_TONES[index % COURSE_TONES.length]
        const CourseIcon = courseTone.Icon
        const kind = resolveCategoryKind(enrollment.category)
        const pillClass = CATEGORY_PILLS[kind]

        return (
          <li
            key={`${enrollment.enrollment_id}-${slot.day}-${slot.start}`}
            className={
              embedded
                ? 'flex items-start gap-3 py-3.5 first:pt-2.5 last:pb-1'
                : 'flex items-start gap-2.5 rounded-[16px] bg-white p-3.5 shadow-sm ring-1 ring-black/5'
            }
          >
            <span
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${courseTone.wrap}`}
            >
              <CourseIcon className="h-5 w-5" strokeWidth={1.9} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold text-pnu-text">
                    {enrollment.course_name || t('schedule.untitledClass')}
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium text-pnu-muted">
                    {slot.start} – {slot.end}
                  </p>
                  {enrollment.classroom ? (
                    <p className="mt-1 inline-flex max-w-full items-center gap-1 text-[11px] font-medium text-pnu-muted">
                      <MapPin className="h-3 w-3 shrink-0 text-pnu-blue/70" />
                      <span className="truncate">{enrollment.classroom}</span>
                    </p>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${pillClass}`}
                >
                  {t(categoryLabelKey(kind))}
                </span>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
