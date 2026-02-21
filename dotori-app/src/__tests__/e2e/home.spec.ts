import { expect, test } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";

test("홈페이지 핵심 섹션 렌더 확인", async ({ page }) => {
	await page.goto(`${BASE}/`, {
		waitUntil: "load",
		timeout: 30000,
	});

	await expect(page.getByText("도토리에 오신 것을 환영해요")).toBeVisible();
	await expect(page.getByRole("heading", { name: "내 주변 빈자리" })).toBeVisible();

	const communityLink = page.locator('a[href="/community"]').first();
	await expect(communityLink).toBeVisible();
	await expect(communityLink).toContainText("커뮤니티:");
});

test("AI 토리 카드 클릭 시 채팅으로 이동", async ({ page }) => {
	await page.goto(`${BASE}/`, {
		waitUntil: "load",
		timeout: 30000,
	});

	const aiCard = page.locator('div[role="button"]').filter({ hasText: "AI 토리" }).first();
	await expect(aiCard).toBeVisible();
	await aiCard.click();

	await expect(page).toHaveURL(/\/chat/);
});
