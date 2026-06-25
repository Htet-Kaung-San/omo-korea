import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, ChevronRight, Search } from 'lucide-react'
import { api } from '@/api'
import type { GraduationProgress, Notification, ChecklistItem, ChecklistVariant } from '@/types/api'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { GraduationCard } from '@/components/graduation/GraduationCard'
import { ChecklistRow } from '@/components/checklist/ChecklistRow'
import { ProgressBar } from '@/components/ui/ProgressBar'

// Re-use the same lock logic as ChecklistPage
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
  const { t, locale } = useLanguage()
  const [progress, setProgress] = useState<GraduationProgress | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [checklistVariant, setChecklistVariant] = useState<ChecklistVariant>('GRADUATION_REQUIREMENT')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const isFreshmanChecklist = checklistVariant === 'NEW_STUDENT'

  useEffect(() => {
    Promise.all([
      api.getGraduationProgress(),
      api.getNotifications(),
      api.getChecklist(),
    ])
      .then(([grad, notifs, checklistPayload]) => {
        setProgress(grad)
        setNotifications(notifs.slice(0, 3))
        setChecklist(checklistPayload.items)
        setChecklistVariant(checklistPayload.variant)
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('home.loadError')))
  }, [])

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

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    })
  }

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
        title={t('home.title', {
          name: user?.name.split(' ')[0] ?? t('home.defaultName'),
        })}
        subtitle={
          isFreshmanChecklist
            ? t('home.subtitleFreshman')
            : t('home.subtitleIntl')
        }
        action={(
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/academic')}
              aria-label={t('home.searchAria')}
              className="rounded-xl border border-pnu-border bg-white p-2 text-pnu-muted transition hover:text-pnu-text"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              aria-label={t('home.bellAria')}
              className="rounded-xl border border-pnu-border bg-white p-2 text-pnu-muted transition hover:text-pnu-text"
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      <div className="space-y-5 px-5 py-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        {/* Graduation progress card - only for non-freshmen */}
        {!isFreshmanChecklist && progress ? <GraduationCard progress={progress} /> : null}

        {/* Important notices */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-pnu-text">{t('home.importantNotices')}</h2>
            <Link
              to="/notifications"
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-pnu-blue-light"
            >
              {t('common.viewMore')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
            {notifications.length === 0 && !error ? (
              <p className="text-sm text-pnu-muted">{t('home.noNotifications')}</p>
            ) : null}
            <div className="divide-y divide-pnu-border">
              {notifications.map((notification) => (
                <article key={notification.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-pnu-text">{notification.title}</h3>
                    {notification.priority === 'HIGH' ? (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                        {t('common.high')}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-relaxed text-pnu-muted">{notification.body}</p>
                  <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-pnu-muted">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(notification.date)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Checklist section */}
        {checklist.length > 0 ? (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-pnu-text">
                {isFreshmanChecklist
                  ? t('home.newStudentChecklist')
                  : t('home.graduationChecklist')}
              </h2>
              <Link
                to="/checklist"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-pnu-blue-light"
              >
                {t('common.viewAll')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
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
      </div>
    </div>
  )
}
