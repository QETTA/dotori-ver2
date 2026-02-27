/**
 * 콘솔 에러 수집 E2E 테스트
 * - 모든 주요 페이지를 방문하여 browser console error / unhandled rejection 수집
 * - React hydration 오류, JS 런타임 에러, 404 리소스 에러 감지
 */

import { expect, test, type Page } from "@playwright/test";

const PAGES = [
	{ path: "/", name: "홈" },
	{ path: "/login", name: "로그인" },
	{ path: "/explore", name: "탐색" },
	{ path: "/chat", name: "채팅" },
	{ path: "/community", name: "커뮤니티" },
	{ path: "/landing", name: "랜딩" },
	{ path: "/onboarding", name: "온보딩" },
];

/** 무시할 에러 패턴 (정상 동작에서도 발생하는 것들) */
const IGNORE_PATTERNS = [
	/Failed to load resource.*favicon/i,
	/NEXT_REDIRECT/i,
	/Cancelled/i,
	// 외부 지도 SDK
	/kakao\.com/i,
	/dapi\.kakao/i,
	// 개발 서버 HMR
	/webpack-hmr/i,
	/hot-update/i,
	// 비로그인 API 401 (expected)
	/401/i,
	// Next.js dev toolbar
	/\/__nextjs/i,
	/next-devtools/i,
];

const CRITICAL_PATTERNS = [
	/TypeError:/i,
	/ReferenceError:/i,
	/Cannot read prop/i,
	/is not a function/i,
	/Hydration failed/i,
	/Hydration error/i,
	/Text content did not match/i,
	/There was an error while hydrating/i,
	/Unhandled Runtime Error/i,
	/ChunkLoadError/i,
];

function shouldIgnore(msg: string): boolean {
	return IGNORE_PATTERNS.some((p) => p.test(msg));
}

function isCritical(msg: string): boolean {
	return CRITICAL_PATTERNS.some((p) => p.test(msg));
}

async function collectConsoleMsgs(page: Page, path: string) {
	const errors: string[] = [];
	const warnings: string[] = [];
	const criticals: string[] = [];

	page.on("console", (msg) => {
		const text = msg.text();
		if (shouldIgnore(text)) return;

		if (msg.type() === "error") {
			errors.push(text);
			if (isCritical(text)) criticals.push(text);
		} else if (msg.type() === "warning") {
			warnings.push(text);
		}
	});

	page.on("pageerror", (err) => {
		const text = err.message;
		if (!shouldIgnore(text)) {
			errors.push(`[pageerror] ${text}`);
			if (isCritical(text)) criticals.push(text);
		}
	});

	await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30000 });
	// 하이드레이션 완료 대기
	await page.waitForTimeout(1500);

	return { errors, warnings, criticals };
}

for (const { path, name } of PAGES) {
	test(`[콘솔] ${name} (${path}) — 크리티컬 에러 없음`, async ({ page }) => {
		const { errors, warnings, criticals } = await collectConsoleMsgs(page, path);

		// 크리티컬 에러는 테스트 실패
		if (criticals.length > 0) {
			console.error(`\n🚨 ${name} 크리티컬 에러:\n${criticals.join("\n")}`);
		}
		expect(criticals, `${name} 크리티컬 콘솔 에러`).toHaveLength(0);

		// 일반 에러는 리포트만
		if (errors.length > 0) {
			console.warn(`\n⚠️  ${name} 콘솔 에러 (${errors.length}개):\n${errors.slice(0, 5).join("\n")}`);
		}
		if (warnings.length > 0) {
			console.info(`\nℹ️  ${name} 경고 (${warnings.length}개)`);
		}
	});
}

/** 핵심 인터랙션 후 콘솔 에러 검사 */
test("[콘솔] 홈→채팅 탐색 후 에러 없음", async ({ page }) => {
	const errors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error" && !shouldIgnore(msg.text())) {
			errors.push(msg.text());
		}
	});

	await page.goto("/", { waitUntil: "load", timeout: 30000 });
	await page.waitForTimeout(500);

	// AI 토리 카드 클릭
	const aiCard = page.locator('div[role="button"]').filter({ hasText: "AI 토리" }).first();
	if (await aiCard.isVisible()) {
		await aiCard.click();
		await page.waitForTimeout(1000);
	}

	const criticals = errors.filter(isCritical);
	expect(criticals, "홈→채팅 탐색 중 크리티컬 에러").toHaveLength(0);
});

test("[콘솔] 탐색 검색 인터랙션 후 에러 없음", async ({ page }) => {
	const errors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error" && !shouldIgnore(msg.text())) {
			errors.push(msg.text());
		}
	});

	await page.goto("/explore", { waitUntil: "load", timeout: 30000 });
	await page.waitForTimeout(500);

	const searchInput = page.getByPlaceholder(/이동 고민/);
	if (await searchInput.isVisible()) {
		await searchInput.fill("서울 강남");
		await page.waitForTimeout(800);
	}

	const criticals = errors.filter(isCritical);
	expect(criticals, "탐색 검색 중 크리티컬 에러").toHaveLength(0);
});
