import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const ROUTES = [
  '/my/documents',
  '/my/waitlist',
  '/my/interests',
  '/my/notifications',
  '/my/notices',
  '/my/support',
  '/my/terms',
  '/my/app-info',
  '/my/import',
  '/community/write',
]

type CapturedError = { source: string; message: string; locationUrl?: string }

function normalize(msg: string) { return msg.replace(/\s+/g, ' ').trim() }

function isNoise(msg: string): boolean {
  const m = msg.toLowerCase()
  return (
    m.includes('download the react devtools') ||
    (m.startsWith('failed to load resource:') && m.includes('favicon.ico')) ||
    m.includes('dapi.kakao.com') ||
    m.includes('net::err_blocked_by_client') ||
    (m.includes('clientfetcherror') && m.includes('failed to fetch')) ||
    (m.includes('clientfetcherror') && m.includes('not valid json'))
  )
}

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  })

  let totalErrors = 0

  for (const route of ROUTES) {
    const page = await context.newPage()
    const errors: CapturedError[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = normalize(msg.text())
        if (!isNoise(text)) {
          errors.push({ source: 'console', message: text, locationUrl: msg.location().url })
        }
      }
    })
    page.on('pageerror', (err) => {
      errors.push({ source: 'pageerror', message: normalize(err.message) })
    })

    try {
      const res = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(3000)
      const status = res?.status() ?? 0

      if (errors.length > 0 || status >= 400) {
        console.log(`\n❌ ${route} (HTTP ${status})`)
        errors.forEach(e => console.log(`   [${e.source}] ${e.message}${e.locationUrl ? ` (${e.locationUrl})` : ''}`))
        totalErrors += errors.length
      } else {
        console.log(`✅ ${route} (HTTP ${status})`)
      }
    } catch (err: unknown) {
      console.log(`\n❌ ${route} — ERROR: ${err instanceof Error ? err.message : String(err)}`)
      totalErrors++
    }
    await page.close()
  }

  await browser.close()
  console.log(`\n${'='.repeat(50)}`)
  console.log(totalErrors === 0 ? '🎉 추가 라우트 콘솔 에러 없음!' : `⚠️ 총 ${totalErrors}개 콘솔 에러`)
  process.exit(totalErrors > 0 ? 1 : 0)
}

main().catch(e => { console.error(e); process.exit(1) })
