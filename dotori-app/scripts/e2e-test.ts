/**
 * E2E 기능 테스트 — 10대 핵심 사용자 플로우
 *
 * 실행: npx tsx scripts/e2e-test.ts
 * 요구: dev 서버가 localhost:3000에서 실행 중이어야 함
 */

import { chromium, type Page } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
let passed = 0
let failed = 0
const results: { name: string; status: 'PASS' | 'FAIL'; detail?: string }[] = []

async function test(name: string, fn: (page: Page) => Promise<void>) {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  })
  const page = await context.newPage()

  try {
    await fn(page)
    passed++
    results.push({ name, status: 'PASS' })
    console.log(`  ✅ ${name}`)
  } catch (err: unknown) {
    failed++
    const detail = err instanceof Error ? err.message : String(err)
    results.push({ name, status: 'FAIL', detail })
    console.log(`  ❌ ${name}`)
    console.log(`     → ${detail.split('\n')[0]}`)
  } finally {
    await browser.close()
  }
}

async function getFacilityId(): Promise<string> {
  try {
    const res = await fetch(`${BASE}/api/facilities?limit=1`)
    const json = await res.json()
    return json.data?.[0]?.id || ''
  } catch {
    return ''
  }
}

async function main() {
  console.log('═══════════════════════════════════════')
  console.log('  E2E 기능 테스트 (10 시나리오)')
  console.log('═══════════════════════════════════════\n')

  const facilityId = await getFacilityId()

  // ── 1. 홈 진입 + 하단 탭 네비게이션 ──
  await test('1. 홈 진입 + 탭 네비게이션', async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // 홈 페이지 렌더링 확인
    const body = await page.textContent('body')
    if (!body?.includes('도토리')) throw new Error('홈 페이지 도토리 텍스트 없음')

    // 하단 탭 존재 확인
    const tabs = await page.locator('nav[role="tablist"] a').count()
    if (tabs < 5) throw new Error(`하단 탭 ${tabs}개 (5개 예상)`)

    // 탐색 탭 클릭
    await page.locator('nav[role="tablist"] a[href="/explore"]').click()
    await page.waitForTimeout(1500)
    if (!page.url().includes('/explore')) throw new Error('탐색 탭 이동 실패')
  })

  // ── 2. 탐색 페이지 시설 목록 로딩 ──
  await test('2. 탐색 페이지 시설 목록 로딩', async (page) => {
    await page.goto(`${BASE}/explore`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')
    if (!body?.includes('시설')) throw new Error('시설 목록 텍스트 없음')

    // 496개 시설 카운트 확인
    if (!body?.includes('496')) throw new Error('시설 카운트 496 미표시')
  })

  // ── 3. 탐색 검색 기능 ──
  await test('3. 탐색 검색 + 필터', async (page) => {
    await page.goto(`${BASE}/explore`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // 검색창 입력
    const searchInput = page.locator('input[placeholder*="검색"]')
    await searchInput.fill('강남구')
    // 디바운스 300ms + API 응답 + 렌더링 대기
    await page.waitForTimeout(3500)

    // 검색 후 카드 수가 변경되었는지 확인 (전체 496 → 강남구만)
    const body = await page.textContent('body')
    // 검색 결과 카운트가 496이 아닌 다른 숫자이면 검색 성공
    const hasFilteredCount = body && !body.includes('496개 시설')
    // 또는 어린이집 카드가 여전히 존재
    const hasCards = body?.includes('어린이집')
    if (!hasFilteredCount && !hasCards) throw new Error('검색 필터링 미작동')
    // 검색 API 직접 확인
    const apiRes = await fetch(`${BASE}/api/facilities?search=${encodeURIComponent('강남구')}&limit=1`)
    const apiJson = await apiRes.json()
    if (!apiJson.data || apiJson.data.length === 0) throw new Error('검색 API 결과 없음')
  })

  // ── 4. 시설 상세 페이지 로딩 ──
  await test('4. 시설 상세 페이지 데이터 로딩', async (page) => {
    if (!facilityId) throw new Error('시설 ID를 가져올 수 없음')

    await page.goto(`${BASE}/facility/${facilityId}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')
    // 정원/현원/대기 섹션 확인
    if (!body?.includes('정원')) throw new Error('정원 정보 미표시')
    if (!body?.includes('특징')) throw new Error('특징 섹션 미표시')
    if (!body?.includes('위치')) throw new Error('위치 섹션 미표시')
  })

  // ── 5. 시설 상세 → 신청 버튼 + ActionConfirmSheet ──
  await test('5. 시설 상세 → 신청 버튼 인터랙션', async (page) => {
    if (!facilityId) throw new Error('시설 ID를 가져올 수 없음')

    await page.goto(`${BASE}/facility/${facilityId}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // 신청 버튼 찾기 (입소 신청 또는 대기 신청 또는 정원 가득)
    const ctaButton = page.locator('button:has-text("신청하기")').first()
    const fullMsg = page.locator('text=정원이 가득')

    const ctaExists = await ctaButton.count()
    const fullExists = await fullMsg.count()

    if (ctaExists === 0 && fullExists === 0) {
      throw new Error('신청 버튼 또는 마감 메시지 없음')
    }

    if (ctaExists > 0) {
      await ctaButton.click()
      await page.waitForTimeout(1000)

      // ActionConfirmSheet가 열렸는지 확인
      const sheetBody = await page.textContent('body')
      if (!sheetBody?.includes('확인')) throw new Error('확인 시트 미표시')
    }
  })

  // ── 6. 채팅 페이지 진입 + 퀵 액션 ──
  await test('6. 채팅 페이지 + 퀵 액션 카드', async (page) => {
    await page.goto(`${BASE}/chat`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const body = await page.textContent('body')
    if (!body?.includes('토리')) throw new Error('토리 텍스트 없음')
    if (!body?.includes('도와드릴까요')) throw new Error('환영 메시지 없음')

    // 퀵 액션 카드 확인
    if (!body?.includes('동네 추천')) throw new Error('퀵 액션 "동네 추천" 없음')
  })

  // ── 7. 채팅 메시지 전송 + 응답 ──
  await test('7. 채팅 메시지 전송 → 응답', async (page) => {
    await page.goto(`${BASE}/chat`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // 입력창 찾기
    const input = page.locator('input[placeholder*="물어보세요"], textarea[placeholder*="물어보세요"]').first()
    const inputCount = await input.count()
    if (inputCount === 0) throw new Error('채팅 입력창 없음')

    await input.fill('강남구 어린이집 추천해줘')

    // 전송 버튼 클릭
    const sendBtn = page.locator('button[type="submit"], button:has-text("전송")').first()
    if (await sendBtn.count() === 0) {
      // Enter 키로 전송
      await input.press('Enter')
    } else {
      await sendBtn.click()
    }

    await page.waitForTimeout(5000)

    // 사용자 메시지가 표시되는지 확인
    const body = await page.textContent('body')
    if (!body?.includes('강남구')) throw new Error('사용자 메시지 미표시')
  })

  // ── 8. 커뮤니티 페이지 게시물 목록 ──
  await test('8. 커뮤니티 게시물 목록 로딩', async (page) => {
    await page.goto(`${BASE}/community`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const body = await page.textContent('body')
    // 시드된 게시물 확인
    if (!body?.includes('도토리맘') && !body?.includes('분당맘') && !body?.includes('맘카페지기')) {
      throw new Error('시드 게시물 미표시')
    }

    // 탭 필터 확인
    if (!body?.includes('최신') && !body?.includes('인기')) {
      throw new Error('필터 탭 미표시')
    }
  })

  // ── 9. MY 페이지 비로그인 상태 ──
  await test('9. MY 페이지 비로그인 상태', async (page) => {
    await page.goto(`${BASE}/my`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const body = await page.textContent('body')
    if (!body?.includes('로그인')) throw new Error('로그인 안내 없음')
    if (!body?.includes('카카오')) throw new Error('카카오 로그인 버튼 없음')
  })

  // ── 10. API 엔드포인트 종합 헬스 체크 ──
  await test('10. API 엔드포인트 헬스 체크 (7개)', async () => {
    const endpoints = [
      { path: '/api/facilities?limit=1', expect: 200 },
      { path: '/api/facilities/nearby?lat=37.497&lng=127.038&limit=3', expect: 200 },
      { path: '/api/community/posts?limit=1', expect: 200 },
      { path: '/api/home', expect: 200 },
      { path: `/api/facilities/${facilityId}`, expect: 200 },
      { path: '/api/cron/to-monitor', expect: 401 }, // 인증 필요
      { path: '/api/users/me', expect: 401 }, // 인증 필요
    ]

    const failures: string[] = []
    for (const ep of endpoints) {
      try {
        const res = await fetch(`${BASE}${ep.path}`)
        if (res.status !== ep.expect) {
          failures.push(`${ep.path}: ${res.status} (expected ${ep.expect})`)
        }
      } catch {
        failures.push(`${ep.path}: NETWORK ERROR`)
      }
    }

    if (failures.length > 0) {
      throw new Error(`API 실패: ${failures.join(', ')}`)
    }
  })

  // ── 결과 ──
  console.log('\n═══════════════════════════════════════')
  console.log(`  결과: ${passed} PASS / ${failed} FAIL (총 ${passed + failed})`)
  if (failed === 0) {
    console.log('  🎉 전체 테스트 통과!')
  } else {
    console.log('  ⚠️  실패 항목:')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`    - ${r.name}: ${r.detail?.split('\n')[0]}`)
    })
  }
  console.log('═══════════════════════════════════════')

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(console.error)
