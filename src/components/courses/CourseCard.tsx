import type { RecommendedCourse } from '@/types/api'
import { CourseTypeBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { useLanguage } from '@/context/LanguageContext'

export function CourseCard({ course }: { course: RecommendedCourse }) {
  const { t } = useLanguage()

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-pnu-text">{course.nameKo}</p>
          <p className="mt-0.5 text-sm text-pnu-muted">{course.nameEn}</p>
        </div>
        <CourseTypeBadge type={course.type} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-pnu-muted">
        <span>{t('course.credits', { count: course.credits })}</span>
        <span>·</span>
        <span>{course.department}</span>
      </div>

      {course.matchHint ? (
        <p className="mt-2 text-xs font-medium text-pnu-blue-light">{course.matchHint}</p>
      ) : null}
    </Card>
  )
}
