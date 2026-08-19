import { apiFetch } from '../client'

export async function backendFetch<T>(
  path: string,
  options: RequestInit & { suppressToast?: boolean } = {},
): Promise<T> {
  const body = await apiFetch<any>(path, options)

  if (!body || typeof body !== 'object') {
    throw new Error('Unexpected backend response shape')
  }

  if ('data' in body) {
    return body.data
  }

  if (body.success) {
    return body as T
  }

  throw new Error('Unexpected backend response shape')
}
