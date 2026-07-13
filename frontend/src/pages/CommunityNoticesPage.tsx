import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'

interface CommunityNoticesPageProps {
  titleKey: string
  descriptionKey: string
}

export function CommunityNoticesPage({ titleKey, descriptionKey }: CommunityNoticesPageProps) {
  const { t } = useLanguage()

  return (
    <div>
      <PageHeader title={t(titleKey)} subtitle={t('community.noticeSubtitle')} back />
      <div className="px-5 py-5">
        <div className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
          <p className="text-sm leading-relaxed text-pnu-muted">{t(descriptionKey)}</p>
        </div>
      </div>
    </div>
  )
}
