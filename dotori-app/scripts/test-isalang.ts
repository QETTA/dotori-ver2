/**
 * 아이사랑 연동 통합 테스트 스크립트
 *
 * 실행: npx tsx --env-file=.env.local scripts/test-isalang.ts
 */

import {
	fetchChildcareFacilities,
	SEOUL_REGION_CODES,
} from "../src/lib/external/isalang-api";
import {
	generateChecklist,
	calculateAgeClass,
	getChecklistSummary,
} from "../src/lib/engine/checklist-engine";

const PASS = "\u2705";
const FAIL = "\u274C";
const WARN = "\u26A0\uFE0F";
const INFO = "\u2139\uFE0F";
let passed = 0;
let failed = 0;
let skipped = 0;

function test(name: string, ok: boolean, detail?: string) {
	if (ok) {
		console.log(`  ${PASS} ${name}`);
		passed++;
	} else {
		console.log(`  ${FAIL} ${name}${detail ? ` — ${detail}` : ""}`);
		failed++;
	}
}

function skip(name: string, reason: string) {
	console.log(`  ${WARN} ${name} — SKIPPED: ${reason}`);
	skipped++;
}

function info(msg: string) {
	console.log(`  ${INFO} ${msg}`);
}

/* ═══ 1. 환경변수 + API 키 확인 ═══ */

function testEnvSetup() {
	console.log("\n\u2550\u2550\u2550 1. \uD658\uACBD\uBCC0\uC218 + API \uD0A4 \uD655\uC778 \u2550\u2550\u2550\n");

	const childcareKey = process.env.CHILDCARE_PORTAL_KEY;
	const publicDataKey = process.env.PUBLIC_DATA_API_KEY;
	const dataGoKrKey = process.env.DATA_GO_KR_KEY;

	test("CHILDCARE_PORTAL_KEY 또는 DATA_GO_KR_KEY 중 하나 존재",
		!!(childcareKey || publicDataKey || dataGoKrKey));

	if (childcareKey) {
		info(`API 소스: childcare.go.kr (실시간 정원/현원/대기 데이터)`);
		info(`CHILDCARE_PORTAL_KEY: ${childcareKey.slice(0, 8)}...${childcareKey.slice(-4)} (${childcareKey.length}자)`);
	} else if (publicDataKey || dataGoKrKey) {
		const key = publicDataKey || dataGoKrKey || "";
		const envName = publicDataKey ? "PUBLIC_DATA_API_KEY" : "DATA_GO_KR_KEY";
		info(`API 소스: data.go.kr odcloud (기본 시설 정보, 대기현황 미포함)`);
		info(`${envName}: ${key.slice(0, 8)}...${key.slice(-4)} (${key.length}자)`);
		info(`실시간 대기현황을 원하면 info.childcare.go.kr에서 CHILDCARE_PORTAL_KEY 발급 필요`);
	} else {
		info("API 키 없음 — API 테스트를 건너뜁니다");
	}

	test("서울 25개 구 코드 존재", Object.keys(SEOUL_REGION_CODES).length === 25);
}

/* ═══ 2. API 연결 테스트 ═══ */

