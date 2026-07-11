import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { api } from '@/api'
import type { Notification } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'

export function NotificationPostPage() {
  const { notificationId } = useParams()
  const { language, locale, t } = useLanguage()
  const [notification, setNotification] = useState<Notification | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getNotifications()
      .then((items) => {
        setNotification(items.find((item) => item.id === notificationId) ?? null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : t('notifications.loadError')))
      .finally(() => setLoading(false))
  }, [language, notificationId, t])

  return (
    <div>
      <PageHeader title={notification?.title ?? t('notifications.title')} back />

      <div className="px-5 py-5">
        {loading ? <p className="text-sm text-pnu-muted">{t('notifications.loading')}</p> : null}
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}
        {!loading && !notification && !error ? (
          <p className="text-sm text-pnu-muted">{t('common.errorFallback')}</p>
        ) : null}
        {notification ? (
          <article className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-pnu-blue">
                {notification.category}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-pnu-muted">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(notification.date).toLocaleDateString(locale)}
              </span>
            </div>
            <h1 className="text-lg font-bold text-pnu-text">{notification.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-pnu-muted">{notification.body}</p>
          </article>
        ) : null}
      </div>
    </div>
  )
}
