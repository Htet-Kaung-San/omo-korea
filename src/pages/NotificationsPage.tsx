import { useEffect, useState } from 'react'
import { api } from '@/api'
import type { Notification } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { NotificationCard } from '@/components/notifications/NotificationCard'
import { useLanguage } from '@/context/LanguageContext'

export function NotificationsPage() {
  const { t } = useLanguage()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getNotifications()
      .then(setNotifications)
      .catch((err) => setError(err instanceof Error ? err.message : t('notifications.loadError')))
      .finally(() => setLoading(false))
  }, [t])

  return (
    <div>
      <PageHeader title={t('notifications.title')} subtitle={t('notifications.subtitle')} back />

      <div className="space-y-3 px-5 py-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}
        {loading ? <p className="text-sm text-pnu-muted">{t('notifications.loading')}</p> : null}
        {notifications.map((n) => (
          <NotificationCard key={n.id} notification={n} />
        ))}
      </div>
    </div>
  )
}
