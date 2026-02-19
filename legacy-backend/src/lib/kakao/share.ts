/** 카카오톡 공유 — SDK → Web Share → Clipboard fallback */

import './env' // Kakao global type

const APP_NAME = '도토리'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dotori.ai'

/** 이웃 초대 공유 */
export async function shareNeighborInvite() {
  if (typeof window === 'undefined') return
  const title = `${APP_NAME} — AI가 찾아주는 우리 아이 어린이집`
  const description = '어린이집 입소 확률 분석부터 실시간 TO 알림까지, 무료로 시작해보세요!'
  const url = `${BASE_URL}?ref=invite`

  // 1) Kakao SDK
  if (window.Kakao?.isInitialized()) {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description,
        imageUrl: `${BASE_URL}/api/og?title=${encodeURIComponent(APP_NAME)}`,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [{ title: '무료로 시작하기', link: { mobileWebUrl: url, webUrl: url } }],
      serverCallbackArgs: { ref: 'invite' },
    })
    return
  }

  // 2) Web Share API
  if (navigator.share) {
    try {
      await navigator.share({ title, text: description, url })
      return
    } catch {
      /* user cancelled */
    }
  }

  // 3) Clipboard fallback
  await navigator.clipboard.writeText(`${title}\n${description}\n${url}`)
  alert('링크가 복사되었습니다!')
}

/** 결과 공유 (분석 결과 등) */
export async function shareResult(params: { title: string; description: string; path: string }) {
  if (typeof window === 'undefined') return
  const url = `${BASE_URL}${params.path}`

  // 1) Kakao SDK
  if (window.Kakao?.isInitialized()) {
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: params.title,
        description: params.description,
        imageUrl: `${BASE_URL}/api/og?title=${encodeURIComponent(params.title)}`,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [{ title: '결과 보기', link: { mobileWebUrl: url, webUrl: url } }],
      serverCallbackArgs: { ref: 'result', path: params.path },
    })
    return
  }

  // 2) Web Share API
  if (navigator.share) {
    try {
      await navigator.share({ title: params.title, text: params.description, url })
      return
    } catch {
      /* user cancelled */
    }
  }

  // 3) Clipboard fallback
  await navigator.clipboard.writeText(`${params.title}\n${params.description}\n${url}`)
  alert('링크가 복사되었습니다!')
}
