/* ═══════════════════════════════════════
 * 도토리 — API Client
 * Typed fetch wrapper with CSRF + session cookies
 * ═══════════════════════════════════════ */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'
const FALLBACK_API_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: unknown,
  ) {
    super(`API Error ${status}: ${statusText}`)
    this.name = 'ApiError'
  }
}

interface RequestConfig extends Omit<RequestInit, 'body'> {
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
}

function buildUrl(path: string, params?: RequestConfig['params']): string {
  const origin = typeof window === 'undefined' ? FALLBACK_API_ORIGIN : window.location.origin
  const normalizedApiBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
  const normalizedPath = `${normalizedApiBase}${path.startsWith('/') ? path : `/${path}`}`
  const url = new URL(normalizedPath, origin)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

function getCsrfToken(): string {
  if (typeof document === 'undefined') return ''
  return (
    document.cookie
      .split('; ')
      .find((c) => c.startsWith('csrf-token='))
      ?.split('=')[1] ?? ''
  )
}

async function request<T>(path: string, config: RequestConfig = {}): Promise<T> {
  const { body, params, headers: customHeaders, ...rest } = config

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-csrf-token': getCsrfToken(),
    ...customHeaders,
  }

  const response = await fetch(buildUrl(path, params), {
    ...rest,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new ApiError(response.status, response.statusText, errorBody)
  }

  // Handle 204 No Content
  if (response.status === 204) return undefined as T

  return response.json()
}

/* ─── Typed Methods ─── */
export const api = {
  get: <T>(path: string, params?: RequestConfig['params']) => request<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),

  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
