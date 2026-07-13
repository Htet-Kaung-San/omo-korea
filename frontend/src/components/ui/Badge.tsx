import type { CourseType } from '@/types/api'
import { useLanguage } from '@/context/LanguageContext'

const styles: Record<CourseType, string> = {
  REQUIRED: 'bg-blue-50 text-blue-700 border-blue-200',
  ELECTIVE: 'bg-violet-50 text-violet-700 border-violet-200',
  GEN_ED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const labels: Record<CourseType, string> = {
  REQUIRED: 'courseFilter.required',
  ELECTIVE: 'courseFilter.elective',
  GEN_ED: 'courseFilter.genEd',
}

export function CourseTypeBadge({ type }: { type: CourseType }) {
  const { t } = useLanguage()

  return (
    <span
      className={[
        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        styles[type],
      ].join(' ')}
    >
      {t(labels[type])}
    </span>
  )
}
