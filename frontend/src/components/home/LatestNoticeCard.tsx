import { Link } from 'react-router-dom'
import { ChevronRight, Sparkles } from 'lucide-react'
import type { Notification } from '@/types/api'
import { useLanguage } from '@/context/LanguageContext'

interface LatestNoticeCardProps {
  notice: Notification | null
}

export function LatestNoticeCard({ notice }: LatestNoticeCardProps) {
  const { t } = useLanguage()

  if (!notice) {
    return (
      <section>
        <h2 className="mb-3 text-[17px] font-semibold tracking-tight text-pnu-text">
          {t('home.latestNotice')}
        </h2>
        <div className="rounded-[20px] bg-white px-4 py-5 text-sm text-pnu-muted shadow-sm ring-1 ring-black/5">
          {t('home.noNotifications')}
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold tracking-tight text-pnu-text">
          {t('home.latestNotice')}
        </h2>
        <Link
          to="/notifications"
          className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-pnu-blue"
        >
          {t('common.viewAll')}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <Link
        to={`/notifications/${notice.id}`}
        className="block rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/5 transition active:scale-[0.99]"
      >
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-pnu-blue/8 px-2.5 py-1 text-[11px] font-semibold text-pnu-blue">
          <Sparkles className="h-3.5 w-3.5" />
          {t('home.aiSummary')}
        </div>
        <p className="text-[15px] font-semibold text-pnu-text">{notice.title}</p>
        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-pnu-muted">
          {notice.body}
        </p>
        <p className="mt-3 text-[11px] font-medium text-pnu-muted">{notice.date}</p>
      </Link>
    </section>
  )
}
