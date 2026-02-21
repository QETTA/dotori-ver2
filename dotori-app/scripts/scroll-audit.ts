import { chromium } from '@playwright/test';
import fs from 'fs';

const W = 375, H = 812, SCALE = 2;
const DIR = '/tmp/dotori-audit-v3';
const BASE = process.env.BASE_URL ?? 'http://localhost:3002';

const routes: [string, string, number[]][] = [
  ['home', '/', [0, 400, 800, 1200]],
  ['explore', '/explore', [0, 400, 800]],
  ['chat', '/chat', [0, 400]],
  ['community', '/community', [0, 400, 800]],
  ['my', '/my', [0, 400, 800]],
  ['settings', '/my/settings', [0, 300]],
  ['facility', '/facility/f1', [0, 300, 600, 900]],
  ['onboarding', '/onboarding', [0]],
  ['landing', '/landing', [0, 500, 1000, 1500, 2000, 2500]],
  ['login', '/login', [0]],
];

(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
  
  for (const [name, path, scrolls] of routes) {
    const page = await ctx.newPage();
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    for (const y of scrolls) {
      await page.evaluate((sy) => window.scrollTo(0, sy), y);
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${DIR}/${name}-y${y}.png` });
      console.log(`📸 ${name}-y${y}`);
    }
    await page.close();
  }
  await browser.close();
  console.log(`\n✅ ${DIR}`);
})();
