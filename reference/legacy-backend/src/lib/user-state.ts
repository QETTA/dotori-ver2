export enum UserState {
  ANON = 'ANON',
  AUTHED = 'AUTHED',
  HAS_NEIGHBORHOOD = 'HAS_NEIGHBORHOOD',
  HAS_FIRST_CHOICE = 'HAS_FIRST_CHOICE',
  ALERTS_ON = 'ALERTS_ON',
  CHANNEL_FOLLOWED = 'CHANNEL_FOLLOWED',
}

export type DestinationScreen = 'facility_detail' | 'map' | 'research_log' | 'community'

/**
 * 사용자 상태를 계산합니다.
 * - userId 미제공: ANON
 * - 서버 환경: fetch 없이 AUTHED 반환 (서버에서 상대 경로 fetch 방지)
 * - 클라이언트: /api/me/chat/state 기반으로 단계 판별
 */
export async function getUserState(userId?: string): Promise<UserState> {
  if (!userId) return UserState.ANON

  // 서버 실행 환경에서는 fetch 상대경로를 강제하지 않음
  if (typeof window === 'undefined') return UserState.AUTHED

  try {
    const res = await fetch('/api/me/chat/state', { cache: 'no-store' })
    if (!res.ok) return UserState.AUTHED

    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null
    if (!data || typeof data !== 'object') return UserState.AUTHED

    if (data.channelFollowed === true) return UserState.CHANNEL_FOLLOWED
    if (data.alertsEnabled === true) return UserState.ALERTS_ON

    const firstChoice = data.firstChoice
    if (typeof firstChoice === 'object' && firstChoice !== null) {
      const daycareId = (firstChoice as { daycareId?: unknown }).daycareId
      if (typeof daycareId === 'string' && daycareId.trim()) return UserState.HAS_FIRST_CHOICE
    }

    const neighborhood = data.neighborhood
    if (typeof neighborhood === 'object' && neighborhood !== null) {
      const district = (neighborhood as { district?: unknown }).district
      if (typeof district === 'string' && district.trim()) return UserState.HAS_NEIGHBORHOOD
    }

    return UserState.AUTHED
  } catch {
    return UserState.AUTHED
  }
}

/**
 * URL 파라미터를 바탕으로 진입 화면을 결정합니다.
 */
export function resolveDestination(params: Record<string, string | undefined>): DestinationScreen {
  const daycareId = params.daycareId?.trim()
  if (daycareId) return 'facility_detail'
  if (params.view === 'map') return 'map'
  if (params.view === 'research') return 'research_log'
  if (params.view === 'community') return 'community'
  return 'map'
}

/**
 * 화면 상태를 실제 라우트 경로로 바꿉니다.
 */
export function destinationToPath(dest: DestinationScreen, params: Record<string, string | undefined>): string {
  switch (dest) {
    case 'facility_detail':
      return `/facility/${params.daycareId}`
    case 'map':
      return '/explore?view=map'
    case 'research_log':
      return '/explore'
    case 'community':
      return '/community'
  }
}
