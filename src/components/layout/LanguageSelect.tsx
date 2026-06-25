import { Globe } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export function LanguageSelect() {
  const { language, options, setLanguage, t } = useLanguage()

  return (
    <label className="inline-flex items-center gap-1.5 rounded-xl border border-pnu-border bg-white px-2.5 py-1 text-xs font-medium text-pnu-muted">
      <Globe className="h-3.5 w-3.5" />
      <span className="sr-only">{t('auth.selectLanguage')}</span>
      <select
        value={language}
        aria-label={t('auth.selectLanguage')}
        onChange={(event) => setLanguage(event.target.value as typeof language)}
        className="bg-transparent text-xs font-semibold text-pnu-text outline-none"
      >
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.code}
          </option>
        ))}
      </select>
    </label>
  )
}
