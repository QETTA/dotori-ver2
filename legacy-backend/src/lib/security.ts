const PII_PATTERNS = [
  /\d{2,3}-\d{3,4}-\d{4}/g,
  /[가-힣]{2,4}\s*\d{6}[-]?\d{7}/g,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  /서울[시]?\s+[가-힣]+[구군시]\s+[가-힣]+[동읍면리]\s+\d+[-]\d+/g,
]

/**
 * 내부/외부에서 유출 우려가 있는 PII를 마스킹합니다.
 * g 플래그 정규식은 반복 사용 시 lastIndex 초기화가 필요합니다.
 */
export function maskPII(text: string): string {
  let masked = text
  for (const pattern of PII_PATTERNS) {
    if (pattern.global) pattern.lastIndex = 0
    masked = masked.replace(pattern, '***')
  }
  return masked
}

/**
 * 플랫폼 키 기본 검증.
 */
export function validatePlatformKey(key: string, _platform: 'js' | 'rest' | 'native'): boolean {
  if (!key || key.length < 10) return false
  return true
}

/**
 * 번들에서 서버/관리자 키 노출 의심 문자열을 탐지합니다.
 */
export function isAdminKeyExposed(bundleContent: string): boolean {
  const dangerousPatterns = [/ADMIN_KEY/i, /adminKey/, /bizToken/i, /SERVER_SECRET/i]
  return dangerousPatterns.some((p) => p.test(bundleContent))
}

/**
 * 사용자 입력 본문에서 script/이벤트 핸들러/PII를 함께 정리합니다.
 */
export function sanitizeUserContent(content: string): string {
  let safe = maskPII(content)
  safe = safe.replace(/<script[^>]*>.*?<\/script>/gi, '')
  safe = safe.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
  return safe
}

export const KAKAO_SDK_ERRORS: Record<string, string> = {
  key_mismatch: '서비스 설정을 확인 중입니다. 잠시 후 다시 시도해주세요.',
  domain_mismatch: '서비스 접속 환경을 확인 중입니다.',
  sdk_init_failed: '일시적인 오류가 발생했습니다. 새로고침 해주세요.',
}

/**
 * SDK 오류 문구를 사용자 친화 메시지로 변환합니다.
 */
export function toUserFriendlyError(sdkError: string): string {
  for (const [key, msg] of Object.entries(KAKAO_SDK_ERRORS)) {
    if (sdkError.toLowerCase().includes(key)) return msg
  }
  return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
}
