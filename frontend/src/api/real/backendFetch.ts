import { apiFetch } from '../client'

interface BackendSuccess<T> {
  success: true
  data: T
}

interface BackendListSuccess<T> {
  success: true
  data: T
}

export async function backendFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const body = await apiFetch<BackendSuccess<T> | BackendListSuccess<T>>(path, options)

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('Unexpected backend response shape')
  }

  return body.data
}
