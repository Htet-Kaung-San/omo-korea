import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { LanguageSelect } from './LanguageSelect'
import { useLanguage } from '@/context/LanguageContext'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  action?: ReactNode
  showLanguagePicker?: boolean
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
  showLanguagePicker = true,
}: PageHeaderProps) {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <header className="border-b border-pnu-border/70 bg-transparent px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {back ? (
            <button
              type="button"
              aria-label={t('common.goBack')}
              onClick={() => navigate(-1)}
              className="mt-0.5 rounded-xl bg-white p-1.5 text-pnu-muted shadow-sm ring-1 ring-pnu-border transition hover:text-pnu-blue"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-bold tracking-tight text-pnu-text">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-sm leading-snug text-pnu-muted">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showLanguagePicker ? <LanguageSelect /> : null}
          {action}
        </div>
      </div>
    </header>
  )
}
