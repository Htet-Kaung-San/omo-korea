import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'

export function CampusLifePage() {
  const { t } = useLanguage()

  return (
    <div>
      <PageHeader title={t('campusLife.title')} subtitle={t('campusLife.subtitle')} />
      <div className="px-5 py-6">
        <div className="rounded-2xl border border-dashed border-pnu-border bg-white/70 px-4 py-4">
          <p className="text-sm text-pnu-muted">{t('campusLife.placeholder')}</p>
        </div>
      </div>
    </div>
  )
}
