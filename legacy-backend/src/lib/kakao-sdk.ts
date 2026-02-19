import { KAKAO_JS_KEY, KAKAO_SDK_VERSION } from './kakao/env'
import { toUserFriendlyError } from './security'

const KAKAO_SDK_TIMEOUT_MS = 5000
const KAKAO_SDK_TIMEOUT_RETRY = 1

let sdkLoaded = false
let sdkLoading: Promise<void> | null = null

function normalizeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isTimeoutError(error: unknown): boolean {
  return normalizeErrorMessage(error) === 'sdk_init_timeout'
}

function loadKakaoSDKOnce(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('server_environment'))
      return
    }

    if (window.Kakao?.isInitialized()) {
      sdkLoaded = true
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = `https://t1.kakaocdn.net/kakao_js_sdk/${KAKAO_SDK_VERSION}/kakao.min.js`
    script.crossOrigin = 'anonymous'
    script.async = true

    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('sdk_init_timeout'))
    }, KAKAO_SDK_TIMEOUT_MS)

    const cleanup = () => {
      clearTimeout(timeout)
      script.removeEventListener('load', onLoad)
      script.removeEventListener('error', onError)
      if (script.parentElement) {
        script.parentElement.removeChild(script)
      }
    }

    const onLoad = () => {
      cleanup()

      try {
        if (!KAKAO_JS_KEY) {
          reject(new Error('key_mismatch'))
          return
        }
        if (!window.Kakao) {
          reject(new Error('sdk_init_failed'))
          return
        }
        window.Kakao.init(KAKAO_JS_KEY)
        sdkLoaded = true
        resolve()
      } catch (error) {
        reject(error)
      }
    }

    const onError = () => {
      cleanup()
      reject(new Error('sdk_init_failed'))
    }

    script.addEventListener('load', onLoad)
    script.addEventListener('error', onError)
    document.head.appendChild(script)
  })
}

async function loadKakaoSDKWithRetry(attempt = 0): Promise<void> {
  try {
    await loadKakaoSDKOnce()
    return
  } catch (error) {
    if (isTimeoutError(error) && attempt < KAKAO_SDK_TIMEOUT_RETRY) {
      return loadKakaoSDKWithRetry(attempt + 1)
    }
    throw error
  }
}

/**
 * Kakao JS SDK를 로드합니다.
 * - 타임아웃(5초) 발생 시 1회 재시도
 * - 최종 실패 시 사용자 친화 메시지로 통일
 */
export function loadKakaoSDK(): Promise<void> {
  if (sdkLoaded) return Promise.resolve()
  if (sdkLoading) return sdkLoading

  sdkLoading = loadKakaoSDKWithRetry(0).catch((error) => {
    sdkLoading = null
    const msg = normalizeErrorMessage(error)
    throw new Error(toUserFriendlyError(msg))
  })

  return sdkLoading
}

export function isKakaoReady(): boolean {
  return typeof window !== 'undefined' && !!window.Kakao?.isInitialized()
}
