import type { Browser } from '@playwright/test'
import { chromium, firefox, webkit } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3002'
const BROWSER = (process.env.BROWSER ?? 'chromium').toLowerCase()
const CHECK_CONSOLE_CHANNEL = process.env.CHECK_CONSOLE_CHANNEL?.trim()
const IGNORE_API_500 =
  process.env.CHECK_CONSOLE_IGNORE_API_ERRORS === '1'
const IGNORE_TRANSIENT_NETWORK_ERRORS =
  process.env.CHECK_CONSOLE_IGNORE_TRANSIENT_NETWORK_ERRORS !== '0'
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i

type CapturedError = {
  source: 'console' | 'pageerror'
  level?: 'error' | 'warning'
  message: string
  locationUrl?: string
}

type FacilityListItem = {
  id?: unknown
  _id?: unknown
}

type FacilityDetailPayload = {
  data?: {
    id?: unknown
    _id?: unknown
    name?: unknown
  }
}

function toValidFacilityId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return OBJECT_ID_PATTERN.test(trimmed) ? trimmed : null
}

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

function normalizeComparableUrl(url: string): string {
  const trimmed = url.trim()
  if (trimmed.length === 0) return ''

  try {
    const parsed = new URL(trimmed)
    return `${parsed.origin}${normalizePathname(parsed.pathname)}${parsed.search}`
  } catch {
    return trimmed
  }
}

function isSameUrl(left: string | undefined, right: string | undefined): boolean {
  if (!left || !right) return false
  return normalizeComparableUrl(left) === normalizeComparableUrl(right)
}

async function canInspectFacilityRoute(facilityId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/facilities/${facilityId}`)
    if (!res.ok) {
      return false
    }

    const contentType = res.headers.get('content-type')?.toLowerCase() ?? ''
    if (!contentType.includes('application/json')) {
      return false
    }

    const json = (await res.json()) as FacilityDetailPayload
    const payload = json?.data
    if (!payload || typeof payload !== 'object') {
      return false
    }

    const payloadId = toValidFacilityId(payload.id) ?? toValidFacilityId(payload._id)
    const facilityName = (payload as { name?: unknown }).name

    return (
      payloadId === facilityId &&
      typeof facilityName === 'string' &&
      facilityName.trim().length > 0
    )
  } catch {
    return false
  }
}

async function getFacilityId(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/api/facilities?limit=20`)
    if (!res.ok) {
      return null
    }

    const contentType = res.headers.get('content-type')?.toLowerCase() ?? ''
    if (!contentType.includes('application/json')) {
      return null
    }

    const json = await res.json()
    const facilities = Array.isArray(json?.data) ? json.data : []
    const checkedIds = new Set<string>()

    for (const facility of facilities) {
      if (!facility || typeof facility !== 'object') continue

      const candidateId =
        toValidFacilityId((facility as FacilityListItem).id) ??
        toValidFacilityId((facility as FacilityListItem)._id)

      if (!candidateId || checkedIds.has(candidateId)) continue
      checkedIds.add(candidateId)

      if (await canInspectFacilityRoute(candidateId)) {
        return candidateId
      }
    }

    return null
  } catch {
    return null
  }
}

async function canInspectRoute(route: string): Promise<boolean> {
  try {
    const targetUrl = new URL(route, BASE)
    const res = await fetch(targetUrl)
    if (res.status >= 400) {
      return false
    }

    const finalUrl = new URL(res.url || targetUrl.href, BASE)
    return (
      normalizePathname(finalUrl.pathname) === normalizePathname(targetUrl.pathname)
    )
  } catch {
    return false
  }
}

function normalizeErrorMessage(message: string): string {
  return message.replace(/\s+/g, ' ').trim()
}

function normalizeErrorUrl(url: string | undefined): string | undefined {
  if (typeof url !== 'string') return undefined
  const trimmed = url.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function isHydrationMismatchMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('hydration') ||
    normalized.includes("didn't match the client properties") ||
    normalized.includes("server rendered html didn't match")
  )
}

type NoiseFilterContext = {
  routeUrl: string
  status: number
}

function isNoisyError(error: CapturedError, context: NoiseFilterContext): boolean {
  if (error.source !== 'console') {
    return false
  }

  const message = error.message.toLowerCase()
  const locationUrl = error.locationUrl?.toLowerCase() ?? ''
  const hasKakaoSdkUrl =
    message.includes('dapi.kakao.com/v2/maps/sdk.js') ||
    locationUrl.includes('dapi.kakao.com/v2/maps/sdk.js')
  const is404FailedToLoadResource =
    message.startsWith('failed to load resource:') &&
    (message.includes('status of 404') || message.includes('(not found)'))

  if (
    message.includes('download the react devtools for a better development experience')
  ) {
    return true
  }

  if (
    context.status === 404 &&
    is404FailedToLoadResource &&
    isSameUrl(error.locationUrl, context.routeUrl)
  ) {
    return true
  }

  if (
    is404FailedToLoadResource &&
    locationUrl.includes('/favicon.ico')
  ) {
    return true
  }

  if (
    hasKakaoSdkUrl &&
    message.includes('failed to find a valid digest in the') &&
    message.includes('integrity')
  ) {
    return true
  }

  if (
    hasKakaoSdkUrl &&
    message.includes('net::err_blocked_by_client')
  ) {
    return true
  }

  if (
    IGNORE_API_500 &&
    message.startsWith('failed to load resource:') &&
    message.includes('status of 500') &&
    locationUrl.includes('/api/')
  ) {
    return true
  }

  if (
    IGNORE_API_500 &&
    message.includes('clientfetcherror') &&
    message.includes('not valid json')
  ) {
    return true
  }

  if (
    IGNORE_TRANSIENT_NETWORK_ERRORS &&
    (message.includes('net::err_network_changed') ||
      (message.includes('clientfetcherror') &&
        message.includes('failed to fetch') &&
        message.includes('errors.authjs.dev#autherror')))
  ) {
    return true
  }

  return false
}

