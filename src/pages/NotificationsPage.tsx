import { useEffect, useState } from 'react'
import { api } from '@/api'
import type { Notification } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { NotificationCard } from '@/components/notifications/NotificationCard'

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getNotifications()
      .then(setNotifications)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load notifications.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Academic alerts and deadlines" back />

      <div className="space-y-3 px-5 py-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}
        {loading ? <p className="text-sm text-pnu-muted">Loading notifications…</p> : null}
        {notifications.map((n) => (
          <NotificationCard key={n.id} notification={n} />
        ))}
      </div>
    </div>
  )
}
