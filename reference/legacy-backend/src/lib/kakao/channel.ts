'use client'

import { KAKAO_CHANNEL_PUBLIC_ID } from './env'

function callChannelApi(method: 'followChannel' | 'chatChannel') {
  if (typeof window === 'undefined' || !window.Kakao?.isInitialized()) return
  if (!KAKAO_CHANNEL_PUBLIC_ID) return

  try {
    window.Kakao.Channel[method]({ channelPublicId: KAKAO_CHANNEL_PUBLIC_ID })
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[Kakao Channel] 채널 API 호출 중 오류가 발생했습니다.')
    }
  }
}

/**
 * 카카오 채널 팔로우를 실행합니다.
 */
export function followChannel(): void {
  callChannelApi('followChannel')
}

/**
 * 카카오 채널 채팅을 실행합니다.
 */
export function chatChannel(): void {
  callChannelApi('chatChannel')
}

/**
 * Server-side check placeholder.
 */
export function isChannelFollowed(): boolean {
  return false
}
