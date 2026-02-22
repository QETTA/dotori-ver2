import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i

type CapturedError = {
  source: 'console' | 'pageerror'
  message: string
}

function toValidFacilityId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return OBJECT_ID_PATTERN.test(trimmed) ? trimmed : null
}

async function getFacilityId(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/api/facilities?limit=1`)
    if (!res.ok) {
      return null
    }
    const json = await res.json()
    const firstFacility = Array.isArray(json?.data) ? json.data[0] : null
    if (!firstFacility || typeof firstFacility !== 'object') {
      return null
    }

    const idFromDto = toValidFacilityId((firstFacility as { id?: unknown }).id)
    if (idFromDto) return idFromDto

    const idFromMongo = toValidFacilityId((firstFacility as { _id?: unknown })._id)
    return idFromMongo
  } catch {
    return null
  }
}

async function canInspectFacilityRoute(facilityId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/facilities/${facilityId}`)
    return res.ok
  } catch {
    return false
  }
}

function normalizeErrorMessage(message: string): string {
  return message.replace(/\s+/g, ' ').trim()
}

function isNoisyError(error: CapturedError): boolean {
  const message = error.message.toLowerCase()

  if (message.includes('download the react devtools')) {
    return true
  }

  if (
    error.source === 'console' &&
    message.includes('failed to load resource') &&
    message.includes('favicon.ico')
  ) {
    return true
  }

  if (
    error.source === 'console' &&
    message.includes('kakao') &&
    message.includes('integrity')
  ) {
    return true
  }

  if (
    error.source === 'console' &&
    message.includes('kakao') &&
    message.includes('net::err_blocked_by_client')
  ) {
    return true
  }

  return false
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

  if (facilityId && (await canInspectFacilityRoute(facilityId))) {
    routes.push(`/facility/${facilityId}`)
  } else if (facilityId) {
    console.log(
      'ℹ️ 시설 상세 API 확인에 실패해 /facility/:id 검사를 건너뜁니다.'
    )
  } else {
    console.log('ℹ️ 유효한 시설 ID를 찾지 못해 /facility/:id 검사를 건너뜁니다.')
  }
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  })

  let totalErrors = 0

  for (const route of routes) {
    const page = await context.newPage()
    const errors: CapturedError[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push({
          source: 'console',
          message: normalizeErrorMessage(msg.text()),
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
            .filter((error) => !isNoisyError(error))
            .map((error) => [`${error.source}:${error.message}`, error])
        ).values()
      )

      if (actionableErrors.length > 0 || status >= 400) {
        console.log(`\n❌ ${route} (HTTP ${status})`)
        actionableErrors.forEach((error) =>
          console.log(
            `   ${
              error.source === 'pageerror' ? '[PAGE ERROR]' : '[CONSOLE ERROR]'
            } ${error.message}`
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

main()
