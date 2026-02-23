class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
    public payload?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function parseErrorBody(
  bodyText: string,
  fallbackMessage: string,
): { message: string; code?: string; details?: unknown; payload?: unknown } {
  if (!bodyText) {
    return { message: fallbackMessage }
  }

  try {
    const parsed = JSON.parse(bodyText) as unknown
    if (typeof parsed === 'string') {
      return { message: parsed || fallbackMessage, payload: parsed }
    }

    const record = asRecord(parsed)
    if (!record) {
      return { message: bodyText || fallbackMessage }
    }

    const canonicalError = asRecord(record.error)
    const legacyError = typeof record.error === 'string' ? record.error : undefined
    const message =
      (typeof canonicalError?.message === 'string' && canonicalError.message) ||
      (typeof record.message === 'string' && record.message) ||
      legacyError ||
      bodyText ||
      fallbackMessage
    const code =
      typeof canonicalError?.code === 'string'
        ? canonicalError.code
        : typeof record.code === 'string'
          ? record.code
          : undefined
    const details = canonicalError?.details ?? record.details

    return { message, code, details, payload: parsed }
  } catch {
    return { message: bodyText || fallbackMessage }
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // 클라이언트: 상대 경로 사용 (CORS 방지), 서버: 절대 URL 필요
  const isServer = typeof window === 'undefined'
  const baseUrl = isServer ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' : ''
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const body = await res.text()
    const parsed = parseErrorBody(body, res.statusText)
    throw new ApiError(res.status, parsed.message, parsed.code, parsed.details, parsed.payload)
  }

  return res.json()
}
