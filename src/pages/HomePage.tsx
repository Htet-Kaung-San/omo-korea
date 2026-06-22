import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { api } from '@/api'
import type { GraduationProgress, Notification, ChecklistItem } from '@/types/api'
import { useAuth } from '@/context/AuthContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { GraduationCard } from '@/components/graduation/GraduationCard'
import { NotificationCard } from '@/components/notifications/NotificationCard'
import { ChecklistRow } from '@/components/checklist/ChecklistRow'
import { ProgressBar } from '@/components/ui/ProgressBar'

export function HomePage() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<GraduationProgress | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const isFreshman = user?.studentId?.startsWith('2026') ?? false

  useEffect(() => {
    Promise.all([
      api.getGraduationProgress(),
      api.getNotifications(),
      api.getChecklist(),
    ])
      .then(([grad, notifs, list]) => {
        setProgress(grad)
        setNotifications(notifs.slice(0, 3))
        setChecklist(list)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard.'))
  }, [])

  async function handleToggleChecklist(id: string, completed: boolean) {
    setUpdatingId(id)
    setError('')
    try {
      const updated = await api.updateChecklistItem(id, completed)
      setChecklist((prev) => prev.map((item) => (item.id === id ? updated : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item.')
    } finally {
      setUpdatingId(null)
    }
  }

  const completedCount = checklist.filter((i) => i.completed).length

  return (
    <div>
      <PageHeader
        title={`Hello, ${user?.name.split(' ')[0] ?? 'Student'}`}
        subtitle={isFreshman ? 'Freshman onboarding dashboard' : 'International student dashboard'}
      />

      <div className="space-y-5 px-5 py-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        {/* Graduation progress card - only for non-freshmen */}
        {!isFreshman && progress ? <GraduationCard progress={progress} compact /> : null}

        {/* Checklist Section */}
        {checklist.length > 0 ? (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-pnu-text">
                {isFreshman ? 'New Student Checklist' : 'Graduation Requirement Checklist'}
              </h2>
              <Link
                to="/checklist"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-pnu-blue-light"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm mb-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                <span className="text-pnu-text">Checklist Progress</span>
                <span className="text-pnu-muted">
                  {completedCount} of {checklist.length} completed
                </span>
              </div>
              <ProgressBar value={completedCount} max={checklist.length} size="sm" />
            </div>

            <div className="space-y-2">
              {checklist.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  disabled={updatingId === item.id}
                  onToggle={handleToggleChecklist}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Notifications Section */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-pnu-text">Notifications</h2>
            <Link
              to="/notifications"
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-pnu-blue-light"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {notifications.length === 0 && !error ? (
              <p className="text-sm text-pnu-muted">No notifications right now.</p>
            ) : null}
            {notifications.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
