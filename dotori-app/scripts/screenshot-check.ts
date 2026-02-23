import { chromium, firefox } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const BASE = process.env.BASE_URL ?? 'http://localhost:3002'
const OUT = '/tmp/dotori-screenshots'
const IGNORE_RUNTIME_NOISE =
  process.env.CHECK_CONSOLE_IGNORE_API_ERRORS === '1'
type BrowserError = {
  route: string
  type: string
  message: string
}

const consoleIssues: BrowserError[] = []

const recordIssue = (route: string, type: string, message: string) => {
  if (isKnownRuntimeNoise(type, message)) {
    return
  }
  consoleIssues.push({ route, type, message })
}

function isKnownRuntimeNoise(type: string, message: string): boolean {
  const normalized = message.toLowerCase()

  if (
    normalized.includes(
      'download the react devtools for a better development experience'
    )
  ) {
    return true
  }

  if (!IGNORE_RUNTIME_NOISE) {
    return false
  }

  if (
    normalized.includes('clientfetcherror') &&
    normalized.includes('not valid json')
  ) {
    return true
  }

  if (
    type === 'console' &&
    normalized.includes(
      'failed to load resource: the server responded with a status of 500'
    )
  ) {
    return true
  }

  if (
    type === 'pageerror' &&
    normalized.includes('환경변수 오류:') &&
    normalized.includes('invalid input: expected string')
  ) {
    return true
  }

  return false
}

async function getFacilityId(): Promise<string> {
  try {
    const res = await fetch(`${BASE}/api/facilities?limit=1`)
    const json = await res.json()
    const first = json.data?.[0]
    return first?.id || 'f1'
  } catch {
    return 'f1'
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })

  const facilityId = await getFacilityId()

  const routes = [
    { path: '/', name: '01-home' },
    { path: '/chat', name: '02-chat' },
    { path: '/explore', name: '03-explore', waitUntil: 'load' as const },  // Kakao Map 외부 요청으로 networkidle 불가
    { path: '/landing', name: '04-landing' },
    { path: '/login', name: '05-login' },
    { path: '/onboarding', name: '06-onboarding', waitUntil: 'domcontentloaded' as const },
    { path: `/facility/${facilityId}`, name: '07-facility' },
    { path: '/community', name: '08-community' },
    { path: '/my', name: '09-my' },
    { path: '/my/settings', name: '10-settings' },
  ]

  const browserType =
    process.env.BROWSER === 'firefox' ? firefox : chromium
  const browser = await browserType.launch()
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  })

  for (const route of routes) {
    const page = await context.newPage()
    const routeName = route.name
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        const text = `[${routeName}] console.${msg.type()}: ${msg.text()}`
        recordIssue(route.path, msg.type(), text)
        console.log(text)
      }
    })
    page.on('pageerror', (error) => {
      const text = `[${routeName}] pageerror: ${error.message}`
      recordIssue(route.path, 'pageerror', text)
      console.log(text)
    })
    try {
      await page.goto(`${BASE}${route.path}`, {
        waitUntil: (route as { waitUntil?: 'networkidle' | 'load' | 'domcontentloaded' }).waitUntil ?? 'networkidle',
        timeout: 30000,
      })
      // Wait for fonts + animations + Tailwind CSS
      await page.waitForTimeout(2000)
      await page.screenshot({
        path: path.join(OUT, `${route.name}.png`),
        fullPage: true,
      })
      console.log(`📸 ${route.name} → ${route.path}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`❌ ${route.name} — ${msg}`)
    }
    await page.close()
  }

  await browser.close()
  if (consoleIssues.length > 0) {
    console.log(`\n브라우저 콘솔 이슈: ${consoleIssues.length}건`)
    const summary = consoleIssues.slice(0, 20)
    for (const item of summary) {
      console.log(item.message)
    }
    if (consoleIssues.length > 20) {
      console.log(`... +${consoleIssues.length - 20}건 더 있음`)
    }
    process.exitCode = 1
  }
  console.log(`\n스크린샷 저장: ${OUT}/`)
}

main()
