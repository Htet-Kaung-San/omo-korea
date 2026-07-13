import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import type { ScholarshipItem } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLanguage } from '@/context/LanguageContext'

export function ScholarshipsPage() {
  const { language, t } = useLanguage()
  const [scholarships, setScholarships] = useState<ScholarshipItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getScholarships()
      .then(setScholarships)
      .catch((err) => setError(err instanceof Error ? err.message : t('academic.loadError')))
      .finally(() => setLoading(false))
  }, [language, t])

  return (
    <div>
      <PageHeader title={t('academic.scholarships')} subtitle={t('academic.scholarshipsSubtitle')} back />

      <div className="space-y-3 px-5 py-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}
        {loading ? <p className="text-sm text-pnu-muted">{t('academic.loading')}</p> : null}

        {scholarships.map((scholarship) => (
          <article key={scholarship.id} className="rounded-2xl border border-pnu-border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <Link
                to={`/academic/scholarships/${scholarship.id}`}
                className="text-sm font-bold text-pnu-text hover:text-pnu-blue-light"
              >
                {scholarship.title}
              </Link>
              <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                {scholarship.deadline}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-pnu-muted">{scholarship.description}</p>
            <div className="mt-3 rounded-xl bg-pnu-surface px-3 py-2">
              <p className="text-xs font-semibold text-pnu-text">{t('academic.eligibility')}</p>
              <p className="mt-1 text-xs leading-relaxed text-pnu-muted">{scholarship.eligibility}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
