import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { api } from '@/api'
import type { RecommendedCourse } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { CourseTypeBadge } from '@/components/ui/Badge'
import { useLanguage } from '@/context/LanguageContext'

export function CourseDetailPage() {
  const { courseId } = useParams()
  const { language, t } = useLanguage()
  const [course, setCourse] = useState<RecommendedCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getRecommendedCourses('ALL')
      .then((courses) => setCourse(courses.find((item) => item.id === courseId) ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : t('academic.loadError')))
      .finally(() => setLoading(false))
  }, [language, courseId, t])

  return (
    <div>
      <PageHeader title={course?.nameEn ?? t('academic.recommendedCourses')} back />
      <div className="px-5 py-5">
        {loading ? <p className="text-sm text-pnu-muted">{t('academic.loading')}</p> : null}
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}
        {!loading && !course && !error ? (
          <p className="text-sm text-pnu-muted">{t('academic.noCourses')}</p>
        ) : null}
        {course ? (
          <article className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-pnu-blue-light" />
                  <h1 className="text-lg font-bold text-pnu-text">{course.nameEn}</h1>
                </div>
                <p className="mt-1 text-sm text-pnu-muted">{course.nameKo}</p>
              </div>
              <CourseTypeBadge type={course.type} />
            </div>
            <div className="space-y-2 text-sm text-pnu-muted">
              <p>
                <span className="font-semibold text-pnu-text">{t('courseTable.credits')}:</span>{' '}
                {t('course.credits', { count: course.credits })}
              </p>
              <p>
                <span className="font-semibold text-pnu-text">{t('courseTable.department')}:</span>{' '}
                {course.department}
              </p>
              <p>
                <span className="font-semibold text-pnu-text">Tags:</span> {course.tags.join(', ')}
              </p>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  )
}
