import type { Notification } from '@/types/api'
import { Card } from '@/components/ui/Card'
import { Bell, CalendarDays } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function NotificationCard({ notification }: { notification: Notification }) {
  const { locale, t } = useLanguage()
  const isHigh = notification.priority === 'HIGH'

  return (
    <Card className={isHigh ? 'border-amber-200 bg-amber-50/40' : ''}>
      <div className="flex gap-3">
        <div
          className={[
            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            isHigh ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-pnu-blue-light',
          ].join(' ')}
        >
          <Bell className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-pnu-text">{notification.title}</h3>
            {isHigh ? (
              <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                {t('common.high')}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-pnu-muted">{notification.body}</p>
          <p className="mt-2 flex items-center gap-1 text-xs text-pnu-muted">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(notification.date, locale)}
          </p>
        </div>
      </div>
    </Card>
  )
}
