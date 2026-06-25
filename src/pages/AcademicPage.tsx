import { useEffect, useMemo, useState } from 'react'
import { api } from '@/api'
import type { CourseType, GraduationProgress, RecommendedCourse } from '@/types/api'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { CourseCard } from '@/components/courses/CourseCard'
import { CourseFilters } from '@/components/courses/CourseFilters'
import { GraduationCard } from '@/components/graduation/GraduationCard'

export function AcademicPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [allFilter, setAllFilter] = useState<CourseType | 'ALL'>('ALL')
  const [allCourses, setAllCourses] = useState<RecommendedCourse[]>([])
  const [progress, setProgress] = useState<GraduationProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([api.getRecommendedCourses('ALL'), api.getGraduationProgress()])
      .then(([courses, graduation]) => {
        setAllCourses(courses)
        setProgress(graduation)
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('academic.loadError')))
      .finally(() => setLoading(false))
  }, [t])

  const filteredAllCourses = useMemo(() => {
    if (allFilter === 'ALL') return allCourses
    return allCourses.filter((course) => course.type === allFilter)
  }, [allCourses, allFilter])

  const recommendedCourses = useMemo(
    () => allCourses.filter((course) => course.score > 0).slice(0, 6),
    [allCourses],
  )

  const profileIncomplete = !user?.major

  return (
    <div>
      <PageHeader title={t('academic.title')} subtitle={t('academic.subtitle')} />

      <div className="space-y-4 px-5 py-5">
        {profileIncomplete ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t('academic.profileIncomplete')}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        {loading ? <p className="text-sm text-pnu-muted">{t('academic.loading')}</p> : null}

        {!loading && progress ? (
          <section>
            <h2 className="mb-3 text-base font-bold text-pnu-text">{t('academic.completedCredits')}</h2>
            <GraduationCard progress={progress} />
          </section>
        ) : null}

        <section>
          <h2 className="mb-3 text-base font-bold text-pnu-text">{t('academic.allCourses')}</h2>
          <CourseFilters value={allFilter} onChange={setAllFilter} />

          {!loading && filteredAllCourses.length === 0 && !error ? (
            <p className="mt-3 text-sm text-pnu-muted">{t('academic.noCourses')}</p>
          ) : null}

          <div className="mt-3 space-y-3">
            {filteredAllCourses.map((course) => (
              <CourseCard key={`all-${course.id}`} course={course} />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3">
            <h2 className="text-base font-bold text-pnu-text">{t('academic.recommendedCourses')}</h2>
            <p className="text-xs text-pnu-muted">{t('academic.recommendationHint')}</p>
          </div>

          {!loading && recommendedCourses.length === 0 && !error ? (
            <p className="text-sm text-pnu-muted">{t('academic.noCourses')}</p>
          ) : null}

          <div className="space-y-3">
            {recommendedCourses.map((course) => (
              <CourseCard key={`recommended-${course.id}`} course={course} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
