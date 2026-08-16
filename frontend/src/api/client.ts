import type { ApiError } from '@/types/api'
import { emitToast } from '@/context/ToastContext'
import { getAcceptLanguage } from './headers'
import { clearSessionUser } from './real/session'

const TOKEN_KEY = 'hey_pnu_token'
export const AUTH_SESSION_CLEARED_EVENT = 'hey_pnu_auth_session_cleared'

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

export interface StreamHandlers {
  /** Called for each token as it arrives. */
  onText: (chunk: string) => void
  /** Called once with the trailing metadata frame, before the stream closes. */
  onMetadata?: (metadata: Record<string, unknown>) => void
  signal?: AbortSignal
}

/**
 * POST to a Server-Sent Events endpoint and surface tokens as they arrive.
 *
 * Kept separate from apiFetch because that helper parses a JSON body and would
 * buffer the whole response, which defeats the point. Auth, base URL and
 * language headers are resolved identically so the two stay in step.
 *
 * Frames arrive as `data: {...}` lines carrying {text}, {metadata} or {error}.
 * A frame can be split across network chunks, so the trailing partial line is
 * held back and prepended to the next chunk rather than being parsed as-is.
 */
export async function apiStream(
  path: string,
  body: unknown,
  handlers: StreamHandlers,
): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'
  const token = getStoredToken()

  const headers = new Headers({ 'Content-Type': 'application/json' })
  headers.set('Accept-Language', getAcceptLanguage())
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: handlers.signal,
  })

  if (!response.ok || !response.body) {
    throw new HttpError(
      `Request failed with status ${response.status}`,
      response.status,
    )
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue

      const payload = trimmed.slice(6)
      if (payload === '[DONE]') return

      try {
        const frame = JSON.parse(payload) as {
          text?: string
          metadata?: Record<string, unknown>
          error?: string
        }
        if (frame.error) throw new HttpError(frame.error)
        if (frame.text) handlers.onText(frame.text)
        if (frame.metadata) handlers.onMetadata?.(frame.metadata)
      } catch (err) {
        // A malformed frame should not abort a good stream, but an explicit
        // error frame must propagate.
        if (err instanceof HttpError) throw err
      }
    }
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
      window.dispatchEvent(new Event(AUTH_SESSION_CLEARED_EVENT))
    }

    if (!suppressToast) emitToast(message, 'error')
    throw new HttpError(message, response.status, code)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
