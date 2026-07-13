import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, Search, Sparkles } from 'lucide-react'
import { api } from '@/api'
import type {
  ChecklistItem,
  ChecklistVariant,
  GraduationProgress,
  RecommendedCourse,
} from '@/types/api'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { GraduationCard } from '@/components/graduation/GraduationCard'
import { ChecklistRow } from '@/components/checklist/ChecklistRow'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CourseTypeBadge } from '@/components/ui/Badge'

function isItemLocked(item: ChecklistItem, progress: GraduationProgress | null): boolean {
  if (!item.creditRequirement || !progress) return false
  const { category } = item.creditRequirement
  const required =
    category === 'total'
      ? progress.totalRequired
      : progress.breakdown[category].required

  const completed =
    category === 'total'
      ? progress.totalCompleted
      : progress.breakdown[category].completed

  return completed < required
}

export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const [progress, setProgress] = useState<GraduationProgress | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [checklistVariant, setChecklistVariant] = useState<ChecklistVariant>('GRADUATION_REQUIREMENT')
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isFresher = checklistVariant === 'NEW_STUDENT'
  const displayName = user?.name?.trim() || t('home.defaultName')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getGraduationProgress(),
      api.getChecklist(),
      api.getAiDashboard(),
    ])
      .then(([grad, checklistPayload, dashboard]) => {
        setProgress(grad)
        setChecklist(checklistPayload.items)
        setChecklistVariant(checklistPayload.variant)
        setRecommendedCourses(
          dashboard.recommendedCourses.filter((course) => course.score > 0).slice(0, 4),
        )
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('home.loadError')))
      .finally(() => setLoading(false))
  }, [language, t])

  async function handleToggleChecklist(id: string, completed: boolean) {
    setUpdatingId(id)
    setError('')
    try {
      const updated = await api.updateChecklistItem(id, completed)
      setChecklist((prev) => prev.map((item) => (item.id === id ? updated : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('home.updateError'))
    } finally {
      setUpdatingId(null)
    }
  }

  const completedCount = checklist.filter((i) => i.completed).length

  function getLocalizedLockReason(item: ChecklistItem): string {
    if (!item.creditRequirement || !progress) return ''
    const { category } = item.creditRequirement
    const labels: Record<string, string> = {
      generalRequired: '교양필수',
      generalElective: '교양선택',
      majorBasic: '전공기초',
      majorRequired: '전공필수',
      majorElective: '전공선택',
      generalFree: '일반선택',
    }
    const required =
      category === 'total'
        ? progress.totalRequired
        : progress.breakdown[category].required
    const completed =
      category === 'total'
        ? progress.totalCompleted
        : progress.breakdown[category].completed
    const remaining = Math.max(required - completed, 0)
    if (category === 'total') {
      return t('checklist.lockReasonTotal', { required, completed, remaining })
    }
    return t('checklist.lockReasonCategory', {
      required,
      label: labels[category] ?? category,
      completed,
      remaining,
    })
  }

  return (
    <div>
      <PageHeader
        title={t('home.title', { name: displayName })}
        subtitle={isFresher ? t('home.subtitleFreshman') : t('home.subtitleIntl')}
        action={(
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/academic')}
              aria-label={t('home.searchAria')}
              className="rounded-xl bg-white p-2.5 text-pnu-muted shadow-sm ring-1 ring-pnu-border transition hover:text-pnu-blue"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              aria-label={t('home.bellAria')}
              className="rounded-xl bg-white p-2.5 text-pnu-muted shadow-sm ring-1 ring-pnu-border transition hover:text-pnu-blue"
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      <div className="space-y-5 px-5 py-5">
        {error ? (
          <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100">
            {error}
          </p>
        ) : null}

        {loading ? <p className="text-sm text-pnu-muted">{t('home.loading')}</p> : null}

        {!loading && isFresher ? (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-pnu-text">{t('home.newStudentChecklist')}</h2>
              <Link
                to="/checklist"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-pnu-blue-light"
              >
                {t('common.viewAll')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-3xl border border-pnu-border bg-white p-4 shadow-sm">
              {checklist.length === 0 ? (
                <p className="text-sm text-pnu-muted">{t('home.noChecklist')}</p>
              ) : (
                <>
                  <div className="mb-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                      <span className="text-pnu-text">{t('home.checklistProgress')}</span>
                      <span className="text-pnu-muted">
                        {t('common.completedCount', {
                          completed: completedCount,
                          total: checklist.length,
                        })}
                      </span>
                    </div>
                    <ProgressBar value={completedCount} max={checklist.length} size="sm" />
                  </div>

                  <div className="divide-y divide-pnu-border">
                    {checklist.map((item) => {
                      const locked = isItemLocked(item, progress)
                      const lockReason = locked ? getLocalizedLockReason(item) : undefined
                      return (
                        <ChecklistRow
                          key={item.id}
                          item={item}
                          variant="plain"
                          disabled={updatingId === item.id}
                          locked={locked}
                          lockReason={lockReason}
                          onToggle={handleToggleChecklist}
                        />
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </section>
        ) : null}

        {!loading ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-pnu-text">{t('home.courseDashboard')}</h2>
              <Link
                to="/academic"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-pnu-blue-light"
              >
                {t('common.viewMore')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {!isFresher && progress ? <GraduationCard progress={progress} /> : null}

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-pnu-text">
                  <Sparkles className="h-4 w-4 text-pnu-blue-light" />
                  {t('academic.recommendedCourses')}
                </h3>
                <Link
                  to="/academic/recommended-courses"
                  className="inline-flex items-center gap-0.5 text-xs font-semibold text-pnu-blue-light"
                >
                  {t('common.viewMore')}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {recommendedCourses.length === 0 ? (
                <p className="text-sm text-pnu-muted">{t('academic.noCourses')}</p>
              ) : (
                <div className="no-scrollbar -mx-5 overflow-x-auto px-5 pb-1">
                  <div className="flex gap-3">
                    {recommendedCourses.map((course) => (
                      <article
                        key={course.id}
                        className="w-56 shrink-0 rounded-2xl border border-pnu-border bg-white p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              to={`/academic/recommended-courses/${course.id}`}
                              className="line-clamp-1 text-sm font-bold text-pnu-text hover:text-pnu-blue-light"
                            >
                              {course.nameEn}
                            </Link>
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
              )}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
