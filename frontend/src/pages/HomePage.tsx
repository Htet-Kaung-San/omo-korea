import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Sparkles } from 'lucide-react'
import { api } from '@/api'
import type {
  ChecklistItem,
  ChecklistVariant,
  Enrollment,
  GraduationProgress,
  Notification,
  RecommendedCourse,
} from '@/types/api'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { GraduationCard } from '@/components/graduation/GraduationCard'
import { ChecklistRow } from '@/components/checklist/ChecklistRow'
import { AcademicCalendarSection } from '@/components/home/AcademicCalendarSection'
import { HomeHeroCard } from '@/components/home/HomeHeroCard'
import { LatestNoticeCard } from '@/components/home/LatestNoticeCard'
import { NextClassCard } from '@/components/home/NextClassCard'
import { QuickAccessGrid } from '@/components/home/QuickAccessGrid'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CourseTypeBadge } from '@/components/ui/Badge'
import { getNextClass } from '@/utils/timetable'
import sanjini from '@/assets/pnu-character.png'

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
  const { language, locale, t } = useLanguage()
  const [progress, setProgress] = useState<GraduationProgress | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [checklistVariant, setChecklistVariant] = useState<ChecklistVariant>('GRADUATION_REQUIREMENT')
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [latestNotice, setLatestNotice] = useState<Notification | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isFresher = checklistVariant === 'NEW_STUDENT'

  useEffect(() => {
    setLoading(true)
    const studentId = user?.studentId
    Promise.all([
      api.getGraduationProgress(),
      api.getChecklist(),
      api.getAiDashboard(),
      studentId ? api.getEnrollments(studentId) : Promise.resolve([] as Enrollment[]),
      api.getNotifications(),
    ])
      .then(([grad, checklistPayload, dashboard, enrollmentList, notifications]) => {
        setProgress(grad)
        setChecklist(checklistPayload.items)
        setChecklistVariant(checklistPayload.variant)
        setRecommendedCourses(
          dashboard.recommendedCourses.filter((course) => course.score > 0).slice(0, 4),
        )
        setEnrollments(enrollmentList)
        const sorted = [...notifications].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        setLatestNotice(sorted[0] ?? null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('home.loadError')))
      .finally(() => setLoading(false))
  }, [language, t, user?.studentId])

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
  const showChecklistSection =
    isFresher && checklist.length > 0 && completedCount < checklist.length

  const nextClass = useMemo(() => getNextClass(enrollments), [enrollments])

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
    <div className="relative">
      <div className="space-y-6 px-4 py-4 pb-28">
        {error ? (
          <p className="rounded-[16px] bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {loading ? <p className="text-sm text-pnu-muted">{t('home.loading')}</p> : null}

        {!loading ? (
          <>
            <HomeHeroCard user={user} />

            {showChecklistSection ? (
              <section>
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-[17px] font-semibold tracking-tight text-pnu-text">
                    {t('home.newStudentChecklist')}
                  </h2>
                  <Link to="/" className="text-[13px] font-semibold text-pnu-blue">
                    {t('common.viewAll')}
                  </Link>
                </div>
                <div className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/5">
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
                </div>
              </section>
            ) : null}

            <NextClassCard nextClass={nextClass} locale={locale} />

            <AcademicCalendarSection />

            <QuickAccessGrid />

            <section>
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-pnu-text">
                  <Sparkles className="h-4 w-4 text-pnu-blue" />
                  {t('academic.recommendedCourses')}
                </h2>
                <Link
                  to="/academic/recommended-courses"
                  className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-pnu-blue"
                >
                  {t('common.viewMore')}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {recommendedCourses.length === 0 ? (
                <p className="px-1 text-sm text-pnu-muted">{t('academic.noCourses')}</p>
              ) : (
                <div className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-1">
                  <div className="flex gap-3">
                    {recommendedCourses.map((course) => (
                      <article
                        key={course.id}
                        className="w-56 shrink-0 rounded-[20px] bg-white p-3.5 shadow-sm ring-1 ring-black/5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              to={`/academic/recommended-courses/${course.id}`}
                              className="line-clamp-1 text-sm font-semibold text-pnu-text"
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
            </section>

            <LatestNoticeCard notice={latestNotice} />

            {!isFresher && progress ? (
              <section>
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-[17px] font-semibold tracking-tight text-pnu-text">
                    {t('graduation.title')}
                  </h2>
                  <Link
                    to="/schedule"
                    className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-pnu-blue"
                  >
                    {t('common.viewMore')}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <GraduationCard progress={progress} compact />
              </section>
            ) : null}
          </>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => navigate('/ai')}
        aria-label={t('nav.aiAssistant')}
        className="fixed bottom-24 right-[max(1rem,calc((100vw-28rem)/2+1rem))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/8 transition active:scale-95"
      >
        <img src={sanjini} alt="" className="h-11 w-11 object-contain" />
      </button>
    </div>
  )
}
