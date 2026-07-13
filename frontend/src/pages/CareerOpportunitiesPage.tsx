import { useEffect, useState } from 'react'
import { Briefcase, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { api } from '@/api'
import type { CareerOpportunitiesResponse } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'

const PAGE_SIZE = 10

export function CareerOpportunitiesPage() {
  const { t } = useLanguage()
  const [page, setPage] = useState(1)
  const [data, setData] = useState<CareerOpportunitiesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError('')

    api
      .getCareerOpportunities({ page, limit: PAGE_SIZE })
      .then((response) => {
        if (!cancelled) {
          setData(response)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('career.loadError'))
          setData(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [page, t])

  const pagination = data?.pagination

  return (
    <div>
      <PageHeader title={t('career.title')} subtitle={t('career.subtitle')} back />

      <div className="space-y-4 px-5 py-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        {loading ? <p className="text-sm text-pnu-muted">{t('career.loading')}</p> : null}

        {!loading && data ? (
          <>
            <section className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-pnu-muted">
                    {t('career.sourceLabel')}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-pnu-text">
                    {t('career.totalCount', { count: pagination?.totalItems ?? 0 })}
                  </p>
                </div>
                <a
                  href={data.source}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-pnu-blue-light hover:bg-blue-100"
                >
                  {t('career.viewSource')}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>

              {data.careers.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-pnu-text">{t('career.topRoles')}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.careers.slice(0, 6).map((career) => (
                      <span
                        key={career.name}
                        className="rounded-full bg-pnu-surface px-2.5 py-1 text-xs font-medium text-pnu-muted"
                      >
                        {career.name} ({career.count})
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            {data.opportunities.length === 0 ? (
              <p className="text-sm text-pnu-muted">{t('career.noResults')}</p>
            ) : (
              data.opportunities.map((opportunity) => (
                <article
                  key={opportunity.id}
                  className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                      <Briefcase className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-pnu-blue-light">{opportunity.company}</p>
                          <h2 className="mt-1 text-sm font-bold text-pnu-text">{opportunity.title}</h2>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                          {opportunity.deadline}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-pnu-muted">
                        {opportunity.role ? (
                          <span className="rounded-full bg-pnu-surface px-2 py-0.5 font-medium text-pnu-text">
                            {t('career.role')}: {opportunity.role}
                          </span>
                        ) : null}
                        {opportunity.applicationType ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                            {opportunity.applicationType}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}

            {pagination && pagination.totalPages > 1 ? (
              <div className="flex items-center justify-between rounded-2xl border border-pnu-border bg-white px-4 py-3 shadow-sm">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={!pagination.hasPrevPage || loading}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-pnu-text enabled:hover:bg-pnu-surface disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  {t('career.prev')}
                </button>

                <p className="text-sm font-medium text-pnu-muted">
                  {t('career.pageInfo', {
                    page: pagination.page,
                    totalPages: pagination.totalPages,
                  })}
                </p>

                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-pnu-text enabled:hover:bg-pnu-surface disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t('career.next')}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
