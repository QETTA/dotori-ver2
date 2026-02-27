import { chromium } from 'playwright';

const BASE = 'http://localhost:3002';
const pages = [
  { name: 'home', path: '/' },
  { name: 'explore', path: '/explore' },
  { name: 'chat', path: '/chat' },
  { name: 'community', path: '/community' },
  { name: 'my', path: '/my' },
  { name: 'landing', path: '/landing' },
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
});

for (const { name, path } of pages) {
  const page = await context.newPage();
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `/tmp/r52-${name}.png`, fullPage: true });
    console.log(`OK: ${name}`);
  } catch (e) {
    console.log(`FAIL: ${name} — ${e.message?.slice(0, 80)}`);
  }
  await page.close();
}

// Explore scrolled state
const scrollPage = await context.newPage();
try {
  await scrollPage.goto(`${BASE}/explore`, { waitUntil: 'networkidle', timeout: 15000 });
  await scrollPage.waitForTimeout(1000);
  await scrollPage.evaluate(() => window.scrollTo(0, 400));
  await scrollPage.waitForTimeout(500);
  await scrollPage.screenshot({ path: '/tmp/r52-explore-scrolled.png' });
  console.log('OK: explore-scrolled');
} catch (e) {
  console.log(`FAIL: explore-scrolled — ${e.message?.slice(0, 80)}`);
}
await scrollPage.close();

await browser.close();
console.log('Done');
