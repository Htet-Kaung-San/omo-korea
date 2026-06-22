import type { HeyPnuApi } from '@/types/api'
import { mockApi } from './mock'
import { realApi } from './real'

const mode = import.meta.env.VITE_API_MODE ?? 'mock'

/** Single entry point — swap mock ↔ real via VITE_API_MODE in .env */
export const api: HeyPnuApi = mode === 'real' ? realApi : mockApi

export { clearStoredToken, getStoredToken, setStoredToken, HttpError } from './client'
export { DEMO_STUDENT_ID, DEMO_PASSWORD } from './mock'
