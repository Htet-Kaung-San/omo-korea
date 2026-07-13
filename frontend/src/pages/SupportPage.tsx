import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { supportCards } from '@/data/support'

export function SupportPage() {
  const { t } = useLanguage()

  return (
    <div>
      <PageHeader title={t('support.title')} subtitle={t('support.subtitle')} />

      <div className="space-y-3 px-5 py-5">
        {supportCards.map(({ id, title, description, path, icon: Icon }) => (
          <Link
            key={id}
            to={path}
            className="flex items-center gap-3 rounded-2xl border border-pnu-border bg-white p-4 shadow-sm transition hover:border-pnu-blue-light/50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-pnu-blue">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-pnu-text">{title}</span>
              <span className="mt-1 block text-sm text-pnu-muted">{description}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-pnu-muted" />
          </Link>
        ))}
      </div>
    </div>
  )
}
