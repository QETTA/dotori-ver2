import type { ChatBlock } from '@/types/dotori'

export interface StreamEvent {
  type: 'start' | 'block' | 'text' | 'done' | 'error'
  intent?: string
  block?: ChatBlock
  text?: string
  timestamp?: string
  error?: string
  quick_replies?: string[]
}

export interface StreamErrorPayload {
  isQuotaExceeded: boolean
  message: string
  retryAfterSeconds?: number
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function isRateLimitCode(value: unknown): boolean {
  return value === 'quota_exceeded' || value === 'RATE_LIMITED' || value === 'TOO_MANY_REQUESTS'
}

function hasQuotaDetails(value: unknown): boolean {
  const record = asRecord(value)
  if (!record) {
    return false
  }

  if (typeof record.limitType === 'string' && record.limit !== undefined) {
    return true
  }

  return false
}

function includesQuotaExceeded(details: unknown): boolean {
  const record = asRecord(details)
  if (!record) {
    return false
  }

  const keys = ['reason', 'error', 'code', 'type', 'kind'] as const
  return keys.some((key) => isRateLimitCode(record[key]))
}

function getRetryAfter(response: Response): number | undefined {
  const retryAfter = response.headers.get('Retry-After')
  const parsed = Number.parseInt(retryAfter || '', 10)
  if (Number.isNaN(parsed) || parsed < 0) {
    return undefined
  }
  return parsed
}

export function getStreamErrorPayload(response: Response): Promise<StreamErrorPayload> {
  const fallback = '스트리밍 응답을 받을 수 없습니다.'
  if (!response.headers.get('content-type')?.includes('application/json')) {
    return response
      .text()
      .then((text) => ({
        isQuotaExceeded: false,
        message: text.trim() || fallback,
      }))
      .catch(() => ({
        isQuotaExceeded: false,
        message: fallback,
      }))
  }

  return response
    .json()
    .then((payload) => {
      const record = asRecord(payload)
      if (!record) {
        return { isQuotaExceeded: false, message: fallback }
      }

      const canonicalError = asRecord(record.error)
      const legacyError = typeof record.error === 'string' ? record.error : undefined
      const canonicalDetails = canonicalError?.details
      const topLevelDetails = record.details
      const isQuotaExceeded =
        legacyError === 'quota_exceeded' ||
        isRateLimitCode(canonicalError?.code) ||
        isRateLimitCode(record.code) ||
        includesQuotaExceeded(canonicalDetails) ||
        includesQuotaExceeded(topLevelDetails) ||
        hasQuotaDetails(canonicalDetails) ||
        hasQuotaDetails(topLevelDetails) ||
        (response.status === 429 &&
          (isRateLimitCode(record.code) || isRateLimitCode(canonicalError?.code)))
      const message =
        typeof canonicalError?.message === 'string'
          ? canonicalError.message
          : typeof record.message === 'string'
            ? record.message
            : legacyError || fallback
      return {
        isQuotaExceeded,
        message,
        retryAfterSeconds: getRetryAfter(response),
      }
    })
    .catch(() => ({ isQuotaExceeded: false, message: fallback }))
}

export function parseSseEvent(rawEvent: string): StreamEvent | null {
  const lines = rawEvent.split('\n')
  const dataLines = lines.filter((line) => line.startsWith('data:'))
  if (dataLines.length === 0) return null

  const data = dataLines.map((line) => line.replace(/^data:\s?/, '')).join('\n')
  let payload: unknown
  try {
    payload = JSON.parse(data)
  } catch {
    return null
  }

  if (typeof payload !== 'object' || payload === null || !('type' in payload)) {
    return null
  }

  const typed = payload as { type: string; [key: string]: unknown }
  if (
    typed.type !== 'start' &&
    typed.type !== 'block' &&
    typed.type !== 'text' &&
    typed.type !== 'done' &&
    typed.type !== 'error'
  ) {
    return null
  }

  return {
    type: typed.type,
    ...(typed as Record<string, unknown>),
  } as StreamEvent
}
