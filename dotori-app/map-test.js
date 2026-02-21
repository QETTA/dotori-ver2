const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  
  const errors = [];
  const netFails = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text().slice(0,100)); });
  page.on('requestfailed', req => {
    if (req.url().includes('kakao')) netFails.push(req.url().slice(0,80));
  });
  
  // 채팅 페이지 접속
  await page.goto('http://localhost:3000/chat', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // 현재 URL 확인 (리다이렉트 됐나)
  console.log('URL:', page.url());
  
  // 인풋 찾기 - placeholder로
  const inp = page.locator('input[placeholder*="토리"]');
  const inpCount = await inp.count();
  console.log('input 개수:', inpCount);
  
  if (inpCount > 0) {
    await inp.fill('하남시 어린이집 추천해줘');
    await page.keyboard.press('Enter');
    console.log('메시지 전송함');
    
    // 응답 대기 (최대 20초)
    await page.waitForTimeout(18000);
    
    // 지도 확인
    const mapEl = page.locator('[role="region"][aria-label*="지도"]');
    const mapCnt = await mapEl.count();
    console.log('map element count:', mapCnt);
    
    if (mapCnt > 0) {
      const bb = await mapEl.first().boundingBox();
      console.log('map bbox:', JSON.stringify(bb));
      const loading = await page.locator('text=지도 로딩 중').count();
      const errEl = await page.locator('text=지도를 표시할 수 없어요').count();
      console.log('loading shown:', loading > 0);
      console.log('error shown:', errEl > 0);
    }
  }
  
  console.log('console errors:', JSON.stringify(errors.slice(0,3)));
  console.log('kakao net fails:', JSON.stringify(netFails));
  
  await page.screenshot({ path: '/tmp/chat-test.png' });
  console.log('screenshot: /tmp/chat-test.png');
  
  await browser.close();
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
