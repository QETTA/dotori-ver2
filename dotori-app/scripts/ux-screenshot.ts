import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const OUT = '/tmp/dotori-ux-review'

async function getFacilityId(): Promise<string> {
  try {
    const res = await fetch(`${BASE}/api/facilities?limit=1`)
    const json = await res.json()
    return json.data?.[0]?.id || 'f1'
  } catch {
    return 'f1'
  }
}

async function getPostId(): Promise<string> {
  try {
    const res = await fetch(`${BASE}/api/community/posts?limit=1`)
    const json = await res.json()
    return json.data?.[0]?.id || 'p1'
  } catch {
    return 'p1'
  }
}

async function scrollAndCapture(
  page: any,
  name: string,
  outDir: string,
) {
  // 1. Full page screenshot
  await page.screenshot({
    path: path.join(outDir, `${name}-full.png`),
    fullPage: true,
  })

  // 2. Viewport screenshots at scroll positions
  const totalHeight = await page.evaluate(() => document.body.scrollHeight)
  const viewportHeight = 812
  const scrollSteps = Math.ceil(totalHeight / viewportHeight)

  for (let i = 0; i < Math.min(scrollSteps, 8); i++) {
    const scrollY = i * viewportHeight
    await page.evaluate((y: number) => window.scrollTo(0, y), scrollY)
    await page.waitForTimeout(400)
    await page.screenshot({
      path: path.join(outDir, `${name}-scroll-${i}.png`),
    })
  }

  // 3. Bottom of page
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(400)
  await page.screenshot({
    path: path.join(outDir, `${name}-bottom.png`),
  })

  console.log(`📸 ${name} (${scrollSteps} scroll steps, ${totalHeight}px total)`)
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })

  const facilityId = await getFacilityId()
  const postId = await getPostId()

  // All 22 routes
  const routes = [
    // Public pages (no auth needed)
    { path: '/landing', name: '01-landing', wait: 2000 },
    { path: '/login', name: '02-login', wait: 2000 },
    { path: '/not-found', name: '03-not-found', wait: 2000 },

    // App pages (will show logged-out state)
    { path: '/', name: '04-home', wait: 4000 },
    { path: '/chat', name: '05-chat', wait: 3000 },
    { path: '/explore', name: '06-explore', wait: 3000 },
    { path: '/community', name: '07-community', wait: 4000 },
    { path: '/community/write', name: '08-community-write', wait: 2000 },
    { path: `/community/${postId}`, name: '09-community-detail', wait: 3000 },
    { path: `/facility/${facilityId}`, name: '10-facility-detail', wait: 4000 },
    { path: '/my', name: '11-my', wait: 3000 },
    { path: '/my/interests', name: '12-my-interests', wait: 3000 },
    { path: '/my/waitlist', name: '13-my-waitlist', wait: 3000 },
    { path: '/my/notifications', name: '14-my-notifications', wait: 3000 },
    { path: '/my/settings', name: '15-my-settings', wait: 3000 },
    { path: '/my/import', name: '16-my-import', wait: 3000 },
    { path: '/my/notices', name: '17-my-notices', wait: 2000 },
    { path: '/my/terms', name: '18-my-terms', wait: 2000 },
    { path: '/my/support', name: '19-my-support', wait: 2000 },
    { path: '/my/app-info', name: '20-my-app-info', wait: 2000 },
    { path: '/onboarding', name: '21-onboarding', wait: 3000 },
  ]

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  })

  let captured = 0
  let failed = 0

  for (const route of routes) {
    const page = await context.newPage()
    try {
      const response = await page.goto(`${BASE}${route.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })
      await page.waitForTimeout(route.wait)

      // Check for redirects (auth pages redirect to /login)
      const finalUrl = page.url()
      const redirected = !finalUrl.includes(route.path) && route.path !== '/'

      if (redirected) {
        // Still capture the redirected page
        await page.screenshot({
          path: path.join(OUT, `${route.name}-redirected.png`),
        })
        console.log(`↪️  ${route.name} → redirected to ${new URL(finalUrl).pathname}`)
      } else {
        await scrollAndCapture(page, route.name, OUT)
      }
      captured++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`❌ ${route.name} — ${msg}`)
      failed++
    }
    await page.close()
  }

  await browser.close()
  console.log(`\n═══════════════════════════════`)
  console.log(`📸 Captured: ${captured}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📁 Output: ${OUT}/`)

  // List all files with sizes
  const files = fs.readdirSync(OUT).sort()
  console.log(`\n📂 Files (${files.length}):`)
  for (const f of files) {
    const stat = fs.statSync(path.join(OUT, f))
    console.log(`  ${f} (${Math.round(stat.size / 1024)}KB)`)
  }
}

main()
