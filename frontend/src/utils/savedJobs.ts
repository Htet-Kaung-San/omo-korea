import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CareerOpportunity } from '@/types/api'

export const SAVED_JOBS_KEY = 'hey_pnu_saved_jobs'
export const SAVED_JOBS_EVENT = 'hey_pnu_saved_jobs_changed'

function isCareerOpportunity(value: unknown): value is CareerOpportunity {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.company === 'string' &&
    typeof item.sourceUrl === 'string' &&
    typeof item.deadline === 'string'
  )
}

export function loadSavedJobs(): CareerOpportunity[] {
  try {
    const raw = localStorage.getItem(SAVED_JOBS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isCareerOpportunity)
  } catch {
    return []
  }
}

function persistSavedJobs(jobs: CareerOpportunity[]) {
  localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(jobs))
  window.dispatchEvent(new Event(SAVED_JOBS_EVENT))
}

export function toggleSavedJob(opportunity: CareerOpportunity): CareerOpportunity[] {
  const current = loadSavedJobs()
  const exists = current.some((job) => job.id === opportunity.id)
  const next = exists
    ? current.filter((job) => job.id !== opportunity.id)
    : [
        {
          id: opportunity.id,
          source: opportunity.source,
          company: opportunity.company,
          title: opportunity.title,
          deadline: opportunity.deadline,
          role: opportunity.role,
          applicationType: opportunity.applicationType,
          sourceUrl: opportunity.sourceUrl,
          location: opportunity.location ?? null,
          jobType: opportunity.jobType ?? null,
          logoUrl: opportunity.logoUrl ?? null,
          matchReason: opportunity.matchReason ?? null,
        },
        ...current,
      ]
  persistSavedJobs(next)
  return next
}

export function useSavedJobs() {
  const [saved, setSaved] = useState<CareerOpportunity[]>(() => loadSavedJobs())

  useEffect(() => {
    const refresh = () => setSaved(loadSavedJobs())
    const onStorage = (event: StorageEvent) => {
      if (event.key === SAVED_JOBS_KEY) refresh()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(SAVED_JOBS_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(SAVED_JOBS_EVENT, refresh)
    }
  }, [])

  const savedIds = useMemo(() => new Set(saved.map((job) => job.id)), [saved])

  const toggle = useCallback((opportunity: CareerOpportunity) => {
    setSaved(toggleSavedJob(opportunity))
  }, [])

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds])

  return { saved, savedIds, toggle, isSaved }
}
