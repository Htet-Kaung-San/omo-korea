import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
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

        {!loading && !error && programs.length === 0 ? (
          <p className="text-sm text-pnu-muted">{t('academic.noPrograms')}</p>
        ) : null}

        {programs.map((program) => {
          const Icon = getProgramIconForItem(program)
          return (
            <article key={program.id} className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-pnu-blue">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/academic/programs/${program.id}`}
                    className="text-sm font-bold text-pnu-text hover:text-pnu-blue-light"
                  >
                    {program.title}
                  </Link>
                  {program.category ? (
                    <p className="mt-0.5 text-xs font-medium text-pnu-muted">{program.category}</p>
                  ) : null}
                  {program.date ? (
                    <p className="mt-2 text-xs font-semibold text-pnu-blue-light">{program.date}</p>
                  ) : null}
                  {program.sourceUrl ? (
                    <a
                      href={program.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-pnu-blue-light hover:bg-blue-100"
                    >
                      {t('academic.viewAnnouncement')}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
