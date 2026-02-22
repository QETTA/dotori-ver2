import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i

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
    routes.push(`/facility/${facilityId}`)
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
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    page.on('pageerror', (err) => {
      errors.push(`[PAGE ERROR] ${err.message}`)
    })

    try {
      const res = await page.goto(`${BASE}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
      const status = res?.status() ?? 0

      // Wait for hydration + any async errors
      await page.waitForTimeout(3000)

      const filtered = errors.filter(
        (e) =>
          !e.includes('bad auth') &&
          !e.includes('MongoServerError') &&
          !e.includes('favicon.ico') &&
          !e.includes('Download the React DevTools') &&
          !e.includes('integrity') &&
          !e.includes('kakao_js_sdk') &&
          !e.includes('Failed to load resource') &&
          !e.includes('net::ERR_')
      )

      if (filtered.length > 0 || status >= 400) {
        console.log(`\n❌ ${route} (HTTP ${status})`)
        filtered.forEach((e) => console.log(`   ${e}`))
        totalErrors += filtered.length
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
