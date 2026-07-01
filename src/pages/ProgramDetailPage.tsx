import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { programs } from '@/data/academic'
import { useLanguage } from '@/context/LanguageContext'

export function ProgramDetailPage() {
  const { programId } = useParams()
  const { t } = useLanguage()
  const program = programs.find((item) => item.id === programId)

  return (
    <div>
      <PageHeader title={program?.title ?? t('academic.programs')} back />
      <div className="px-5 py-5">
        {program ? (
          <article className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-pnu-blue">
                <program.icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-pnu-text">{program.title}</h1>
                <p className="mt-2 text-sm leading-relaxed text-pnu-muted">{program.description}</p>
                <p className="mt-3 text-sm font-bold text-pnu-blue-light">{program.date}</p>
              </div>
            </div>
          </article>
        ) : (
          <p className="text-sm text-pnu-muted">{t('common.errorFallback')}</p>
        )}
      </div>
    </div>
  )
}