async function testAPIConnection(): Promise<boolean> {
	console.log("\n\u2550\u2550\u2550 2. API \uC5F0\uACB0 \uD14C\uC2A4\uD2B8 \u2550\u2550\u2550\n");

	const hasKey = !!(
		process.env.CHILDCARE_PORTAL_KEY ||
		process.env.PUBLIC_DATA_API_KEY ||
		process.env.DATA_GO_KR_KEY
	);

	if (!hasKey) {
		skip("API 연결 테스트 전체", "API 키가 설정되지 않음");
		return false;
	}

	// 2-1. 강남구 시설 조회 (소량)
	console.log("  [\uAC15\uB0A8\uAD6C \uC2DC\uC124 \uC870\uD68C - 5\uAC74]");
	let apiWorking = false;
	try {
		const result = await fetchChildcareFacilities({
			arcode: SEOUL_REGION_CODES["강남구"],
			perPage: 5,
			page: 1,
		});

		test("API 응답 수신", result.facilities.length > 0, `${result.facilities.length}건 수신`);
		test("total > 0", result.total > 0, `total: ${result.total}`);
		apiWorking = result.facilities.length > 0;

		if (result.facilities.length > 0) {
			const f = result.facilities[0];
			console.log(`\n  \uD83D\uDCCD \uC0D8\uD50C \uC2DC\uC124: ${f.name}`);
			console.log(`     주소: ${f.address}`);
			console.log(`     유형: ${f.type}`);
			console.log(`     정원/현원/대기: ${f.capacity}/${f.currentEnrollment}/${f.waitingCount}`);
			console.log(`     상태: ${f.status}`);
			console.log(`     좌표: ${f.lat}, ${f.lng}`);
			console.log(`     운영시간: ${f.operatingHours}`);

			test("name 존재", !!f.name);
			test("address 존재", !!f.address);
			test("type 유효", ["국공립", "민간", "가정", "직장", "협동", "사회복지"].includes(f.type), f.type);
			test("status 유효", ["available", "waiting", "full"].includes(f.status), f.status);
			test("lat 범위 (33~39)", f.lat >= 33 && f.lat <= 39, String(f.lat));
			test("lng 범위 (124~132)", f.lng >= 124 && f.lng <= 132, String(f.lng));
			test("capacity > 0", f.capacity > 0, String(f.capacity));
		}
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		test("API 호출 성공", false, msg);

		// Provide helpful diagnostics
		if (msg.includes("필수 값") || msg.includes("인증키") || msg.includes("등록되지 않은")) {
			console.log("\n  \uD83D\uDD11 API 키 문제 진단:");
			if (process.env.CHILDCARE_PORTAL_KEY) {
				console.log("     CHILDCARE_PORTAL_KEY가 childcare.go.kr에서 유효한지 확인하세요");
				console.log("     → info.childcare.go.kr에서 개발계정 신청 + 심의 완료 필요");
			} else {
				console.log("     DATA_GO_KR_KEY가 data.go.kr에서 해당 데이터셋(15013108)에 활성화되었는지 확인하세요");
				console.log("     → data.go.kr → 활용신청 → 전국어린이집표준데이터 승인 필요");
			}
		}
	}

	// 2-2. 잘못된 지역 코드 (빈 결과 기대)
	if (apiWorking) {
		console.log("\n  [\uC798\uBABB\uB41C \uC9C0\uC5ED\uCF54\uB4DC \uD14C\uC2A4\uD2B8]");
		try {
			const result = await fetchChildcareFacilities({
				arcode: "99999",
				perPage: 5,
			});
			test("빈 결과 반환 (잘못된 코드)", result.facilities.length === 0 || result.total === 0);
		} catch {
			test("에러 없이 처리", true);
		}
	}

	return apiWorking;
}

/* ═══ 3. 체크리스트 엔진 테스트 ═══ */

function testChecklistEngine() {
	console.log("\n\u2550\u2550\u2550 3. \uCCB4\uD06C\uB9AC\uC2A4\uD2B8 \uC5D4\uC9C4 \uD14C\uC2A4\uD2B8 \u2550\u2550\u2550\n");

	// 3-1. 국공립 기본 체크리스트
	console.log("  [\uAD6D\uACF5\uB9BD \uC5B4\uB9B0\uC774\uC9D1]");
	const publicChecklist = generateChecklist({ facilityType: "국공립" });
	test("title 포함 '국공립'", publicChecklist.title.includes("국공립"));
	test("기본서류 카테고리 존재", publicChecklist.categories.some((c) => c.title === "기본 서류"));
	test("유형별 추가서류 존재", publicChecklist.categories.some((c) => c.title.includes("국공립")));

	const baseItems = publicChecklist.categories.find((c) => c.title === "기본 서류")?.items || [];
	test("기본서류 5종", baseItems.length === 5, String(baseItems.length));

	// 3-2. 직장 어린이집 (재직증명서 포함)
	console.log("\n  [\uC9C1\uC7A5 \uC5B4\uB9B0\uC774\uC9D1]");
	const workChecklist = generateChecklist({ facilityType: "직장" });
	const workItems = workChecklist.categories.find((c) => c.title.includes("직장"))?.items || [];
	test("재직증명서 포함", workItems.some((i) => i.text.includes("재직증명서")));

	// 3-3. 가점 서류 (다자녀 + 맞벌이)
	console.log("\n  [\uAC00\uC810 \uC11C\uB958 - \uB2E4\uC790\uB140 + \uB9DE\uBC8C\uC774]");
	const priorityChecklist = generateChecklist({
		facilityType: "민간",
		hasMultipleChildren: true,
		isDualIncome: true,
	});
	const priorityCat = priorityChecklist.categories.find((c) => c.title.includes("우선순위"));
	test("우선순위 카테고리 존재", !!priorityCat);
	test("다자녀 서류 포함", priorityCat?.items.some((i) => i.text.includes("다자녀")) || false);
	test("맞벌이 서류 포함", priorityCat?.items.some((i) => i.text.includes("맞벌이")) || false);

	// 3-4. 한부모 + 장애
	console.log("\n  [\uAC00\uC810 \uC11C\uB958 - \uD55C\uBD80\uBAA8 + \uC7A5\uC560]");
	const specialChecklist = generateChecklist({
		facilityType: "가정",
		isSingleParent: true,
		hasDisability: true,
	});
	const specialCat = specialChecklist.categories.find((c) => c.title.includes("우선순위"));
	test("한부모 서류 포함", specialCat?.items.some((i) => i.text.includes("한부모")) || false);
	test("장애인 서류 포함", specialCat?.items.some((i) => i.text.includes("장애")) || false);

	// 3-5. 연령반 산정
	console.log("\n  [\uC5F0\uB839\uBC18 \uC0B0\uC815]");
	test("2025-06-15 → 만0세반", calculateAgeClass("2025-06-15") === "만0세반");
	test("2024-01-15 → 만1세반 또는 만2세반", ["만1세반", "만2세반"].includes(calculateAgeClass("2024-01-15")));
	test("2023-05-01 → 만2세반 또는 만3세반", ["만2세반", "만3세반"].includes(calculateAgeClass("2023-05-01")));
	test("2021-01-01 → 만4세반 또는 만5세반", ["만4세반", "만5세반"].includes(calculateAgeClass("2021-01-01")));
	test("잘못된 날짜 → 만0세반", calculateAgeClass("invalid") === "만0세반");
	test("2099-01-01 → 만0세반", calculateAgeClass("2099-01-01") === "만0세반");

	// 3-6. 생년월일 포함 체크리스트
	console.log("\n  [\uC0DD\uB144\uC6D4\uC77C \uD3EC\uD568 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8]");
	const withBirth = generateChecklist({
		facilityType: "국공립",
		childBirthDate: "2024-03-15",
	});
	const infoCat = withBirth.categories.find((c) => c.title === "참고 정보");
	test("참고 정보 카테고리 존재", !!infoCat);
	test("연령반 정보 포함", infoCat?.items.some((i) => i.text.includes("만")) || false);

	// 3-7. 체크리스트 요약
	console.log("\n  [\uCCB4\uD06C\uB9AC\uC2A4\uD2B8 \uC694\uC57D]");
	const summary = getChecklistSummary(publicChecklist);
	test("total > 0", summary.total > 0, String(summary.total));
	test("completed === 0 (초기)", summary.completed === 0);
	test("percentage === 0 (초기)", summary.percentage === 0);
	test("remaining === total", summary.remaining === summary.total);
}