function resolveBrowserChannel(): string | undefined {
  if (BROWSER !== 'chromium') return undefined
  if (CHECK_CONSOLE_CHANNEL === undefined || CHECK_CONSOLE_CHANNEL.length === 0) {
    return 'chrome'
  }

  const normalized = CHECK_CONSOLE_CHANNEL.toLowerCase()
  if (normalized === 'none' || normalized === 'off') {
    return undefined
  }

  return normalized
}

async function launchConsoleBrowser(): Promise<Browser> {
  if (BROWSER === 'firefox') {
    return firefox.launch()
  }

  if (BROWSER === 'webkit') {
    return webkit.launch()
  }

  const channel = resolveBrowserChannel()
  if (channel) {
    try {
      console.log(`ℹ️ check-console: chromium channel=${channel}`)
      return await chromium.launch({ channel })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.log(
        `ℹ️ channel=${channel} 실행 실패, 기본 chromium으로 폴백합니다. (${message})`
      )
    }
  } else {
    console.log('ℹ️ check-console: chromium default channel')
  }

  return chromium.launch()
}

async function main() {
  const facilityId = await getFacilityId()
  const routes: string[] = [
    '/',
    '/explore',
    '/chat',
    '/community',
    '/my',
    '/my/settings',
    '/onboarding',
    '/landing',
    '/login',
  ]

  if (facilityId) {
    const facilityRoute = `/facility/${facilityId}`
    if (await canInspectRoute(facilityRoute)) {
      routes.push(facilityRoute)
    } else {
      console.log(
        `ℹ️ ${facilityRoute} 응답 상태를 확인할 수 없어 /facility/:id 검사를 건너뜁니다.`
      )
    }
  } else {
    console.log(
      'ℹ️ 검사 가능한 시설 ID를 찾지 못해 /facility/:id 검사를 건너뜁니다.'
    )
  }
  const browser = await launchConsoleBrowser()
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  })

  let totalErrors = 0

  for (const route of routes) {
    const routeUrl = new URL(route, BASE).toString()
    const page = await context.newPage()
    const errors: CapturedError[] = []

    page.on('console', (msg) => {
      const messageType = msg.type()
      const messageText = normalizeErrorMessage(msg.text())
      const isActionableWarning =
        messageType === 'warning' && isHydrationMismatchMessage(messageText)

      if (messageType === 'error' || isActionableWarning) {
        errors.push({
          source: 'console',
          level: messageType === 'warning' ? 'warning' : 'error',
          message: messageText,
          locationUrl: normalizeErrorUrl(msg.location().url),
        })
      }
    })

    page.on('pageerror', (err) => {
      errors.push({
        source: 'pageerror',
        message: normalizeErrorMessage(err.message),
      })
    })

    try {
      const res = await page.goto(`${BASE}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
      const status = res?.status() ?? 0

      // Wait for hydration + any async errors
      await page.waitForTimeout(3000)

      const actionableErrors = Array.from(
        new Map(
          errors
            .filter((error) => !isNoisyError(error, { routeUrl, status }))
            .map((error) => [
              `${error.source}:${error.locationUrl ?? ''}:${error.message}`,
              error,
            ])
        ).values()
      )

      if (actionableErrors.length > 0 || status >= 400) {
        console.log(`\n❌ ${route} (HTTP ${status})`)
        actionableErrors.forEach((error) =>
          console.log(
            `   ${
              error.source === 'pageerror'
                ? '[PAGE ERROR]'
                : error.level === 'warning'
                  ? '[CONSOLE WARNING]'
                  : '[CONSOLE ERROR]'
            } ${error.message}${error.locationUrl ? ` (${error.locationUrl})` : ''}`
          )
        )
        totalErrors += actionableErrors.length
      } else {
        console.log(`✅ ${route} (HTTP ${status})`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`\n❌ ${route} — TIMEOUT/ERROR: ${msg}`)
      totalErrors++
    }

    await page.close()
  }

  await browser.close()

  console.log(`\n${'='.repeat(50)}`)
  console.log(
    totalErrors === 0
      ? '🎉 모든 라우트 콘솔 에러 없음!'
      : `⚠️  총 ${totalErrors}개 콘솔 에러 발견`
  )
  process.exit(totalErrors > 0 ? 1 : 0)
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error(`\n❌ check-console 실행 중 예외가 발생했습니다: ${msg}`)
  process.exit(1)
})
