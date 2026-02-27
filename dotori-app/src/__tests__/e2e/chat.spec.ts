import { expect, test } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'

test('게스트 채팅 쿼터 반응', async ({ page }) => {
  test.setTimeout(120000)
  await page.route('**/api/chat/stream', async (route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'quota_exceeded',
        message:
          '이번 달 무료 채팅 횟수를 모두 사용했어요. 프리미엄으로 업그레이드하면 무제한으로 대화할 수 있어요.',
      }),
    })
  })

  await page.goto(`${BASE}/chat`)

  const input = page.getByPlaceholder('토리에게 물어보세요...')
  const sendButton = page.getByRole('button', { name: '메시지 전송' })

  await expect(input).toBeVisible()
  await expect(sendButton).toBeVisible()
  await expect(page.getByText(/\d+\/3/)).toBeVisible({ timeout: 10000 })

  await input.fill('강남구 국공립 추천해줘')
  await sendButton.click()

  await expect(
    page.getByText(/무료 채팅 횟수를 모두 사용했어요|업그레이드하면 무제한/).first(),
  ).toBeVisible({ timeout: 10000 })
})

test('채팅 UI 렌더 확인', async ({ page }) => {
  await page.goto(`${BASE}/chat`)

  const input = page.getByPlaceholder('토리에게 물어보세요...')
  const sendButton = page.getByRole('button', { name: '메시지 전송' })
  const bottomTabBar = page.getByRole('navigation', { name: '메인 내비게이션' })

  await expect(input).toBeVisible()
  await expect(sendButton).toBeVisible()
  await expect(bottomTabBar).toBeVisible()
})
