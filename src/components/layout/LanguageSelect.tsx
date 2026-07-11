import { Globe } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export function LanguageSelect() {
  const { language, options, setLanguage, localeLoading, t } = useLanguage()

  return (
    <label className="inline-flex min-w-[9rem] max-w-[11rem] items-center gap-1.5 rounded-xl border border-pnu-border bg-white px-2.5 py-1 text-xs font-medium text-pnu-muted">
      <Globe className="h-3.5 w-3.5 shrink-0" />
      <span className="sr-only">{t('auth.selectLanguage')}</span>
      <select
        value={language}
        disabled={localeLoading}
        aria-label={t('auth.selectLanguage')}
        onChange={(event) => setLanguage(event.target.value as typeof language)}
        className="min-w-0 flex-1 truncate bg-transparent text-xs font-semibold text-pnu-text outline-none"
      >
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  )
}
