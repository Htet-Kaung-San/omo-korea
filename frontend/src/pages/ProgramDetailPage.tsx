import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ExternalLink, Trophy, Users } from 'lucide-react'
import { api } from '@/api'
import type { ProgramItem } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'

function ProgramDetailIcon({ program }: { program: ProgramItem }) {
  if (program.category?.toLowerCase().includes('club')) {
    return <Users className="h-5 w-5" strokeWidth={1.8} />
  }
  return <Trophy className="h-5 w-5" strokeWidth={1.8} />
}

export function ProgramDetailPage() {
  const { programId } = useParams()
  const { language, t } = useLanguage()
  const [program, setProgram] = useState<ProgramItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getPrograms()
      .then((programs) => setProgram(programs.find((item) => item.id === programId) ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : t('academic.loadError')))
      .finally(() => setLoading(false))
  }, [language, programId, t])

  return (
    <div>
      <PageHeader title={program?.title ?? t('academic.programs')} back />
      <div className="px-5 py-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}
        {loading ? <p className="text-sm text-pnu-muted">{t('academic.loading')}</p> : null}

        {program ? (
          <article className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-pnu-blue">
                <ProgramDetailIcon program={program} />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-pnu-text">{program.title}</h1>
                {program.hostDepartment ? (
                  <p className="mt-1 text-xs font-medium text-pnu-muted">
                    {t('academic.hostDepartment')}: {program.hostDepartment}
                  </p>
                ) : null}
                {program.category ? (
                  <p className="mt-1 text-xs font-semibold text-pnu-blue-light">{program.category}</p>
                ) : null}
                <p className="mt-2 text-sm leading-relaxed text-pnu-muted">{program.description}</p>
                {program.date ? (
                  <p className="mt-3 text-sm font-bold text-pnu-blue-light">{program.date}</p>
                ) : null}
                {program.matchHint ? (
                  <p className="mt-2 text-xs text-pnu-muted">{program.matchHint}</p>
                ) : null}

                <div className="mt-4 flex flex-col gap-2">
                  {program.sourceUrl ? (
                    <a
                      href={program.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-pnu-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-pnu-blue-light"
                    >
                      {t('academic.viewAnnouncement')}
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : null}
                  {program.externalApplyUrl ? (
                    <a
                      href={program.externalApplyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-pnu-border bg-white px-4 py-2.5 text-sm font-semibold text-pnu-text hover:bg-slate-50"
                    >
                      {t('academic.applyExternal')}
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        ) : null}

        {!loading && !program && !error ? (
          <p className="text-sm text-pnu-muted">{t('common.errorFallback')}</p>
        ) : null}
      </div>
    </div>
  )
}
