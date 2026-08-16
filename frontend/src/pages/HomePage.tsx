import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import type { ChecklistItem, ScholarshipItem } from '@/types/api'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useNoticeRefresh } from '@/context/NoticeRefreshContext'
import { ChecklistRow } from '@/components/checklist/ChecklistRow'
import { LatestNoticeCarousel } from '@/components/home/LatestNoticeCarousel'
import { QuickAccessGrid } from '@/components/home/QuickAccessGrid'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { mergeNoticeFeed } from '@/utils/noticeFeed'

export function HomePage() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const {
    notifications: personalizedNotices,
    loading: noticesLoading,
    error: noticesError,
  } = useNoticeRefresh()
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [scholarships, setScholarships] = useState<ScholarshipItem[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getChecklist(),
      // Scholarships are supplementary here: the home feed merges them in
      // alongside notices. Failing to load them should not put a red banner
      // over the navigation bar, so the error is both suppressed and handled.
      api.getScholarships({ suppressToast: true }).catch(() => []),
    ])
      .then(([checklistPayload, scholarshipItems]) => {
        setChecklist(checklistPayload.items)
        setScholarships(scholarshipItems)
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('home.loadError')))
      .finally(() => setLoading(false))
  }, [language, t, user?.studentId])

  const notices = useMemo(
    () => mergeNoticeFeed(personalizedNotices, scholarships),
    [personalizedNotices, scholarships],
  )
  const pageError = error || noticesError
  const pageLoading = loading || noticesLoading

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

  const pendingChecklist = checklist.filter((i) => !i.completed)
  const completedCount = checklist.filter((i) => i.completed).length
  const showChecklistSection = pendingChecklist.length > 0
  const previewChecklist = pendingChecklist.slice(0, 2)

  return (
    <div className="relative animate-fade-in px-3.5 py-4">
      {pageError ? (
        <p className="mb-4 rounded-[16px] bg-red-50 px-3 py-2 text-[11px] text-red-600">
          {pageError}
        </p>
      ) : null}

      {pageLoading ? (
        <p className="text-[12px] text-pnu-muted">{t('home.loading')}</p>
      ) : (
        <div className="flex flex-col gap-6 pb-4">
          {showChecklistSection ? (
            <section className="shrink-0">
              <div className="mb-2.5 flex items-end justify-between gap-2 px-0.5">
                <div>
                  <h2 className="text-[15px] font-bold tracking-tight text-pnu-text">
                    {t('checklist.title')}
                  </h2>
                  <p className="mt-0.5 text-[11px] font-medium text-pnu-muted">
                    {t('checklist.subtitle')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] font-semibold text-pnu-muted">
                    {t('common.completedCount', {
                      completed: completedCount,
                      total: checklist.length,
                    })}
                  </span>
                  <Link
                    to="/checklist"
                    className="text-[11px] font-semibold text-pnu-blue transition active:scale-[0.98]"
                  >
                    {t('common.viewAll')}
                  </Link>
                </div>
              </div>
              <div
                className="overflow-hidden rounded-[24px] bg-white px-3.5 py-3.5"
                style={{ boxShadow: '0 12px 32px rgba(15,23,42,0.08)' }}
              >
                <ProgressBar value={completedCount} max={checklist.length} size="sm" />
                <div className="mt-2 divide-y divide-pnu-border">
                  {previewChecklist.map((item) => (
                    <ChecklistRow
                      key={item.id}
                      item={item}
                      variant="plain"
                      disabled={updatingId === item.id}
                      onToggle={handleToggleChecklist}
                    />
                  ))}
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
