import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarDays, ExternalLink, Sparkles } from 'lucide-react'
import { api } from '@/api'
import type { ProgramItem } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { getProgramIconForItem } from '@/utils/programIcons'

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

  const Icon = program ? getProgramIconForItem(program) : Sparkles

  return (
    <div className="min-h-full bg-pnu-surface">
      <PageHeader title={t('academic.programs')} back />

      <div className="px-5 pb-10 pt-2">
        {error ? (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        ) : null}

        {loading ? (
          <p className="text-sm text-pnu-muted">{t('academic.loading')}</p>
        ) : null}

        {!loading && !program && !error ? (
          <p className="text-sm text-pnu-muted">{t('common.errorFallback')}</p>
        ) : null}

        {program ? (
          <article className="max-w-none">
            <header className="border-b border-pnu-border/70 pb-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {program.category ? (
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-pnu-blue-light">
                    {program.category}
                  </span>
                ) : null}
                {program.matchHint ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600">
                    <Sparkles className="h-3 w-3" strokeWidth={2.2} />
                    {t('academic.recommendedForYou')}
                  </span>
                ) : null}
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center text-pnu-blue">
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <h1 className="text-[22px] font-bold leading-snug tracking-tight text-pnu-text">
                    {program.title}
                  </h1>
                  {program.date ? (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-pnu-muted">
                      <CalendarDays className="h-4 w-4 shrink-0 text-pnu-blue-light" strokeWidth={1.9} />
                      <span>{t('scholarships.deadline')}</span>
                      <span className="text-pnu-text">{program.date}</span>
                    </p>
                  ) : null}
                </div>
              </div>

              {program.matchHint ? (
                <p className="mt-4 text-[13px] leading-relaxed text-pnu-muted">{program.matchHint}</p>
              ) : null}
            </header>

            <section className="py-6">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-pnu-muted">
                {t('academic.programDetails')}
              </h2>
              {program.description?.trim() ? (
                <div className="mt-4 whitespace-pre-wrap text-[15px] leading-[1.75] text-pnu-text">
                  {program.description}
                </div>
              ) : (
                <p className="mt-4 text-[14px] leading-relaxed text-pnu-muted">
                  {t('academic.noProgramDescription')}
                </p>
              )}
            </section>

            {program.sourceUrl ? (
              <footer className="border-t border-pnu-border/70 pt-5">
                <a
                  href={program.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[14px] font-semibold text-pnu-blue transition hover:text-pnu-blue-light"
                >
                  {t('academic.viewAnnouncement')}
                  <ExternalLink className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                </a>
              </footer>
            ) : null}
          </article>
        ) : null}
      </div>
    </div>
  )
}
