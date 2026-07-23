import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { api } from '@/api'
import type { RecommendedCourse } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { CourseTypeBadge } from '@/components/ui/Badge'

export function RecommendedCoursesPage() {
  const { language, t } = useLanguage()
  const [courses, setCourses] = useState<RecommendedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getRecommendedCourses('ALL')
      .then(setCourses)
      .catch((err) => setError(err instanceof Error ? err.message : t('academic.loadError')))
      .finally(() => setLoading(false))
  }, [language, t])

  const recommendedCourses = useMemo(
    () => courses.filter((course) => course.score > 0),
    [courses],
  )

  return (
    <div>
      <PageHeader title={t('academic.recommendedCourses')} subtitle={t('academic.recommendationHint')} back />

      <div className="space-y-3 px-5 py-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}
        {loading ? <p className="text-sm text-pnu-muted">{t('academic.loading')}</p> : null}
        {!loading && recommendedCourses.length === 0 && !error ? (
          <p className="text-sm text-pnu-muted">{t('academic.noCourses')}</p>
        ) : null}

        {recommendedCourses.map((course) => (
          <article key={course.id} className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 shrink-0 text-pnu-blue-light" aria-hidden="true" />
                  <Link
                    to={`/academic/recommended-courses/${course.id}`}
                    className="text-sm font-bold text-pnu-text hover:text-pnu-blue-light"
                  >
                    {course.nameEn}
                  </Link>
                </div>
                <p className="mt-1 text-sm text-pnu-muted">{course.nameKo}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <CourseTypeBadge type={course.type} />
                <span className="text-xs font-semibold text-pnu-blue-light">{course.score}% match</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-pnu-muted">
              <span>{t('course.credits', { count: course.credits })}</span>
              {course.department ? (
                <>
                  <span aria-hidden="true">&middot;</span>
                  <span>{course.department}</span>
                </>
              ) : null}
            </div>
            {course.matchHint ? (
              <p className="mt-3 text-sm text-pnu-muted">{course.matchHint}</p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}

