import { sessionStore } from '@/features/auth/store/sessionStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, ...rest } = options

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    // On the login page the 401 is an expected "wrong credentials" response — don't redirect.
    // Anywhere else a 401 means the session expired.
    if (window.location.pathname !== '/login') {
      sessionStore.getState().clearUser()
      window.location.href = '/login'
    }
    const errorData = await res.json().catch(() => ({}))
    throw Object.assign(
      new Error(errorData.error ?? 'No autenticado.'),
      { statusCode: 401 },
    )
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw Object.assign(
      new Error(errorData.error ?? errorData.message ?? 'Error inesperado'),
      { statusCode: res.status },
    )
  }

  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('text/csv')) {
    return res.blob() as unknown as T
  }

  if (res.status === 204) return undefined as unknown as T

  return res.json()
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
