/** Kakao SDK 글로벌 타입 */
declare global {
  interface Window {
    Kakao?: {
      isInitialized(): boolean
      init(key: string): void
      Share: {
        sendDefault(params: Record<string, unknown>): void
      }
      Channel: {
        followChannel(params: { channelPublicId: string }): void
        chatChannel(params: { channelPublicId: string }): void
      }
    }
  }
}

/** Kakao SDK 환경변수 상수 */
export const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_KEY ?? ''
export const KAKAO_SDK_VERSION = process.env.NEXT_PUBLIC_KAKAO_SDK_VERSION ?? '2.7.9'
export const KAKAO_CHANNEL_PUBLIC_ID = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_PUBLIC_ID ?? ''
export const KAKAO_SDK_URL = `https://t1.kakaocdn.net/kakao_js_sdk/${KAKAO_SDK_VERSION}/kakao.min.js`
