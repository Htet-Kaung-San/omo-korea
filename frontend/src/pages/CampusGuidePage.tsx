import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { CafeteriaMenuView } from '@/components/cafeteria/CafeteriaMenuView'
import { useLanguage } from '@/context/LanguageContext'
import { api } from '@/api'
import type { CampusFacilities } from '@/types/api'

interface CampusGuidePageProps {
  titleKey: string
  bodyKey: string
  facilitiesMode?: 'cafeteria' | 'shuttle'
}

export function CampusGuidePage({ titleKey, bodyKey, facilitiesMode }: CampusGuidePageProps) {
  const { language, t } = useLanguage()
  const [facilities, setFacilities] = useState<CampusFacilities | null>(null)
  const [loading, setLoading] = useState(Boolean(facilitiesMode))
  const [error, setError] = useState('')
  const [menuDate, setMenuDate] = useState<string | undefined>(undefined)

  const loadFacilities = useCallback(
    (nextMenuDate?: string) => {
      if (!facilitiesMode) return

      setLoading(true)
      setError('')

      api
        .getCampusFacilities(nextMenuDate ? { menuDate: nextMenuDate } : undefined)
        .then(setFacilities)
        .catch((err) => setError(err instanceof Error ? err.message : t('common.errorFallback')))
        .finally(() => setLoading(false))
    },
    [facilitiesMode, t],
  )

  useEffect(() => {
    if (!facilitiesMode) return
    loadFacilities(menuDate)
  }, [facilitiesMode, language, loadFacilities, menuDate])

  const shuttleStops = facilities?.shuttle_bus_metadata.key_stops ?? []

  return (
    <div>
      <PageHeader title={t(titleKey)} subtitle={t('campusLife.guideSubtitle')} back />
      <div className="space-y-4 px-5 py-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        {!facilitiesMode ? (
          <div className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
            <p className="text-sm leading-relaxed text-pnu-muted">{t(bodyKey)}</p>
          </div>
        ) : null}

        {facilitiesMode === 'cafeteria' && facilities ? (
          <>
            {loading ? <p className="text-sm text-pnu-muted">{t('common.loading')}</p> : null}
            <CafeteriaMenuView
              cafeterias={facilities.cafeterias}
              loading={loading}
              onWeekChange={setMenuDate}
            />
          </>
        ) : null}

        {facilitiesMode === 'cafeteria' && loading && !facilities ? (
          <p className="text-sm text-pnu-muted">{t('common.loading')}</p>
        ) : null}

        {facilitiesMode === 'shuttle' && !loading
          ? shuttleStops.map((stop) => (
              <article key={stop.id} className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
                <h2 className="text-sm font-bold text-pnu-text">{stop.name}</h2>
                {stop.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-pnu-muted">{stop.description}</p>
                ) : null}
              </article>
            ))
          : null}
      </div>
    </div>
  )
}
