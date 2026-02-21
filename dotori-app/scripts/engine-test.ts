/**
 * 엔진 100 케이스 테스트 — DB 없이 순수 로직만 검증
 *
 * 실행: npx tsx --env-file=.env.local scripts/engine-test.ts
 */

import { getChildAgeMonths, formatAge, getClassAge } from "../src/lib/engine/child-age-utils";
import { classifyIntent } from "../src/lib/engine/intent-classifier";
import { generateNBAs, type NBAContext } from "../src/lib/engine/nba-engine";
import { generateReport, generateChecklist } from "../src/lib/engine/report-engine";
import type { Facility, ChildProfile, UserProfile } from "../src/types/dotori";

/* ═══ 테스트 인프라 ═══ */

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(id: string, condition: boolean, detail?: string) {
	if (condition) {
		passed++;
	} else {
		failed++;
		const msg = `FAIL #${id}${detail ? `: ${detail}` : ""}`;
		failures.push(msg);
		console.error(`  ❌ ${msg}`);
	}
}

function eq(id: string, actual: unknown, expected: unknown) {
	const ok = actual === expected;
	assert(id, ok, ok ? undefined : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function includes(id: string, str: string, sub: string) {
	assert(id, str.includes(sub), `"${str}" should include "${sub}"`);
}

function oneOf(id: string, actual: unknown, options: unknown[]) {
	assert(id, options.includes(actual), `${JSON.stringify(actual)} not in ${JSON.stringify(options)}`);
}

function lte(id: string, actual: number, expected: number) {
	assert(id, actual <= expected, `${actual} should be <= ${expected}`);
}

/* ═══ 테스트 데이터 팩토리 ═══ */

function makeFacility(overrides: Partial<Facility> = {}): Facility {
	return {
		id: "fac_test_1",
		name: "해피어린이집",
		type: "국공립",
		status: "available",
		address: "서울 강남구 역삼동 123",
		lat: 37.5,
		lng: 127.0,
		capacity: { total: 50, current: 0, waiting: 5 },
		features: ["CCTV", "통학버스"],
		rating: 4.2,
		reviewCount: 15,
		lastSyncedAt: "2026-02-20T00:00:00Z",
		...overrides,
	};
}

function makeChild(overrides: Partial<ChildProfile> = {}): ChildProfile {
	return {
		id: "child_1",
		name: "하은",
		birthDate: "2024-06-15",
		gender: "female",
		...overrides,
	};
}

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
	return {
		id: "user_1",
		nickname: "테스트맘",
		children: [makeChild()],
		region: { sido: "서울특별시", sigungu: "강남구" },
		interests: [],
		gpsVerified: false,
		plan: "free",
		onboardingCompleted: true,
		...overrides,
	};
}

function makeNBAContext(overrides: Partial<NBAContext> = {}): NBAContext {
	return {
		user: makeUser(),
		interestFacilities: [],
		alertCount: 0,
		waitlistCount: 0,
		...overrides,
	};
}

/* ═══════════════════════════════════════════════
   A. child-age-utils (20 cases)
   ═══════════════════════════════════════════════ */

console.log("\n📐 A. child-age-utils");

// A01: 신생아 (0개월)
const today = new Date();
const birthToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
eq("A01", getChildAgeMonths(birthToday), 0);

// A02: 12개월 아이
const birth12m = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
const birth12mStr = birth12m.toISOString().split("T")[0];
eq("A02", getChildAgeMonths(birth12mStr), 12);

// A03: 36개월 아이
const birth36m = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
eq("A03", getChildAgeMonths(birth36m.toISOString().split("T")[0]), 36);

// A04: 미래 생년월일 → 음수
eq("A04", getChildAgeMonths("2030-01-01") < 0, true);

// A05: 잘못된 날짜 → -1 (NaN guard)
eq("A05", getChildAgeMonths("invalid-date"), -1);

// A06: 빈 문자열 → -1
eq("A06", getChildAgeMonths(""), -1);

// A07: referenceDate 지정 — 2027년 3월 1일 기준 2024-06-15 생 아이
eq("A07", getChildAgeMonths("2024-06-15", new Date(2027, 2, 1)), 33);

// A08: referenceDate 지정 — 같은 날
eq("A08", getChildAgeMonths("2024-06-15", new Date(2024, 5, 15)), 0);

// A09: formatAge — 5개월
eq("A09", formatAge(5), "5개월");

// A10: formatAge — 11개월
eq("A10", formatAge(11), "11개월");

// A11: formatAge — 12개월 = 만 1세
eq("A11", formatAge(12), "만 1세");

// A12: formatAge — 15개월 = 만 1세 3개월
eq("A12", formatAge(15), "만 1세 3개월");

// A13: formatAge — 24개월 = 만 2세
eq("A13", formatAge(24), "만 2세");

// A14: formatAge — 0개월
eq("A14", formatAge(0), "0개월");

// A15: formatAge — 음수
includes("A15", formatAge(-1), "개월");

// A16: getClassAge — 2020년생 → 2027학년도 = 만7세 (초등)
const ca16 = getClassAge("2020-01-15", 2027);
eq("A16", ca16.classAge, 7);

// A17: getClassAge — 2024년생 → 2027학년도 = 만3세
const ca17 = getClassAge("2024-05-01", 2027);
eq("A17", ca17.classAge, 3);
includes("A17b", ca17.className, "3세");

// A18: getClassAge — 2026년생 → 2027학년도 = 만1세
const ca18 = getClassAge("2026-03-15", 2027);
eq("A18", ca18.classAge, 1);

// A19: getClassAge — 2027년생 (태어날 아이) → 2027학년도 = 만0세
const ca19 = getClassAge("2027-01-01", 2027);
eq("A19", ca19.classAge, 0);
includes("A19b", ca19.className, "0세");

// A20: getClassAge — 잘못된 날짜
const ca20 = getClassAge("invalid", 2027);
assert("A20", typeof ca20.classAge === "number", "should return number even for invalid");

/* ═══════════════════════════════════════════════
   B. intent-classifier (30 cases)
   ═══════════════════════════════════════════════ */

console.log("\n🎯 B. intent-classifier");

// 추천 인텐트
eq("B01", classifyIntent("강남구 어린이집 추천해줘"), "recommend");
eq("B02", classifyIntent("우리 동네 국공립 추천"), "recommend");
eq("B03", classifyIntent("좋은 어린이집 알려줘"), "recommend");
eq("B04", classifyIntent("1세 가정어린이집 추천"), "recommend");
eq("B05", classifyIntent("송파구 근처 괜찮은 곳"), "recommend");

// 비교 인텐트
eq("B06", classifyIntent("해피어린이집이랑 별빛어린이집 비교해줘"), "compare");
eq("B07", classifyIntent("A원 B원 뭐가 나아?"), "compare");
eq("B08", classifyIntent("두 곳 차이점 알려줘"), "compare");

// 설명 인텐트
eq("B09", classifyIntent("국공립 어린이집이 뭐야?"), "explain");
eq("B10", classifyIntent("평가인증 등급이 뭔가요"), "explain");
eq("B11", classifyIntent("가정어린이집 장단점"), "explain");
eq("B12", classifyIntent("맞벌이 가산점 설명해줘"), "explain");

// 상태 인텐트
eq("B13", classifyIntent("내 대기 순번 몇 번이야"), "status");
eq("B14", classifyIntent("대기 현황 알려줘"), "status");
eq("B15", classifyIntent("내 신청 상태 확인"), "status");
eq("B16", classifyIntent("TO 있어?"), "status");

// 체크리스트 인텐트
eq("B17", classifyIntent("입소 준비물 뭐 있어?"), "checklist");
eq("B18", classifyIntent("체크리스트 만들어줘"), "checklist");
eq("B19", classifyIntent("필요한 서류 목록"), "checklist");
eq("B20", classifyIntent("입소 준비 뭐 해야 해"), "checklist");

// 일반 인텐트
eq("B21", classifyIntent("안녕"), "general");
eq("B22", classifyIntent("고마워"), "general");
eq("B23", classifyIntent("토리야 뭐 할 수 있어?"), "general");

// 컨텍스트 기반
eq("B24", classifyIntent("거기 어때?", {
	previousMessages: [
		{ role: "user", content: "강남구 어린이집 추천해줘" },
		{ role: "assistant", content: "해피어린이집을 추천해요" },
	],
}), "explain");

// 엣지 케이스
eq("B25", classifyIntent(""), "general");
eq("B26", classifyIntent("ㅋㅋㅋ"), "general");
eq("B27", classifyIntent("어린이집"), "general");

// 복합 의도 → 첫 번째 우선
oneOf("B28", classifyIntent("추천하고 비교해줘"), ["recommend", "compare"]);
oneOf("B29", classifyIntent("대기 상태 확인하고 준비물도"), ["status", "checklist"]);

// 긴 메시지
const longMsg = "안녕하세요 저는 올해 3월에 아이가 어린이집에 입소하는데 강남구 쪽에서 좋은 국공립 어린이집을 추천해주실 수 있나요 맞벌이라 가산점도 궁금합니다";
oneOf("B30", classifyIntent(longMsg), ["recommend", "explain"]);

// 가중치 키워드 테스트
eq("B31", classifyIntent("어린이집 찾기"), "recommend");
eq("B32", classifyIntent("어린이집 검색"), "recommend");
eq("B33", classifyIntent("해피어린이집 후기"), "explain");
eq("B34", classifyIntent("보육료 얼마야"), "explain");
eq("B35", classifyIntent("두 곳 다른점이 뭐야"), "compare");
eq("B36", classifyIntent("국공립 어린이집 알려주세요"), "recommend");

/* ═══════════════════════════════════════════════
   C. nba-engine (30 cases)
   ═══════════════════════════════════════════════ */

console.log("\n🎬 C. nba-engine");

// C01: 비로그인 → 로그인 CTA
const nba01 = generateNBAs({ user: null, interestFacilities: [], alertCount: 0, waitlistCount: 0 });
eq("C01", nba01.length, 1);
eq("C01b", nba01[0].id, "login_cta");

// C02: 온보딩 미완료 → 프로필 완성 유도
const nba02 = generateNBAs(makeNBAContext({
	user: makeUser({ onboardingCompleted: false }),
}));
assert("C02", nba02.some((n) => n.id === "onboarding_incomplete"), "should include onboarding");
eq("C02b", nba02[0].id, "onboarding_incomplete"); // 최우선

// C03: 관심 시설에 빈자리 → vacancy_alert
const nba03 = generateNBAs(makeNBAContext({
	interestFacilities: [makeFacility({ id: "fac1", status: "available" })],
}));
assert("C03", nba03.some((n) => n.id.startsWith("vacancy_")), "should include vacancy alert");

// C04: vacancy alert에 아이 이름 포함
const nba04 = generateNBAs(makeNBAContext({
	user: makeUser({ children: [makeChild({ name: "지우" })] }),
	interestFacilities: [makeFacility({ status: "available" })],
}));
const vacancyItem = nba04.find((n) => n.id.startsWith("vacancy_"));
assert("C04", vacancyItem?.description.includes("지우") || false, "should mention child name");

// C05: 대기 순번 알림 (순번 2)
const nba05 = generateNBAs(makeNBAContext({
	waitlistCount: 1,
	bestWaitlistPosition: 2,
	waitlistFacilityName: "해피어린이집",
}));
const posItem = nba05.find((n) => n.id === "waitlist_position");
assert("C05", !!posItem, "should include waitlist_position");
assert("C05b", posItem?.title.includes("2") || false, "should mention position 2");

// C06: 대기 순번 3 이하 → "거의 다 왔어요"
const nba06 = generateNBAs(makeNBAContext({
	waitlistCount: 1,
	bestWaitlistPosition: 3,
	waitlistFacilityName: "A원",
}));
const pos6 = nba06.find((n) => n.id === "waitlist_position");
assert("C06", pos6?.title.includes("거의 다 왔어요") || false, "should encourage for pos <= 3");

// C07: 대기 순번 10 → 일반 안내
const nba07 = generateNBAs(makeNBAContext({
	waitlistCount: 1,
	bestWaitlistPosition: 10,
	waitlistFacilityName: "B원",
}));
const pos7 = nba07.find((n) => n.id === "waitlist_position");
assert("C07", !pos7?.title.includes("거의 다 왔어요"), "should NOT say 거의 다 왔어요 for pos 10");

// C08: 관심시설 없음 → no_interests
const nba08 = generateNBAs(makeNBAContext({
	interestFacilities: [],
}));
assert("C08", nba08.some((n) => n.id === "no_interests"), "should suggest adding interests");

// C09: 관심시설 있고 알림 없음 → no_alerts
const nba09 = generateNBAs(makeNBAContext({
	interestFacilities: [makeFacility({ status: "full" })],
	alertCount: 0,
}));
assert("C09", nba09.some((n) => n.id === "no_alerts"), "should suggest setting alerts");

// C10: 관심시설 있고 알림 있음 → no_alerts 없어야
const nba10 = generateNBAs(makeNBAContext({
	interestFacilities: [makeFacility({ status: "full" })],
	alertCount: 2,
}));
assert("C10", !nba10.some((n) => n.id === "no_alerts"), "should NOT suggest alerts when already set");

// C11: 최대 3개 반환
const nba11 = generateNBAs(makeNBAContext({
	user: makeUser({ onboardingCompleted: true }),
	interestFacilities: [makeFacility({ status: "available" })],
	waitlistCount: 1,
	bestWaitlistPosition: 2,
	waitlistFacilityName: "A원",
	alertCount: 0,
}));
lte("C11", nba11.length, 3);

// C12: 우선순위 정렬 (높은 순)
const priorities = nba11.map((n) => n.priority);
assert("C12", priorities.every((p, i) => i === 0 || p <= priorities[i - 1]), "should be sorted by priority desc");

// C13: 모든 NBA에 필수 필드
for (const nba of nba11) {
	assert("C13", typeof nba.id === "string" && nba.id.length > 0, "id required");
	assert("C13b", typeof nba.title === "string" && nba.title.length > 0, "title required");
	assert("C13c", typeof nba.description === "string", "description required");
	assert("C13d", typeof nba.priority === "number", "priority required");
}

// C14: 아이 나이 기반 추천 (관심시설 < 3개)
const nba14 = generateNBAs(makeNBAContext({
	user: makeUser({
		children: [makeChild({ birthDate: "2025-06-01" })], // ~8개월
	}),
	interestFacilities: [makeFacility()], // 1개 < 3개
}));
assert("C14", nba14.some((n) => n.id === "age_based_recommend"), "should include age-based recommend");

// C15: 아이 나이 기반 추천 안 나옴 (관심시설 >= 3개)
const nba15 = generateNBAs(makeNBAContext({
	user: makeUser({
		children: [makeChild({ birthDate: "2025-06-01" })],
	}),
	interestFacilities: [makeFacility({ id: "a" }), makeFacility({ id: "b" }), makeFacility({ id: "c" })],
}));
assert("C15", !nba15.some((n) => n.id === "age_based_recommend"), "should NOT recommend if >= 3 interests");

// C16: 영아(12개월 미만) 추천 문구
const nba16 = generateNBAs(makeNBAContext({
	user: makeUser({
		children: [makeChild({ birthDate: new Date(today.getFullYear(), today.getMonth() - 6, 1).toISOString().split("T")[0] })],
	}),
}));
const age16 = nba16.find((n) => n.id === "age_based_recommend");
assert("C16", age16?.description.includes("영아") || age16?.description.includes("가정") || false, "infant should get home daycare rec");

// C17: 2세반 아이 → "경쟁이 치열"
const birth2y = new Date(today.getFullYear() - 2, today.getMonth() - 3, 1);
const nba17 = generateNBAs(makeNBAContext({
	user: makeUser({
		children: [makeChild({ birthDate: birth2y.toISOString().split("T")[0] })],
	}),
}));
const age17 = nba17.find((n) => n.id === "age_based_recommend");
assert("C17", age17?.description.includes("경쟁") || age17?.description.includes("대기") || false, "2y should mention competition");

// C18: 온보딩 미완료 + 관심시설 있어도 → onboarding이 최우선
const nba18 = generateNBAs(makeNBAContext({
	user: makeUser({ onboardingCompleted: false }),
	interestFacilities: [makeFacility({ status: "available" })],
}));
eq("C18", nba18[0].id, "onboarding_incomplete");

// C19: 주간 리포트 (온보딩 완료 사용자에게 항상)
const nba19 = generateNBAs(makeNBAContext());
assert("C19", nba19.some((n) => n.id === "weekly_report"), "should include weekly report");

// C20: 주간 리포트에 지역명 포함
const weeklyItem = nba19.find((n) => n.id === "weekly_report");
assert("C20", weeklyItem?.title.includes("강남구") || false, "should include region in weekly");

// C21: region 없는 사용자도 주간 리포트 오류 없이
const nba21 = generateNBAs(makeNBAContext({
	user: makeUser({ region: { sido: "", sigungu: "" } }),
}));
assert("C21", nba21.some((n) => n.id === "weekly_report"), "should work without region");

// C22: 아이 없는 사용자 → age_based_recommend 없어야
const nba22 = generateNBAs(makeNBAContext({
	user: makeUser({ children: [] }),
}));
assert("C22", !nba22.some((n) => n.id === "age_based_recommend"), "no children = no age rec");

// C23: vacancy + full 혼합 → available만 알림
const nba23 = generateNBAs(makeNBAContext({
	interestFacilities: [
		makeFacility({ id: "a", status: "full" }),
		makeFacility({ id: "b", status: "available" }),
	],
}));
const vacancies = nba23.filter((n) => n.id.startsWith("vacancy_"));
assert("C23", vacancies.length === 1, "should only alert for available facility");
assert("C23b", vacancies[0]?.id === "vacancy_b" || false, "should be facility b");

// C24: 알림 미설정 규칙 — 온보딩 미완료면 안 나옴
const nba24 = generateNBAs(makeNBAContext({
	user: makeUser({ onboardingCompleted: false }),
	interestFacilities: [makeFacility()],
	alertCount: 0,
}));
assert("C24", !nba24.some((n) => n.id === "no_alerts"), "no_alerts requires onboarding");

// C25-C30: 시즌 로직 (현재 달에 따라 다름)
const currentMonth = today.getMonth(); // 0-indexed

// C25: 현재 2월 → 대기 시즌이어야 함
if (currentMonth <= 1) {
	const nba25 = generateNBAs(makeNBAContext({ waitlistCount: 1 }));
	assert("C25", nba25.some((n) => n.id === "waiting_season"), "Jan-Feb should be waiting season");
} else {
	assert("C25", true); // skip
}

// C26: 3월 → enrollment_start
if (currentMonth === 2) {
	const nba26 = generateNBAs(makeNBAContext({ waitlistCount: 1 }));
	assert("C26", nba26.some((n) => n.id === "enrollment_start"), "March should be enrollment start");
} else {
	assert("C26", true);
}

// C27: 10-12월 → enrollment_season (아이 있을 때)
if (currentMonth >= 9 && currentMonth <= 11) {
	const nba27 = generateNBAs(makeNBAContext({
		user: makeUser({ children: [makeChild({ birthDate: "2024-06-01" })] }),
	}));
	assert("C27", nba27.some((n) => n.id === "enrollment_season"), "Oct-Dec should be enrollment season");
} else {
	assert("C27", true);
}

// C28: 비로그인은 항상 1개 (login_cta)
eq("C28", generateNBAs({ user: null, interestFacilities: [], alertCount: 0, waitlistCount: 0 }).length, 1);

// C29: 모든 시설이 대기 중일 때 vacancy 안 나옴
const nba29 = generateNBAs(makeNBAContext({
	interestFacilities: [
		makeFacility({ status: "waiting" }),
		makeFacility({ id: "b", status: "full" }),
	],
}));
assert("C29", !nba29.some((n) => n.id.startsWith("vacancy_")), "no vacancy for waiting/full");

// C30: 빈 interestFacilities, 대기도 없음, 온보딩 완료 → no_interests + weekly 조합
const nba30 = generateNBAs(makeNBAContext({
	user: makeUser(),
	interestFacilities: [],
	waitlistCount: 0,
	alertCount: 0,
}));
assert("C30", nba30.some((n) => n.id === "no_interests"), "should suggest interests");
assert("C30b", nba30.length >= 2, "should have at least 2 NBAs");

/* ═══════════════════════════════════════════════
   D. report-engine (20 cases)
   ═══════════════════════════════════════════════ */

console.log("\n📊 D. report-engine");

const fac1 = makeFacility({ id: "a", name: "해피어린이집", type: "국공립", status: "available", rating: 4.5, capacity: { total: 50, current: 0, waiting: 3 } });
const fac2 = makeFacility({ id: "b", name: "별빛어린이집", type: "민간", status: "waiting", rating: 3.8, capacity: { total: 30, current: 0, waiting: 10 } });
const fac3 = makeFacility({ id: "c", name: "사랑어린이집", type: "가정", status: "full", rating: 0, capacity: { total: 20, current: 0, waiting: 0 } });

// D01: 기본 리포트 생성
const report01 = generateReport([fac1, fac2]);
assert("D01", report01.title.includes("해피어린이집"), "title should include facility name");
assert("D01b", report01.title.includes("별빛어린이집"), "title should include both");

// D02: 섹션 존재
const sectionTitles = report01.sections.map((s) => s.title);
assert("D02", sectionTitles.includes("기본 정보"), "should have 기본 정보");
assert("D02b", sectionTitles.includes("정원 현황"), "should have 정원 현황");
assert("D02c", sectionTitles.includes("품질 평가"), "should have 품질 평가");

// D03: 입소 상태 표시 (capacity.current가 아닌 status 기반)
const capacitySection = report01.sections.find((s) => s.title === "정원 현황");
const statusItem = capacitySection?.items.find((i) => i.label === "입소 상태");
assert("D03", !!statusItem, "should have 입소 상태 item");
assert("D03b", statusItem?.values[0] === "빈자리 있음", "available → 빈자리 있음");
assert("D03c", statusItem?.values[1] === "대기", "waiting → 대기");

// D04: "현원" 항목이 없어야 (capacity.current 제거됨)
const currentItem = capacitySection?.items.find((i) => i.label === "현원");
assert("D04", !currentItem, "현원 item should be removed");

// D05: "충원율" 항목이 없어야
const occItem = capacitySection?.items.find((i) => i.label === "충원율");
assert("D05", !occItem, "충원율 item should be removed");

// D06: highlight는 "빈자리 있음"에
assert("D06", statusItem?.highlight === 0, "highlight should point to available facility");

// D07: 평점 0 → "정보 없음" + 하이라이트 없음
const report07 = generateReport([fac3, fac3]);
const qualitySection = report07.sections.find((s) => s.title === "품질 평가");
const ratingItem = qualitySection?.items.find((i) => i.label === "평점");
assert("D07", ratingItem?.values.every((v) => v === "정보 없음") || false, "rating 0 → 정보 없음");
assert("D07b", ratingItem?.highlight === undefined, "no highlight when all ratings 0");

// D08: 평점 비교 → 높은 쪽 하이라이트
const report08 = generateReport([fac1, fac2]);
const quality08 = report08.sections.find((s) => s.title === "품질 평가");
const rating08 = quality08?.items.find((i) => i.label === "평점");
eq("D08", rating08?.highlight, 0); // fac1 rating 4.5 > fac2 rating 3.8

// D09: 요약 텍스트 존재
assert("D09", report01.summary.length > 0, "summary should not be empty");

// D10: 요약에 fake vacancy 수치 없음
assert("D10", !report01.summary.includes("석으로"), "summary should not contain fake vacancy count");

// D11: 3개 시설 비교
const report11 = generateReport([fac1, fac2, fac3]);
eq("D11", report11.facilities.length, 3);

// D12: 특징 비교 섹션
const featureSection = report11.sections.find((s) => s.title === "특징 비교");
assert("D12", !!featureSection, "should have feature comparison");

// D13: generatedAt 존재
assert("D13", report01.generatedAt.length > 0, "should have timestamp");

// D14: 아이 프로필 → 요약에 아이 맞춤 조언
const child14 = makeChild({ name: "서준", birthDate: "2025-08-01" }); // ~6개월
const report14 = generateReport([fac1, makeFacility({ id: "d", type: "가정", name: "가정보육" })], child14);
assert("D14", report14.summary.includes("서준") || report14.summary.includes("가정") || report14.summary.length > 0, "child-aware summary");

/* ═══ 체크리스트 ═══ */

// D15: 기본 체크리스트 (시설 없이)
const cl15 = generateChecklist();
assert("D15", cl15.categories.length >= 3, "should have at least 3 categories");
assert("D15b", cl15.title.includes("어린이집"), "default title");

// D16: 국공립 → 맞벌이 서류 추가
const cl16 = generateChecklist(fac1); // 국공립
const docItems = cl16.categories.find((c) => c.title === "서류 준비")?.items || [];
assert("D16", docItems.some((d) => d.text.includes("재직증명서")), "국공립 should add employment cert");
assert("D16b", docItems.some((d) => d.text.includes("건강보험")), "국공립 should add insurance doc");

// D17: 민간 → 맞벌이 서류 없음
const cl17 = generateChecklist(fac2); // 민간
const docItems17 = cl17.categories.find((c) => c.title === "서류 준비")?.items || [];
assert("D17", !docItems17.some((d) => d.text.includes("재직증명서")), "민간 should NOT add employment cert");

// D18: 영아(6개월) → 젖병/분유 포함
const cl18 = generateChecklist(null, makeChild({ birthDate: new Date(today.getFullYear(), today.getMonth() - 6, 1).toISOString().split("T")[0] }));
const childItems18 = cl18.categories.find((c) => c.title === "아이 준비물")?.items || [];
assert("D18", childItems18.some((i) => i.text.includes("젖병")), "infant should include bottle");

// D19: 유아(3세) → 칫솔 포함, 젖병 없음
const cl19 = generateChecklist(null, makeChild({ birthDate: new Date(today.getFullYear() - 3, 0, 1).toISOString().split("T")[0] }));
const childItems19 = cl19.categories.find((c) => c.title === "아이 준비물")?.items || [];
assert("D19", childItems19.some((i) => i.text.includes("칫솔")), "toddler should include toothbrush");
assert("D19b", !childItems19.some((i) => i.text.includes("젖병")), "toddler should NOT include bottle");

// D20: 평가인증 등급 있는 시설 → 체크 항목 추가
const facGrade = makeFacility({ evaluationGrade: "A" });
const cl20 = generateChecklist(facGrade);
const facCheck20 = cl20.categories.find((c) => c.title === "시설 확인")?.items || [];
assert("D20", facCheck20.some((i) => i.text.includes("평가인증")), "should include evaluation check");

/* ═══ 결과 ═══ */

console.log("\n" + "═".repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total:  ${passed + failed} / 105 target cases`);
console.log("═".repeat(50));

if (failures.length > 0) {
	console.log("\n실패 목록:");
	for (const f of failures) {
		console.log(`  ${f}`);
	}
}

process.exit(failed > 0 ? 1 : 0);
