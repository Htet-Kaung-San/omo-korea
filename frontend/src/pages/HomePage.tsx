import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, Search } from 'lucide-react'
import { api } from '@/api'
import type {
  ChecklistItem,
  ChecklistVariant,
  GraduationProgress,
  Notification,
} from '@/types/api'
import { useLanguage } from '@/context/LanguageContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { GraduationCard } from '@/components/graduation/GraduationCard'
import { ChecklistRow } from '@/components/checklist/ChecklistRow'
import { ProgressBar } from '@/components/ui/ProgressBar'

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
  const { language, t } = useLanguage()
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
        title="Home Page"
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

          <div className="overflow-hidden rounded-2xl border border-pnu-border bg-white shadow-sm">
            {notifications.length === 0 && !error ? (
              <p className="p-3 text-sm text-pnu-muted">{t('home.noNotifications')}</p>
            ) : null}
            <div className="divide-y divide-pnu-border">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2.5"
                >
                  <Link
                    to={`/notifications/${notification.id}`}
                    className="line-clamp-1 text-[13px] font-semibold text-pnu-text hover:text-pnu-blue-light"
                  >
                    {notification.title}
                  </Link>
                  {notification.priority === 'HIGH' ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      {t('common.high')}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-pnu-muted">
                      {notification.category}
                    </span>
                  )}
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
