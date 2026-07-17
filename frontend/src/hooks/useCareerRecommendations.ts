import { useEffect, useState } from 'react'
import { api } from '@/api'
import type { CareerOpportunity } from '@/types/api'

/**
 * AI recommendation hook-point for Internships & Jobs.
 *
 * AI engineers: implement ranking in `api.getRecommendedCareerOpportunities()`
 * (real backend: GET /students/career-recommendations). This hook only loads
 * and exposes that list — keep UI wiring here, keep ranking logic in the API.
 */
export function useCareerRecommendations() {
  const [items, setItems] = useState<CareerOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    api
      .getRecommendedCareerOpportunities()
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load recommendations')
          setItems([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { items, loading, error }
}
