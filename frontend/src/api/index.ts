import type { HeyPnuApi } from '@/types/api'
import { mockApi } from './mock'
import { realApi } from './real'
import { clearStoredToken } from './client'
import { clearSessionUser } from './real/session'

const configuredMode = import.meta.env.VITE_API_MODE ?? 'real'
export const isMockApi = !import.meta.env.PROD && configuredMode === 'mock'

/** Single entry point — swap mock ↔ real via VITE_API_MODE in .env */
export const api: HeyPnuApi = isMockApi ? mockApi : realApi

export function clearAuthSession(): void {
  clearStoredToken()
  clearSessionUser()
}

export { clearStoredToken, getStoredToken, setStoredToken, HttpError } from './client'
export { DEMO_STUDENT_ID, DEMO_PASSWORD } from './mock'
