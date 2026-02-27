import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
});

// Start tracing
await context.tracing.start({ screenshots: true, snapshots: true });

const page = await context.newPage();

// Collect console errors
const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});

// Navigate to home page (may redirect to /landing without auth)
console.log('Navigating to home...');
await page.goto('http://localhost:3002/', { waitUntil: 'load', timeout: 15000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/r48-trace-home.png', fullPage: true });
console.log('Home screenshot saved');

// Navigate to chat page
console.log('Navigating to chat...');
await page.goto('http://localhost:3002/chat', { waitUntil: 'load', timeout: 15000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/r48-trace-chat.png', fullPage: true });
console.log('Chat screenshot saved');

// Navigate to community page
console.log('Navigating to community...');
await page.goto('http://localhost:3002/community', { waitUntil: 'load', timeout: 15000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/r48-trace-community.png', fullPage: true });
console.log('Community screenshot saved');

// Stop tracing
await context.tracing.stop({ path: '/tmp/r48-trace.zip' });
console.log('Trace saved to /tmp/r48-trace.zip');

// Report
console.log('\n=== Console Errors ===');
if (errors.length === 0) {
  console.log('NO CONSOLE ERRORS! Hydration is clean.');
} else {
  errors.forEach((e, i) => {
    const isHydration = e.includes('hydrat') || e.includes('match') || e.includes('server rendered');
    console.log(`\nError ${i + 1} ${isHydration ? '[HYDRATION]' : '[OTHER]'}:`);
    console.log(e.slice(0, 500));
  });
}
console.log(`\nTotal errors: ${errors.length}`);

await browser.close();
