import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'

interface CampusGuidePageProps {
  titleKey: string
  bodyKey: string
}

export function CampusGuidePage({ titleKey, bodyKey }: CampusGuidePageProps) {
  const { t } = useLanguage()

  return (
    <div>
      <PageHeader title={t(titleKey)} subtitle={t('campusLife.guideSubtitle')} back />
      <div className="px-5 py-5">
        <div className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
          <p className="text-sm leading-relaxed text-pnu-muted">{t(bodyKey)}</p>
        </div>
      </div>
    </div>
  )
}
