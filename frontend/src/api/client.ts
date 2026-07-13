import type { ApiError } from '@/types/api'
import { emitToast } from '@/context/ToastContext'
import { getAcceptLanguage } from './headers'
import { clearSessionUser } from './real/session'

const TOKEN_KEY = 'hey_pnu_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export class HttpError extends Error implements ApiError {
  status?: number
  code?: string

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

interface ErrorBody {
  success?: false
  message?: string
  error?: {
    status?: number
    code?: string
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { suppressToast?: boolean } = {},
): Promise<T> {
  const { suppressToast, ...fetchOptions } = options
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'
  const token = getStoredToken()

  const headers = new Headers(fetchOptions.headers)
  if (!headers.has('Content-Type') && fetchOptions.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', getAcceptLanguage())
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...fetchOptions,
      headers,
    })
  } catch {
    const message = 'Network error. Check that the API server is running.'
    if (!suppressToast) emitToast(message, 'error')
    throw new HttpError(message, 0, 'NETWORK_ERROR')
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    let code = 'HTTP_ERROR'

    try {
      const body = (await response.json()) as ErrorBody
      if (body.message) message = body.message
      if (body.error?.code) code = body.error.code
    } catch {
      // ignore parse errors
    }

    if (response.status === 401) {
      clearStoredToken()
      clearSessionUser()
    }

    if (!suppressToast) emitToast(message, 'error')
    throw new HttpError(message, response.status, code)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
