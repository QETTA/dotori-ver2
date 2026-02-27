import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const BASE = 'https://dotori-app-pwyc9.ondigitalocean.app'
const OUT = path.resolve(import.meta.dirname ?? '.', '../screenshots-prod')

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'explore', path: '/explore' },
  { name: 'facility', path: '/facility/680054bf0847de9b6a1b38e0' },
  { name: 'chat', path: '/chat' },
  { name: 'my', path: '/my' },
  { name: 'landing', path: '/landing' },
]

async function main() {
  fs.mkdirSync(OUT, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  })

  // Set splash cookie so landing doesn't redirect
  await context.addCookies([
    { name: 'dotori_splash', value: '1', domain: 'dotori-app-pwyc9.ondigitalocean.app', path: '/' },
  ])

  for (const page of PAGES) {
    const p = await context.newPage()
    console.log(`📸 ${page.name}: ${BASE}${page.path}`)

    try {
      // For landing, clear splash cookie
      if (page.name === 'landing') {
        await context.clearCookies()
      }

      await p.goto(`${BASE}${page.path}`, { waitUntil: 'networkidle', timeout: 30000 })
      await p.waitForTimeout(2000) // animations settle

      // Viewport screenshot (above fold)
      await p.screenshot({ path: path.join(OUT, `${page.name}-viewport.png`) })

      // Full page screenshot (scrolled)
      await p.screenshot({ path: path.join(OUT, `${page.name}-full.png`), fullPage: true })

      // Scroll down and take mid-scroll screenshot
      await p.evaluate(() => window.scrollTo({ top: 600, behavior: 'smooth' }))
      await p.waitForTimeout(800)
      await p.screenshot({ path: path.join(OUT, `${page.name}-scroll.png`) })

      console.log(`  ✓ ${page.name} done`)
    } catch (err) {
      console.error(`  ✗ ${page.name} failed:`, (err as Error).message)
      // Take whatever we can
      try { await p.screenshot({ path: path.join(OUT, `${page.name}-error.png`) }) } catch {}
    }

    // Restore splash cookie after landing
    if (page.name === 'landing') {
      await context.addCookies([
        { name: 'dotori_splash', value: '1', domain: 'dotori-app-pwyc9.ondigitalocean.app', path: '/' },
      ])
    }

    await p.close()
  }

  await browser.close()
  console.log(`\n✅ Screenshots saved to ${OUT}`)
  console.log(fs.readdirSync(OUT).join('\n'))
}

main().catch(console.error)
