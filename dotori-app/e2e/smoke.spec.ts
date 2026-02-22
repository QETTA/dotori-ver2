import { expect, test, type Page } from "@playwright/test";

function normalizePathname(pathname: string) {
	if (pathname.length > 1 && pathname.endsWith("/")) {
		return pathname.slice(0, -1);
	}
	return pathname;
}

async function gotoAndExpect200(page: Page, path: string) {
	const response = await page.goto(path, { waitUntil: "domcontentloaded" });

	expect(response, `No response for GET ${path}`).not.toBeNull();
	expect(response?.status(), `Unexpected status for GET ${path}`).toBe(200);

	const currentPath = normalizePathname(new URL(page.url()).pathname);
	const expectedPath = normalizePathname(path);
	expect(currentPath, `Unexpected redirect while visiting ${path}`).toBe(expectedPath);
}

test("홈페이지 로드", async ({ page }) => {
	await gotoAndExpect200(page, "/");

	await expect(page.locator("body")).toContainText(
		/도토리에 오신 것을 환영해요|님, 안녕하세요|홈 정보를 불러오지 못했어요/,
	);
});

test("로그인 페이지 로드", async ({ page }) => {
	await gotoAndExpect200(page, "/login");

	await expect(page.getByRole("button", { name: "카카오 계정으로 로그인" })).toBeVisible();
});

test("탐색 페이지 로드", async ({ page }) => {
	await gotoAndExpect200(page, "/explore");
});

test("채팅 페이지 로드", async ({ page }) => {
	await gotoAndExpect200(page, "/chat");
});

test("커뮤니티 페이지 로드", async ({ page }) => {
	await gotoAndExpect200(page, "/community");
});

test("랜딩 페이지 로드", async ({ page }) => {
	await gotoAndExpect200(page, "/landing");
});

