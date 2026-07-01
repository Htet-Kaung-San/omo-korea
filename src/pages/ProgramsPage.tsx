import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { programs } from '@/data/academic'

export function ProgramsPage() {
  const { t } = useLanguage()

  return (
    <div>
      <PageHeader title={t('academic.programs')} subtitle={t('academic.programsSubtitle')} back />

      <div className="space-y-3 px-5 py-5">
        {programs.map(({ id, icon: Icon, title, description, date }) => (
          <article key={id} className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-pnu-blue">
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <Link
                  to={`/academic/programs/${id}`}
                  className="text-sm font-bold text-pnu-text hover:text-pnu-blue-light"
                >
                  {title}
                </Link>
                <p className="mt-1 text-sm leading-relaxed text-pnu-muted">{description}</p>
                <p className="mt-2 text-xs font-semibold text-pnu-blue-light">{date}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
