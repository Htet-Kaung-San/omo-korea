import type { CourseType } from '@/types/api'

const styles: Record<CourseType, string> = {
  REQUIRED: 'bg-blue-50 text-blue-700 border-blue-200',
  ELECTIVE: 'bg-violet-50 text-violet-700 border-violet-200',
  GEN_ED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const labels: Record<CourseType, string> = {
  REQUIRED: 'Required',
  ELECTIVE: 'Elective',
  GEN_ED: 'Gen-Ed',
}

export function CourseTypeBadge({ type }: { type: CourseType }) {
  return (
    <span
      className={[
        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        styles[type],
      ].join(' ')}
    >
      {labels[type]}
    </span>
  )
}
