import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/api'
import type { ScholarshipItem } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'

export function ScholarshipDetailPage() {
  const { scholarshipId } = useParams()
  const { language, t } = useLanguage()
  const [scholarship, setScholarship] = useState<ScholarshipItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getScholarships()
      .then((items) => setScholarship(items.find((item) => item.id === scholarshipId) ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : t('academic.loadError')))
      .finally(() => setLoading(false))
  }, [language, scholarshipId, t])

  return (
    <div>
      <PageHeader title={scholarship?.title ?? t('academic.scholarships')} back />
      <div className="px-5 py-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}
        {loading ? <p className="text-sm text-pnu-muted">{t('academic.loading')}</p> : null}

        {scholarship ? (
          <article className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h1 className="text-lg font-bold text-pnu-text">{scholarship.title}</h1>
              <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                {scholarship.deadline}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-pnu-muted">{scholarship.description}</p>
            <div className="mt-4 rounded-xl bg-pnu-surface px-3 py-2">
              <p className="text-xs font-semibold text-pnu-text">{t('academic.eligibility')}</p>
              <p className="mt-1 text-sm leading-relaxed text-pnu-muted">{scholarship.eligibility}</p>
            </div>
          </article>
        ) : null}

        {!loading && !scholarship && !error ? (
          <p className="text-sm text-pnu-muted">{t('common.errorFallback')}</p>
        ) : null}
      </div>
    </div>
  )
}
