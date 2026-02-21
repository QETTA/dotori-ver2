import { hasUsableSessionCookie } from '@/lib/auth/client-session-cookie'

export type ToEventItem = {
  id: string
  daycareId: string
  age: number
  detectedAt: string
  message?: string | null
  daycare?: { name?: string | null; district?: string | null; dong?: string | null }
}

export type ToEventPollResponse = {
  ok: true
  since: string
  nextSince: string
  items: ToEventItem[]
}

export async function pollToEvents(since: string): Promise<ToEventPollResponse | null> {
  if (typeof document !== 'undefined' && !hasUsableSessionCookie()) {
    return null
  }
  const url = `/api/me/alerts/to/events?since=${encodeURIComponent(since)}`
  const res = await fetch(url, { cache: 'no-store' })
  if (res.status === 401) return null
  if (!res.ok) return null
  return res.json()
}
