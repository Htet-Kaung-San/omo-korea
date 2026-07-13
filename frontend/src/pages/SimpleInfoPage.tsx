import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'

interface SimpleInfoPageProps {
  titleKey: string
  subtitleKey: string
  bodyKey: string
}

export function SimpleInfoPage({ titleKey, subtitleKey, bodyKey }: SimpleInfoPageProps) {
  const { t } = useLanguage()

  return (
    <div>
      <PageHeader title={t(titleKey)} subtitle={t(subtitleKey)} />
      <div className="px-5 py-5">
        <div className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
          <p className="text-sm leading-relaxed text-pnu-muted">{t(bodyKey)}</p>
        </div>
      </div>
    </div>
  )
}
