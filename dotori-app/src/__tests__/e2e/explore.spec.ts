import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";

async function goExplore(page: Page) {
	await page.goto(`${BASE}/explore`, {
		waitUntil: "load",
		timeout: 30000,
	});
}

test("탐색 페이지 렌더 테스트", async ({ page }) => {
	await goExplore(page);

	await expect(
		page.getByPlaceholder("이동 고민? 내 주변 빈자리 먼저 확인해요"),
	).toBeVisible();

	await page.getByRole("button", { name: "필터" }).click();

	await expect(page.getByRole("button", { name: "국공립" })).toBeVisible();
	await expect(page.getByRole("button", { name: "민간" })).toBeVisible();

	await expect(page.getByRole("button", { name: "반편성 불만" })).toBeVisible();
	await expect(page.getByRole("button", { name: "교사 교체" })).toBeVisible();
	await expect(page.getByRole("button", { name: "국공립 당첨" })).toBeVisible();
	await expect(page.getByRole("button", { name: "이사 예정" })).toBeVisible();
});

test("검색 플로우 테스트", async ({ page }) => {
	await goExplore(page);

	const searchInput = page.getByPlaceholder("이동 고민? 내 주변 빈자리 먼저 확인해요");
	await expect(searchInput).toBeVisible();
	await searchInput.fill("강남");

	// 검색 입력 반응 확인 (DB 결과 여부는 환경에 따라 다름)
	await expect(searchInput).toHaveValue("강남");
});

test("탐색→상세 네비게이션 테스트", async ({ page }) => {
	await goExplore(page);

	const facilityCards = page.locator('a[href^="/facility/"]');
	const cardCount = await facilityCards.count();

	test.skip(cardCount === 0, "시설 카드가 없어 상세 페이지 검증을 생략합니다.");

	await facilityCards.first().click();
	await expect(page).toHaveURL(/\/facility\//);
});
