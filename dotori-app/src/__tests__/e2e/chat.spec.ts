import { expect, test } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";

test("게스트 채팅 쿼터 반응", async ({ page }) => {
	test.setTimeout(120000);

	await page.goto(`${BASE}/chat`);

	const input = page.getByPlaceholder("토리에게 물어보세요...");
	const sendButton = page.getByRole("button", { name: "메시지 전송" });

	await expect(input).toBeVisible();
	await expect(sendButton).toBeVisible();

	await input.fill("강남구 국공립 추천해줘");
	await sendButton.click();

	const assistantReply = page.getByRole("log", { name: "어시스턴트 메시지" }).first();
	const errorReply = page.getByText(
		/앗, 방금 응답이 중단됐어요|네트워크 상태|스트리밍 응답을 받을 수 없습니다|에러/,
	);
	const quotaCard = page.getByText(/무료 채팅 횟수를 모두 사용했어요|업그레이드하면 무제한/);

	await Promise.race([
		assistantReply.waitFor({ state: "visible", timeout: 45000 }),
		errorReply.first().waitFor({ state: "visible", timeout: 45000 }),
		quotaCard.first().waitFor({ state: "visible", timeout: 45000 }),
	]);

	await expect(
		page.getByText(/\b\d+\/\d+\b|무료 채팅 횟수를 모두 사용했어요/),
	).toBeVisible();
});

test("채팅 UI 렌더 확인", async ({ page }) => {
	await page.goto(`${BASE}/chat`);

	const input = page.getByPlaceholder("토리에게 물어보세요...");
	const sendButton = page.getByRole("button", { name: "메시지 전송" });
	const bottomTabBar = page.getByRole("navigation", { name: "메인 내비게이션" });

	await expect(input).toBeVisible();
	await expect(sendButton).toBeVisible();
	await expect(bottomTabBar).toBeVisible();
});
