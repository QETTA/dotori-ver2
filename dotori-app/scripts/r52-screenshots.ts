import { chromium } from 'playwright'

const PAGES = [
  { name: 'home',      url: 'http://localhost:3002/' },
  { name: 'explore',   url: 'http://localhost:3002/explore' },
  { name: 'chat',      url: 'http://localhost:3002/chat' },
  { name: 'community', url: 'http://localhost:3002/community' },
  { name: 'my',        url: 'http://localhost:3002/my' },
  { name: 'landing',   url: 'http://localhost:3002/landing' },
]

const OUT = '/tmp/r52-screenshots'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
  })
  
  await context.addCookies([{
    name: 'dotori_prehome_splash',
    value: '1',
    domain: 'localhost',
    path: '/',
  }])
  
  for (const pg of PAGES) {
    const page = await context.newPage()
    try {
      await page.goto(pg.url, { waitUntil: 'networkidle', timeout: 15000 })
      // Scroll down to trigger FadeIn, then back up
      await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }))
      await page.waitForTimeout(800)
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.waitForTimeout(500)
      await page.screenshot({ path: `${OUT}/${pg.name}.png`, fullPage: true })
      console.log('OK ' + pg.name)
    } catch (e: any) {
      console.log('FAIL ' + pg.name + ': ' + e.message)
    }
    await page.close()
  }
  
  await browser.close()
  console.log('Done. Screenshots in ' + OUT)
}

run()
