import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import type { GraduationProgress, ProgramItem, RecommendedCourse, ScholarshipItem } from '@/types/api'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ChevronRight, GraduationCap, Sparkles } from 'lucide-react'
import { CourseTypeBadge } from '@/components/ui/Badge'
import { getProgramIconForItem } from '@/utils/programIcons'

export function AcademicPage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([])
  const [programs, setPrograms] = useState<ProgramItem[]>([])
  const [scholarships, setScholarships] = useState<ScholarshipItem[]>([])
  const [progress, setProgress] = useState<GraduationProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([api.getAiDashboard(), api.getGraduationProgress()])
      .then(([dashboard, graduation]) => {
        setRecommendedCourses(dashboard.recommendedCourses.filter((course) => course.score > 0).slice(0, 3))
        setPrograms(dashboard.matchedPrograms.slice(0, 3))
        setScholarships(dashboard.eligibleScholarships.slice(0, 3))
        setProgress(graduation)
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('academic.loadError')))
      .finally(() => setLoading(false))
  }, [language, t])

  const profileIncomplete = !user?.major
  const admissionYear = Number(user?.studentId.slice(0, 4))
  const schoolYear =
    Number.isFinite(admissionYear) && admissionYear > 0
      ? Math.max(new Date().getFullYear() - admissionYear + 1, 1)
      : 1

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
          <section className="rounded-[28px] border border-pnu-border bg-white p-5 shadow-md shadow-slate-200/70">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-pnu-blue">
                <GraduationCap className="h-7 w-7" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-pnu-muted">
                  {t('academic.basedOnProfile')}
                </p>
                <p className="mt-1 text-lg font-bold text-pnu-text">
                  {user?.major || t('academic.unknownMajor')} · {t('academic.year', { year: schoolYear })}
                </p>
                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="text-pnu-muted">{t('academic.creditsCompleted')}</span>
                  <span className="font-bold text-pnu-blue">
                    {progress.totalCompleted}
                    <span className="font-normal text-pnu-muted">/{progress.totalRequired}</span>
                  </span>
                </div>
                <ProgressBar value={progress.totalCompleted} max={progress.totalRequired} size="sm" className="mt-2" />
                {user?.interests.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.interests.slice(0, 3).map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-pnu-blue"
                      >
                        #{interest}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-pnu-text">
              {t('academic.recommendedCourses')}
            </h2>
            <Link to="/academic/recommended-courses" className="inline-flex items-center gap-0.5 text-xs font-semibold text-pnu-blue-light">
              {t('common.viewMore')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {!loading && recommendedCourses.length === 0 && !error ? (
            <p className="text-sm text-pnu-muted">{t('academic.noCourses')}</p>
          ) : null}
          <div className="no-scrollbar -mx-5 overflow-x-auto px-5 pb-1">
            <div className="flex gap-3">
              {recommendedCourses.map((course) => (
                <article
                  key={course.id}
                  className="w-56 shrink-0 rounded-2xl border border-pnu-border bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-pnu-blue-light" />
                        <Link
                          to={`/academic/recommended-courses/${course.id}`}
                          className="line-clamp-1 text-sm font-bold text-pnu-text hover:text-pnu-blue-light"
                        >
                          {course.nameEn}
                        </Link>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-pnu-muted">{course.nameKo}</p>
                    </div>
                    <CourseTypeBadge type={course.type} />
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-pnu-muted">
                    <span>{t('course.credits', { count: course.credits })}</span>
                    <span>·</span>
                    <span className="line-clamp-1">{course.department}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-pnu-text">{t('academic.programs')}</h2>
            <Link to="/academic/programs" className="inline-flex items-center gap-0.5 text-xs font-semibold text-pnu-blue-light">
              {t('common.viewMore')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-pnu-border bg-white shadow-sm">
            <div className="divide-y divide-pnu-border">
              {programs.map((program) => {
                const Icon = getProgramIconForItem(program)
                return (
                  <div key={program.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2.5">
                    <Icon className="h-4 w-4 shrink-0 text-pnu-blue" />
                    <Link
                      to={`/academic/programs/${program.id}`}
                      className="line-clamp-1 text-[13px] font-semibold text-pnu-text hover:text-pnu-blue-light"
                    >
                      {program.title}
                    </Link>
                    <span className="text-[11px] font-medium text-pnu-muted">{program.date}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-pnu-text">{t('academic.scholarships')}</h2>
            <Link to="/academic/scholarships" className="inline-flex items-center gap-0.5 text-xs font-semibold text-pnu-blue-light">
              {t('common.viewAll')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-pnu-border bg-white shadow-sm">
            <div className="divide-y divide-pnu-border">
              {scholarships.map((scholarship) => (
                <div key={scholarship.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2.5">
                  <Link
                    to={`/academic/scholarships/${scholarship.id}`}
                    className="line-clamp-1 text-[13px] font-semibold text-pnu-text hover:text-pnu-blue-light"
                  >
                    {scholarship.title}
                  </Link>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                    {scholarship.deadline}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
