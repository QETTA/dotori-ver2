/** 카카오톡 인앱 브라우저 감지 + 외부 브라우저 열기 + 루프/타임아웃 감지 */

export function isKakaoInApp(): boolean {
  if (typeof navigator === 'undefined') return false
  return /KAKAOTALK/i.test(navigator.userAgent)
}

/** 로그인 무한 리다이렉트 감지 (같은 URL 3회 이상) */
const redirectHistory: string[] = []
export function detectLoginLoop(url: string): boolean {
  redirectHistory.push(url)
  if (redirectHistory.length > 10) redirectHistory.shift()
  const count = redirectHistory.filter((u) => u === url).length
  return count >= 3
}

/** 지도 SDK 로드 타임아웃 감지 (3~5초) */
export function withMapLoadTimeout(loadFn: () => Promise<void>, timeoutMs = 4000): Promise<void> {
  return Promise.race([
    loadFn(),
    new Promise<void>((_, reject) => setTimeout(() => reject(new Error('MAP_LOAD_TIMEOUT')), timeoutMs)),
  ])
}

/** 공유 SDK init 실패 감지 */
export function detectShareSDKFailure(): boolean {
  if (typeof window === 'undefined') return false
  return !window.Kakao?.isInitialized()
}

/**
 * 카카오톡 인앱 → 외부 브라우저로 열기
 * Android: intent scheme, iOS: Safari fallback
 */
export function openExternalBrowser(url?: string) {
  if (typeof window === 'undefined') return

  const target = url ?? window.location.href
  const ua = navigator.userAgent
  if (/Android/i.test(ua)) {
    // Android intent scheme → Chrome or default browser
    const intentUrl = `intent://${target.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
    window.location.href = intentUrl
  } else {
    // iOS: window.open triggers Safari
    window.open(target, '_blank')
  }

  // Fallback: copy link if external browser didn't open within 2s
  setTimeout(() => {
    if (document.visibilityState === 'visible') {
      navigator.clipboard
        .writeText(target)
        .then(() => {
          alert('링크가 복사되었습니다. 브라우저에 붙여넣기 해주세요!')
        })
        .catch(() => {})
    }
  }, 2000)
}
