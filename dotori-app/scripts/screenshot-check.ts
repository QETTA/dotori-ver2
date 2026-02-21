import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const OUT = '/tmp/dotori-screenshots'

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
    { path: '/explore', name: '03-explore' },
    { path: '/landing', name: '04-landing' },
    { path: '/login', name: '05-login' },
    { path: '/onboarding', name: '06-onboarding' },
    { path: `/facility/${facilityId}`, name: '07-facility' },
    { path: '/community', name: '08-community' },
    { path: '/my', name: '09-my' },
    { path: '/my/settings', name: '10-settings' },
  ]

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  })

  for (const route of routes) {
    const page = await context.newPage()
    try {
      await page.goto(`${BASE}${route.path}`, {
        waitUntil: 'networkidle',
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
  console.log(`\n스크린샷 저장: ${OUT}/`)
}

main()
