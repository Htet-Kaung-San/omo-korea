import { ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'

export function AssignmentsPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-full bg-[#F5F7FB]">
      <PageHeader title={t('schedule.assignments')} subtitle={t('schedule.assignmentsSubtitle')} back />
      <div className="px-4 py-5">
        <section className="flex min-h-48 flex-col items-center justify-center rounded-2xl bg-white px-5 text-center shadow-sm ring-1 ring-black/5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pnu-blue/10 text-pnu-blue">
            <ClipboardList className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-sm font-bold text-pnu-text">{t('schedule.assignmentsEmpty')}</h2>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-pnu-muted">{t('schedule.assignmentsHelp')}</p>
        </section>
      </div>
    </div>
  )
}
