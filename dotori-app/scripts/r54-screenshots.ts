import { chromium } from 'playwright'

const PAGES = [
  { name: 'home',     url: 'http://localhost:3002/' },
  { name: 'explore',  url: 'http://localhost:3002/explore' },
  { name: 'facility', url: 'http://localhost:3002/facility/test-id' },
  { name: 'chat',     url: 'http://localhost:3002/chat' },
  { name: 'my',       url: 'http://localhost:3002/my' },
  { name: 'landing',  url: 'http://localhost:3002/landing' },
]

const OUT = '/tmp/dotori-r54-retry1'

async function run() {
  const fs = await import('fs')
  fs.mkdirSync(OUT, { recursive: true })
  
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
      await page.goto(pg.url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(2500)
      await page.screenshot({ path: `${OUT}/${pg.name}.png`, fullPage: true })
      console.log(`OK ${pg.name}`)
    } catch (e: any) {
      try {
        await page.goto(pg.url, { waitUntil: 'load', timeout: 15000 })
        await page.waitForTimeout(3000)
        await page.screenshot({ path: `${OUT}/${pg.name}.png`, fullPage: true })
        console.log(`OK ${pg.name} (fallback)`)
      } catch (e2: any) {
        console.log(`FAIL ${pg.name}: ${e2.message}`)
      }
    }
    await page.close()
  }
  
  await browser.close()
  console.log(`Screenshots saved to ${OUT}`)
}

run()