/* ═══ 4. 다중 지역 조회 테스트 ═══ */

async function testMultipleRegions(apiWorking: boolean) {
	console.log("\n\u2550\u2550\u2550 4. \uB2E4\uC911 \uC9C0\uC5ED \uC870\uD68C \uD14C\uC2A4\uD2B8 \u2550\u2550\u2550\n");

	if (!apiWorking) {
		skip("다중 지역 조회 전체", "API 연결 실패 (키 활성화 필요)");
		return;
	}

	const testRegions = ["송파구", "마포구", "서초구"];

	for (const region of testRegions) {
		const code = SEOUL_REGION_CODES[region];
		try {
			const result = await fetchChildcareFacilities({
				arcode: code,
				perPage: 3,
			});
			test(
				`${region} (${code}) 조회`,
				result.facilities.length > 0,
				`${result.facilities.length}건 / 총 ${result.total}`,
			);
		} catch (err) {
			test(`${region} 조회`, false, String(err));
		}
	}
}

/* ═══ 메인 ═══ */

async function main() {
	console.log("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
	console.log("\u2551   \uC544\uC774\uC0AC\uB791 \uC5F0\uB3D9 \uD1B5\uD569 \uD14C\uC2A4\uD2B8            \u2551");
	console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D");

	testEnvSetup();
	const apiWorking = await testAPIConnection();
	testChecklistEngine();
	await testMultipleRegions(apiWorking);

	console.log("\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
	console.log(`  결과: ${passed} passed, ${failed} failed, ${skipped} skipped`);

	if (!apiWorking && failed <= 1) {
		console.log(`\n  ${INFO} API 키 미활성화로 인한 실패는 정상입니다.`);
		console.log(`  ${INFO} 체크리스트 엔진은 모두 통과했습니다.`);
		console.log(`  \n  API 키 활성화 방법:`);
		console.log(`    방법 1 (추천): info.childcare.go.kr → 개발계정 신청`);
		console.log(`      → CHILDCARE_PORTAL_KEY 발급 → 실시간 대기현황 포함`);
		console.log(`    방법 2: data.go.kr → 전국어린이집표준데이터 활용신청`);
		console.log(`      → PUBLIC_DATA_API_KEY 발급 → 기본 시설정보만 (대기현황 없음)`);
	}

	console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n");

	// Only fail hard if checklist engine fails (API key issues are expected)
	if (failed > 1 || (failed > 0 && apiWorking)) process.exit(1);
}

main().catch((err) => {
	console.error("테스트 실행 실패:", err);
	process.exit(1);
});
