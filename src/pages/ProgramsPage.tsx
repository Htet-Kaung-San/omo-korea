import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import type { ProgramItem } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { getProgramIconForItem } from '@/utils/programIcons'

export function ProgramsPage() {
  const { language, t } = useLanguage()
  const [programs, setPrograms] = useState<ProgramItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getPrograms()
      .then(setPrograms)
      .catch((err) => setError(err instanceof Error ? err.message : t('academic.loadError')))
      .finally(() => setLoading(false))
  }, [language, t])

  return (
    <div>
      <PageHeader title={t('academic.programs')} subtitle={t('academic.programsSubtitle')} back />

      <div className="space-y-3 px-5 py-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}
        {loading ? <p className="text-sm text-pnu-muted">{t('academic.loading')}</p> : null}

        {programs.map((program) => {
          const Icon = getProgramIconForItem(program)
          return (
            <article key={program.id} className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-pnu-blue">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <Link
                    to={`/academic/programs/${program.id}`}
                    className="text-sm font-bold text-pnu-text hover:text-pnu-blue-light"
                  >
                    {program.title}
                  </Link>
                  <p className="mt-1 text-sm leading-relaxed text-pnu-muted">{program.description}</p>
                  <p className="mt-2 text-xs font-semibold text-pnu-blue-light">{program.date}</p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
