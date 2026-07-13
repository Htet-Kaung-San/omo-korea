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
    <header className="sticky top-0 z-10 border-b border-pnu-border bg-pnu-surface/95 px-5 py-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {back ? (
            <button
              type="button"
              aria-label={t('common.goBack')}
              onClick={() => navigate(-1)}
              className="mt-0.5 rounded-lg p-1 text-pnu-muted hover:bg-white hover:text-pnu-text"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-pnu-text">{title}</h1>
            {subtitle ? <p className="mt-0.5 text-sm text-pnu-muted">{subtitle}</p> : null}
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
