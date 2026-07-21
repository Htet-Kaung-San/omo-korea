import { useEffect, useState } from 'react'
import { api } from '@/api'
import type {
  ChecklistItem,
  ChecklistVariant,
  GraduationProgress,
  Notification,
} from '@/types/api'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { ChecklistRow } from '@/components/checklist/ChecklistRow'
import { LatestNoticeCarousel } from '@/components/home/LatestNoticeCarousel'
import { QuickAccessGrid } from '@/components/home/QuickAccessGrid'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { mergeNoticeFeed } from '@/utils/noticeFeed'

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
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const [progress, setProgress] = useState<GraduationProgress | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [checklistVariant, setChecklistVariant] = useState<ChecklistVariant>('GRADUATION_REQUIREMENT')
  const [notices, setNotices] = useState<Notification[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isFresher = checklistVariant === 'NEW_STUDENT'

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getGraduationProgress(),
      api.getChecklist(),
      api.getNotifications(),
      api.getScholarships().catch(() => []),
    ])
      .then(([grad, checklistPayload, notifications, scholarships]) => {
        setProgress(grad)
        setChecklist(checklistPayload.items)
        setChecklistVariant(checklistPayload.variant)
        setNotices(mergeNoticeFeed(notifications, scholarships))
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
  const previewChecklist = checklist.slice(0, 2)

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
    <div className="relative animate-fade-in px-3.5 py-4">
      {error ? (
        <p className="mb-4 rounded-[16px] bg-red-50 px-3 py-2 text-[11px] text-red-600">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-[12px] text-pnu-muted">{t('home.loading')}</p>
      ) : (
        <div className="flex flex-col gap-6 pb-4">
          {showChecklistSection ? (
            <section className="shrink-0">
              <div className="mb-2.5 flex items-end justify-between gap-2 px-0.5">
                <div>
                  <h2 className="text-[15px] font-bold tracking-tight text-pnu-text">
                    {t('home.newStudentChecklist')}
                  </h2>
                  <p className="mt-0.5 text-[11px] font-medium text-pnu-muted">
                    {t('home.checklistSubtitle')}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-pnu-muted">
                  {t('common.completedCount', {
                    completed: completedCount,
                    total: checklist.length,
                  })}
                </span>
              </div>
              <div
                className="overflow-hidden rounded-[24px] bg-white px-3.5 py-3.5"
                style={{ boxShadow: '0 12px 32px rgba(15,23,42,0.08)' }}
              >
                <ProgressBar value={completedCount} max={checklist.length} size="sm" />
                <div className="mt-2 divide-y divide-pnu-border">
                  {previewChecklist.map((item) => {
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

          <LatestNoticeCarousel notices={notices} />

          <QuickAccessGrid />
        </div>
      )}
    </div>
  )
}
