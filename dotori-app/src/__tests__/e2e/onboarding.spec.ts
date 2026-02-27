import { expect, type Page, test } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ONBOARDING_PATH = "/onboarding";

const ONBOARDING_STEP_HEADING =
	/(아이 정보를 알려주세요|거주 지역을 알려주세요|관심 유형을 선택하세요|빈자리 생기면 바로 알려드려요|토리톡 AI가 이동 전략을 짜줘요)/;
const NEXT_BUTTON_TEXT = /^다음$/;
const SKIP_BUTTON_TEXT = /무료로 시작하기/;
const FINAL_CTA_TEXT = /무료로 시작하기|시작하기/;

async function mockOnboardingSave(page: Page): Promise<void> {
	await page.route("**/api/users/me", async (route) => {
		if (route.request().method() !== "PATCH") {
			await route.continue();
			return;
		}

		await route.fulfill({
			status: 200,
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ data: { onboardingCompleted: true } }),
		});
	});
}

async function clickNextUntilFinalCta(page: Page): Promise<void> {
	for (let attempt = 0; attempt < 8; attempt += 1) {
		const finalCta = page.getByRole("button", { name: FINAL_CTA_TEXT }).first();
		if (await finalCta.isVisible()) {
			return;
		}

		const next = page.getByRole("button", { name: NEXT_BUTTON_TEXT }).first();
		const hasNext = await next.count();
		if (!hasNext) {
			throw new Error("온보딩 next 버튼을 찾지 못해 마지막 CTA로 이동하지 못했습니다.");
		}

		const slider = page.locator('input[type="range"]');
		if (await slider.count() > 0) {
			await slider.first().click();
		}

		await next.click();
		await page.waitForTimeout(300);
	}

	throw new Error("온보딩 완주 버튼에 도달하지 못했습니다.");
}

async function clickSkipUntilComplete(page: Page): Promise<void> {
	for (let attempt = 0; attempt < 8; attempt += 1) {
		const finalCta = page.getByRole("button", { name: FINAL_CTA_TEXT }).first();
		if (await finalCta.isVisible()) {
			return;
		}

		const skip = page.getByRole("button", { name: SKIP_BUTTON_TEXT }).first();
		if (await skip.count() === 0) {
			throw new Error("온보딩 건너뛰기 버튼이 없어 진행을 중단합니다.");
		}

		await skip.click();
		await page.waitForTimeout(300);
	}

	throw new Error("온보딩 건너뛰기로 완주되지 않았습니다.");
}

async function expectOnboardingCompletedNavigation(page: Page): Promise<void> {
	await Promise.all([
		page.waitForURL((url) => {
			const path = url.pathname;
			return path === "/" || path.startsWith("/login");
		}, { timeout: 10000 }),
		page.getByRole("button", { name: FINAL_CTA_TEXT }).first().click(),
	]);

	const destination = new URL(page.url()).pathname;
	expect(destination === "/" || destination.startsWith("/login")).toBe(true);
}

test("온보딩 페이지 렌더 확인", async ({ page }) => {
	await page.goto(`${BASE_URL}${ONBOARDING_PATH}`, {
		waitUntil: "load",
		timeout: 30000,
	});

	await expect(page.getByRole("heading", { name: ONBOARDING_STEP_HEADING })).toBeVisible();
	await expect(page.getByText(/\b[1-6]\/6\b/)).toBeVisible();
	await expect(
		page.getByRole("button", { name: "다음" }).first(),
	).toBeVisible();
});

test("온보딩 완주", async ({ page }) => {
	await mockOnboardingSave(page);
	await page.goto(`${BASE_URL}${ONBOARDING_PATH}`, {
		waitUntil: "load",
		timeout: 30000,
	});

	await clickNextUntilFinalCta(page);
	await expectOnboardingCompletedNavigation(page);
});

test("온보딩 건너뛰기", async ({ page }) => {
	await mockOnboardingSave(page);
	await page.goto(`${BASE_URL}${ONBOARDING_PATH}`, {
		waitUntil: "load",
		timeout: 30000,
	});

	const skip = page.getByRole("button", { name: SKIP_BUTTON_TEXT });
	if (await skip.count() === 0) {
		return;
	}

	await skip.click();
	await page.waitForTimeout(300);
	await clickSkipUntilComplete(page);
	await expectOnboardingCompletedNavigation(page);
});
