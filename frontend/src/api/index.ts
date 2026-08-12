import type { HeyPnuApi } from '@/types/api'
import { realApi } from './real'
import { clearStoredToken } from './client'
import { clearSessionUser } from './real/session'

/** This branch always talks to the real backend (mock API removed). */
export const isMockApi = false

/** Primary API instance wired directly to the real backend */
export const api: HeyPnuApi = realApi

export function clearAuthSession(): void {
  clearStoredToken()
  clearSessionUser()
}

export { clearStoredToken, getStoredToken, setStoredToken, HttpError } from './client'
