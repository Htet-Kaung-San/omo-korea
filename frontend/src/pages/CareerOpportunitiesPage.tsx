import { useEffect, useMemo, useState } from 'react'
import { Filter, Search, SlidersHorizontal } from 'lucide-react'
import { api } from '@/api'
import { CareerJobRow } from '@/components/career/CareerJobRow'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'
import { useCareerRecommendations } from '@/hooks/useCareerRecommendations'
import type { CareerJobType, CareerOpportunity } from '@/types/api'
import { matchesCareerQuery, matchesCareerType } from '@/utils/career'
import { useSavedJobs } from '@/utils/savedJobs'

const LATEST_PAGE_SIZE = 20

const FILTERS: Array<{ id: CareerJobType | 'all'; labelKey: string }> = [
  { id: 'all', labelKey: 'career.filterAll' },
  { id: 'internship', labelKey: 'career.filterInternship' },
  { id: 'part-time', labelKey: 'career.filterPartTime' },
  { id: 'full-time', labelKey: 'career.filterFullTime' },
  { id: 'volunteer', labelKey: 'career.filterVolunteer' },
]

export function CareerOpportunitiesPage() {
  const { t } = useLanguage()
  const { isSaved, toggle } = useSavedJobs()
  const {
    items: recommended,
    loading: recommendedLoading,
    error: recommendedError,
  } = useCareerRecommendations()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CareerJobType | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sortByDeadline, setSortByDeadline] = useState(false)
  const [showAllRecommended, setShowAllRecommended] = useState(false)
  const [showAllLatest, setShowAllLatest] = useState(false)

  const [latest, setLatest] = useState<CareerOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    api
      .getCareerOpportunities({ page: 1, limit: LATEST_PAGE_SIZE })
      .then((response) => {
        if (!cancelled) setLatest(response.opportunities)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('career.loadError'))
          setLatest([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [t])

  const filteredRecommended = useMemo(() => {
    return recommended.filter(
      (item) => matchesCareerQuery(item, query) && matchesCareerType(item, filter),
    )
  }, [recommended, query, filter])

  const filteredLatest = useMemo(() => {
    let items = latest.filter(
      (item) => matchesCareerQuery(item, query) && matchesCareerType(item, filter),
    )
    if (sortByDeadline) {
      items = [...items].sort((a, b) => a.deadline.localeCompare(b.deadline))
    }
    return items
  }, [latest, query, filter, sortByDeadline])

  const visibleRecommended = showAllRecommended
    ? filteredRecommended
    : filteredRecommended.slice(0, 3)
  const visibleLatest = showAllLatest ? filteredLatest : filteredLatest.slice(0, 5)

  return (
    <div className="pb-6">
      <PageHeader title={t('career.title')} back />

      <div className="space-y-5 px-4 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-black/5">
            <Search className="h-4 w-4 shrink-0 text-pnu-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('career.searchPlaceholder')}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-pnu-text outline-none placeholder:text-pnu-muted"
            />
          </div>
          <button
            type="button"
            aria-label={t('career.openFilters')}
            aria-pressed={showFilters}
            onClick={() => setShowFilters((open) => !open)}
            className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 transition ${
              showFilters
                ? 'bg-[#F97316] text-white ring-[#F97316]'
                : 'bg-white text-pnu-muted ring-black/5'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {showFilters ? (
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
            <label className="flex items-center gap-2 text-[13px] text-pnu-text">
              <Filter className="h-4 w-4 text-[#F97316]" />
              <input
                type="checkbox"
                checked={sortByDeadline}
                onChange={(e) => setSortByDeadline(e.target.checked)}
                className="rounded border-pnu-border"
              />
              {t('career.sortByDeadline')}
            </label>
          </div>
        ) : null}

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((item) => {
            const active = filter === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                  active
                    ? 'bg-[#F97316] text-white shadow-sm shadow-orange-200'
                    : 'bg-[#F2F2F7] text-pnu-text'
                }`}
              >
                {t(item.labelKey)}
              </button>
            )
          })}
        </div>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <div>
              <h2 className="text-[16px] font-bold text-pnu-text">AI-Assisted Career Matches</h2>
              <p className="mt-0.5 text-[12px] text-pnu-muted">
                Profile and major fit are prioritized. When major-specific roles are limited, general entry-level opportunities are included.
              </p>
            </div>
            {filteredRecommended.length > 3 ? (
              <button
                type="button"
                onClick={() => setShowAllRecommended((v) => !v)}
                className="text-[13px] font-semibold text-pnu-blue"
              >
                {showAllRecommended ? t('career.showLess') : t('career.viewAll')}
              </button>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-black/5">
            {recommendedLoading ? (
              <p className="px-4 py-6 text-center text-sm text-pnu-muted">{t('career.loading')}</p>
            ) : recommendedError ? (
              <p className="px-4 py-6 text-center text-sm text-rose-600">{recommendedError}</p>
            ) : visibleRecommended.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-pnu-muted">
                {t('career.noRecommendations')}
              </p>
            ) : (
              <div className="divide-y divide-pnu-border/80">
                {visibleRecommended.map((opportunity) => (
                  <CareerJobRow
                    key={`rec-${opportunity.id}`}
                    opportunity={opportunity}
                    variant="recommended"
                    bookmarked={isSaved(opportunity.id)}
                    onToggleBookmark={toggle}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-[16px] font-bold text-pnu-text">{t('career.latest')}</h2>
            {filteredLatest.length > 5 ? (
              <button
                type="button"
                onClick={() => setShowAllLatest((v) => !v)}
                className="text-[13px] font-semibold text-pnu-blue"
              >
                {showAllLatest ? t('career.showLess') : t('career.viewAll')}
              </button>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-black/5">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-pnu-muted">{t('career.loading')}</p>
            ) : visibleLatest.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-pnu-muted">{t('career.noResults')}</p>
            ) : (
              <div className="divide-y divide-pnu-border/80">
                {visibleLatest.map((opportunity) => (
                  <CareerJobRow
                    key={`latest-${opportunity.id}`}
                    opportunity={opportunity}
                    variant="latest"
                    bookmarked={isSaved(opportunity.id)}
                    onToggleBookmark={toggle}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}


