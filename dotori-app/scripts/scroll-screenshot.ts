import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE = "http://localhost:3001";
const OUT = "/tmp/dotori-p1-screenshots";
const VIEWPORT = { width: 375, height: 812 };
const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

const ROUTES = [
  { name: "home", path: "/" },
  { name: "explore", path: "/explore" },
  { name: "community", path: "/community" },
  { name: "chat", path: "/chat" },
  { name: "my", path: "/my" },
  { name: "login", path: "/login" },
  { name: "onboarding", path: "/onboarding" },
  { name: "landing", path: "/landing" },
];

async function main() {
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    userAgent: UA,
    isMobile: true,
    hasTouch: true,
  });

  for (const route of ROUTES) {
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}${route.path}`, {
        waitUntil: "networkidle",
        timeout: 15000,
      });
      await page.waitForTimeout(1500);

      const totalHeight = await page.evaluate(() => document.body.scrollHeight);
      const folds = Math.ceil(totalHeight / VIEWPORT.height);

      for (let i = 0; i < folds; i++) {
        const scrollY = i * VIEWPORT.height;
        await page.evaluate((y: number) => window.scrollTo(0, y), scrollY);
        await page.waitForTimeout(400);
        const filename = `${route.name}-fold${i + 1}.png`;
        await page.screenshot({
          path: path.join(OUT, filename),
          fullPage: false,
        });
      }
      console.log(`✓ ${route.name}: ${folds} folds captured`);
    } catch (e) {
      console.error(`✗ ${route.name}: ${(e as Error).message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`\nDone → ${OUT}`);
}

main();
