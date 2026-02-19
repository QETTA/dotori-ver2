export type EntrySource = 'kakao_share' | 'kakao_channel' | 'external' | 'direct'

export interface EntryParams {
  entry?: string
  ref?: string
  daycareId?: string
  nbId?: string
  age?: string
  view?: string
}

const DAYCARE_ID_MAX_LEN = 64
const ID_PATTERN = /^[A-Za-z0-9_-]+$/
const ENTRY_VALUES = ['kakao_share', 'kakao_channel'] as const
const VIEW_VALUES = ['map', 'research', 'community'] as const

function normalizeValue(value: string | null): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function normalizeDaycareId(value: string | null): string | undefined {
  const normalized = normalizeValue(value)
  if (!normalized || normalized.length > DAYCARE_ID_MAX_LEN) return undefined
  if (!ID_PATTERN.test(normalized)) return undefined
  return normalized
}

function normalizeRef(value: string | null): string | undefined {
  const normalized = normalizeValue(value)
  if (!normalized) return undefined
  if (normalized.length > 200) return normalized.slice(0, 200)
  return normalized
}

function normalizeNbId(value: string | null): string | undefined {
  const normalized = normalizeValue(value)
  if (!normalized || normalized.length > DAYCARE_ID_MAX_LEN) return undefined
  if (!ID_PATTERN.test(normalized)) return undefined
  return normalized
}

function normalizeAge(value: string | null): string | undefined {
  const normalized = normalizeValue(value)
  if (!normalized || !/^\d{1,2}$/.test(normalized)) return undefined
  return normalized
}

function normalizeView(value: string | null): string | undefined {
  const normalized = normalizeValue(value)
  if (!normalized) return undefined
  return VIEW_VALUES.includes(normalized as (typeof VIEW_VALUES)[number]) ? normalized : undefined
}

function normalizeEntry(value: string | null): string | undefined {
  const normalized = normalizeValue(value)
  if (!normalized) return undefined
  return ENTRY_VALUES.includes(normalized as (typeof ENTRY_VALUES)[number]) ? normalized : undefined
}

/**
 * URLSearchParams를 안전하게 파싱해 런타임 검증까지 수행합니다.
 */
export function parseEntryParams(searchParams: URLSearchParams): EntryParams {
  return {
    entry: normalizeEntry(searchParams.get('entry')),
    ref: normalizeRef(searchParams.get('ref')),
    daycareId: normalizeDaycareId(searchParams.get('daycareId')),
    nbId: normalizeNbId(searchParams.get('nbId')),
    age: normalizeAge(searchParams.get('age')),
    view: normalizeView(searchParams.get('view')),
  }
}

/**
 * 진입 소스를 판별합니다.
 * 잘못된 값은 direct로 폴백됩니다.
 */
export function detectEntrySource(params: EntryParams, userAgent?: string): EntrySource {
  if (params.entry === 'kakao_share') return 'kakao_share'
  if (params.entry === 'kakao_channel') return 'kakao_channel'
  if (userAgent?.includes('KAKAOTALK')) return 'kakao_channel'
  if (params.ref || params.entry) return 'external'
  return 'direct'
}

/**
 * source/path에 따라 안전한 리다이렉트 경로를 반환합니다.
 * 잘못된 daycareId/nbId는 무효화하고 /home으로 폴백합니다.
 */
export function resolveEntryRedirect(params: EntryParams, source: EntrySource): string {
  if (source === 'kakao_share' && params.daycareId) {
    const qs = new URLSearchParams()
    if (params.ref) qs.set('ref', params.ref)
    if (params.age) qs.set('age', params.age)
    const query = qs.toString()
    return `/facility/${encodeURIComponent(params.daycareId)}${query ? `?${query}` : ''}`
  }

  if (source === 'kakao_channel') return '/chat'

  if (params.nbId) {
    return `/chat?entry=in_fox&tool=kakao-map&nbId=${encodeURIComponent(params.nbId)}`
  }

  return '/home'
}
