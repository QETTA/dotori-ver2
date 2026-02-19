export type TOEventType = 'TO_DETECTED' | 'WAITLIST_SHIFT' | 'STATUS_CHANGED'

export interface TOSubscription {
  userId: string
  facilityId: string
  ageGroup: number
  mode: 'instant' | 'daily_digest'
  createdAt: string
}

export interface TOAlertEvent {
  id: string
  type: TOEventType
  facilityId: string
  facilityName: string
  ageGroup: number
  evidenceId?: string
  message: string
  occurredAt: string
}

const COOLDOWN_MS: Record<TOEventType, number> = {
  TO_DETECTED: 4 * 60 * 60 * 1000,
  WAITLIST_SHIFT: 24 * 60 * 60 * 1000,
  STATUS_CHANGED: 12 * 60 * 60 * 1000,
}

const lastSentMap = new Map<string, number>()

/**
 * 중복 발송 방지용 쿨다운을 체크합니다.
 */
export function shouldSendAlert(event: TOAlertEvent): boolean {
  const key = `${event.facilityId}:${event.ageGroup}:${event.type}`
  const lastSent = lastSentMap.get(key)
  const cooldown = COOLDOWN_MS[event.type]
  if (lastSent && Date.now() - lastSent < cooldown) return false
  lastSentMap.set(key, Date.now())
  return true
}

/**
 * 이벤트별 알림 메시지를 템플릿 문자열로 생성합니다.
 */
export function formatAlertMessage(event: TOAlertEvent): string {
  switch (event.type) {
    case 'TO_DETECTED':
      return `${event.facilityName} ${event.ageGroup}세반에 TO가 발생했습니다`
    case 'WAITLIST_SHIFT':
      return `${event.facilityName} ${event.ageGroup}세반 대기 순번이 변동되었습니다`
    case 'STATUS_CHANGED':
      return `${event.facilityName}의 운영 상태가 변경되었습니다`
    default:
      return `${event.facilityName}에 변경이 발생했습니다`
  }
}
