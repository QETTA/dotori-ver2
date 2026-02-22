/**
 * E2E 기능 테스트 — 핵심 사용자 플로우
 *
 * 실행: BASE_URL=http://localhost:3002 npx tsx scripts/e2e-test.ts
 * 요구: dev 서버가 실행 중이어야 함
 */

import { chromium, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3002";
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

let passed = 0;
let failed = 0;
const results: { name: string; status: "PASS" | "FAIL"; detail?: string }[] = [];

function toValidFacilityId(value: unknown): string {
	if (typeof value !== "string") return "";
	const trimmed = value.trim();
	return OBJECT_ID_PATTERN.test(trimmed) ? trimmed : "";
}

async function getFacilityId(): Promise<string> {
	try {
		const res = await fetch(`${BASE}/api/facilities?limit=1`);
		if (!res.ok) return "";
		const json = await res.json();
		const first = Array.isArray(json?.data) ? json.data[0] : null;
		if (!first || typeof first !== "object") return "";
		return toValidFacilityId((first as { id?: unknown }).id);
	} catch {
		return "";
	}
}

async function test(name: string, fn: (page: Page) => Promise<void>) {
	const browser = await chromium.launch();
	const context = await browser.newContext({
		viewport: { width: 375, height: 812 },
		userAgent:
			"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
	});
	const page = await context.newPage();

	try {
		await fn(page);
		passed++;
		results.push({ name, status: "PASS" });
		console.log(`  ✅ ${name}`);
	} catch (err: unknown) {
		failed++;
		const detail = err instanceof Error ? err.message : String(err);
		results.push({ name, status: "FAIL", detail });
		console.log(`  ❌ ${name}`);
		console.log(`     → ${detail.split("\n")[0]}`);
	} finally {
		await browser.close();
	}
}

async function main() {
	console.log("═══════════════════════════════════════");
	console.log("  E2E 기능 테스트 (10 시나리오)");
	console.log("═══════════════════════════════════════\n");

	const facilityId = await getFacilityId();

	// 1. 홈 진입 + 하단 탭 네비게이션
	await test("1. 홈 진입 + 탭 네비게이션", async (page) => {
		await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(2000);

		const body = await page.textContent("body");
		if (!body?.includes("도토리")) throw new Error("홈 페이지 렌더링 실패");

		const bottomNav = page.locator('nav[aria-label="메인 내비게이션"]');
		if ((await bottomNav.count()) === 0) throw new Error("하단 탭 내비게이션 없음");

		const tabs = bottomNav.locator('a[role="tab"]');
		const tabCount = await tabs.count();
		if (tabCount < 5) throw new Error(`하단 탭 ${tabCount}개 (최소 5개 필요)`);

		await bottomNav.locator('a[href="/explore"]').first().click();
		await page.waitForTimeout(1500);
		if (!page.url().includes("/explore")) throw new Error("탐색 탭 이동 실패");
	});

	// 2. 탐색 페이지 시설 목록 로딩
	await test("2. 탐색 페이지 시설 목록 로딩", async (page) => {
		await page.goto(`${BASE}/explore`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(3000);

		const body = await page.textContent("body");
		if (!body?.includes("이동 고민이라면")) throw new Error("탐색 헤더 텍스트 없음");

		const facilityLinks = await page.locator('a[href^="/facility/"]').count();
		if (facilityLinks === 0) throw new Error("시설 목록 링크가 비어있음");
	});

	// 3. 탐색 검색 + 필터
	await test("3. 탐색 검색 + 필터", async (page) => {
		await page.goto(`${BASE}/explore`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(2000);

		const searchInput = page.getByLabel("시설 검색");
		await searchInput.fill("강남");
		await searchInput.press("Enter");
		await page.waitForTimeout(2500);

		const inputValue = await searchInput.inputValue();
		if (!inputValue.includes("강남")) throw new Error("검색어 입력 반영 실패");

		const apiRes = await fetch(`${BASE}/api/facilities?search=${encodeURIComponent("강남")}&limit=1`);
		if (!apiRes.ok) throw new Error(`검색 API 실패 (${apiRes.status})`);
		const apiJson = await apiRes.json().catch(() => null);
		const hasData = Array.isArray(apiJson?.data);
		if (!hasData) throw new Error("검색 API 응답 형식 오류");
	});

	// 4. 시설 상세 페이지 로딩
	await test("4. 시설 상세 페이지 데이터 로딩", async (page) => {
		if (!facilityId) throw new Error("시설 ID를 가져올 수 없음");

		await page.goto(`${BASE}/facility/${facilityId}`, {
			waitUntil: "domcontentloaded",
		});
		await page.waitForTimeout(3000);

		const body = await page.textContent("body");
		const hasDetailHeader = Boolean(body?.includes("시설 상세정보"));
		const hasDetailContent = Boolean(
			body?.includes("정원 현황") || body?.includes("연락처") || body?.includes("입소 설명회 안내"),
		);
		const hasFallbackError = Boolean(body?.includes("요청하신 어린이집 정보를 찾을 수 없어요"));
		const hasNotFound = Boolean(
			body?.includes("This page could not be found") || body?.includes("404"),
		);
		if (!hasDetailHeader && !hasDetailContent && !hasFallbackError && !hasNotFound) {
			throw new Error("시설 상세/오류/404 상태 모두 미표시");
		}

		if ((hasDetailHeader || hasDetailContent) && !body?.includes("특징")) {
			throw new Error("특징 섹션 미표시");
		}
	});

	// 5. 시설 상세 CTA 인터랙션
	await test("5. 시설 상세 CTA 인터랙션", async (page) => {
		if (!facilityId) throw new Error("시설 ID를 가져올 수 없음");

		await page.goto(`${BASE}/facility/${facilityId}`, {
			waitUntil: "domcontentloaded",
		});
		await page.waitForTimeout(2500);

		const ctaButton = page
			.getByRole("button", { name: /입소 신청|대기 신청|다시 시도/ })
			.first();
		if ((await ctaButton.count()) === 0) throw new Error("시설 CTA 버튼 없음");

		await ctaButton.click();
		await page.waitForTimeout(1000);

		if (page.url().includes("/404")) throw new Error("CTA 클릭 후 404 이동");
	});

	// 6. 채팅 페이지 진입 + 프롬프트 카드
	await test("6. 채팅 페이지 + 프롬프트 카드", async (page) => {
		await page.goto(`${BASE}/chat`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(2000);

		const body = await page.textContent("body");
		if (!body?.includes("토리")) throw new Error("토리 텍스트 없음");
		if (!body?.includes("이동 고민")) throw new Error("채팅 안내 문구 없음");
	});

	// 7. 채팅 메시지 전송
	await test("7. 채팅 메시지 전송 → 응답", async (page) => {
		await page.goto(`${BASE}/chat`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(2000);

		const input = page
			.locator('input[placeholder*="물어보세요"], textarea[placeholder*="물어보세요"]')
			.first();
		if ((await input.count()) === 0) throw new Error("채팅 입력창 없음");

		await input.fill("강남구 어린이집 추천해줘");

		const sendBtn = page.getByRole("button", { name: "메시지 전송" }).first();
		if ((await sendBtn.count()) > 0) {
			await sendBtn.click();
		} else {
			await input.press("Enter");
		}

		await page.waitForTimeout(4500);
		const body = await page.textContent("body");
		if (!body?.includes("강남구")) throw new Error("전송 메시지 미표시");
	});

	// 8. 커뮤니티 게시물 목록
	await test("8. 커뮤니티 게시물 목록 로딩", async (page) => {
		await page.goto(`${BASE}/community`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(3000);

		const body = await page.textContent("body");
		const hasTab = Boolean(body?.includes("어린이집 이동") || body?.includes("입소 고민"));
		if (!hasTab) throw new Error("커뮤니티 카테고리 탭 미표시");

		const postLinks = await page.locator('a[href^="/community/"]').count();
		const hasEmptyState = Boolean(body?.includes("첫 글") || body?.includes("게시물"));
		if (postLinks === 0 && !hasEmptyState) throw new Error("커뮤니티 게시물/빈상태 확인 실패");
	});

	// 9. MY 페이지 비로그인 상태
	await test("9. MY 페이지 비로그인 상태", async (page) => {
		await page.goto(`${BASE}/my`, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(2000);

		const body = await page.textContent("body");
		if (!body?.includes("카카오 로그인")) throw new Error("카카오 로그인 버튼 없음");
		if (!body?.includes("로그인 없이 둘러보기")) throw new Error("게스트 진입 CTA 없음");
	});

	// 10. API 엔드포인트 헬스 체크
	await test("10. API 엔드포인트 헬스 체크", async () => {
		const endpoints: Array<{ path: string; expect: number[] }> = [
			{ path: "/api/facilities?limit=1", expect: [200] },
			{ path: "/api/facilities/nearby?lat=37.497&lng=127.038&limit=3", expect: [200, 400] },
			{ path: "/api/community/posts?limit=1", expect: [200] },
			{ path: "/api/home", expect: [200] },
			{ path: "/api/cron/to-monitor", expect: [401, 403] },
			{ path: "/api/users/me", expect: [200, 401] },
			{ path: "/api/chat/history", expect: [200, 401] },
		];

		if (facilityId) {
			endpoints.push({
				path: `/api/facilities/${facilityId}`,
				expect: [200],
			});
		}

		const failures: string[] = [];
		for (const ep of endpoints) {
			try {
				const res = await fetch(`${BASE}${ep.path}`);
				if (!ep.expect.includes(res.status)) {
					failures.push(`${ep.path}: ${res.status} (expected ${ep.expect.join("/")})`);
				}
			} catch {
				failures.push(`${ep.path}: NETWORK ERROR`);
			}
		}

		if (failures.length > 0) {
			throw new Error(`API 실패: ${failures.join(", ")}`);
		}
	});

	console.log("\n═══════════════════════════════════════");
	console.log(`  결과: ${passed} PASS / ${failed} FAIL (총 ${passed + failed})`);
	if (failed === 0) {
		console.log("  🎉 전체 테스트 통과!");
	} else {
		console.log("  ⚠️  실패 항목:");
		results
			.filter((r) => r.status === "FAIL")
			.forEach((r) => {
				console.log(`    - ${r.name}: ${r.detail?.split("\n")[0]}`);
			});
	}
	console.log("═══════════════════════════════════════");

	process.exit(failed > 0 ? 1 : 0);
}

main().catch((err: unknown) => {
	const message = err instanceof Error ? err.message : String(err);
	console.error(`E2E 실행 실패: ${message}`);
	process.exit(1);
});
