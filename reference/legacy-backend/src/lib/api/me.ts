import { hasUsableSessionCookie } from '@/lib/auth/client-session-cookie'

export type MeResponse = {
  ok: true
  user: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  firstChoice: {
    daycareId: string
    age: number | null
    updatedAt: string
    name: string | null
    district: string | null
    dong: string | null
  } | null
  toAlerts: Array<{
    daycareId: string
    age: number
    enabled: boolean
    updatedAt: string
    name: string | null
    district: string | null
    dong: string | null
  }>
}

export async function getMe(): Promise<MeResponse | null> {
  // Skip if not authenticated to avoid console 401 noise
  if (typeof document !== 'undefined' && !hasUsableSessionCookie()) {
    return null
  }
  const response = await fetch('/api/me', { cache: 'no-store' })

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error(`GET /api/me failed: ${response.status}`)
  }

  const json = (await response.json()) as MeResponse | { ok?: boolean }
  if (json.ok !== true) {
    throw new Error('GET /api/me returned a non-ok payload')
  }

  return json as MeResponse
}
