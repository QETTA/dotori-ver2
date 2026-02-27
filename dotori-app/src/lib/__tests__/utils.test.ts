import { describe, it, expect, vi, afterEach } from "vitest";
import {
	formatRelativeTime,
	facilityStatusLabel,
	facilityTypeBadgeColor,
	formatDistance,
} from "../utils";

/* ─── formatRelativeTime ─── */

describe("formatRelativeTime", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("0~59초 → '방금 전'", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-15T10:00:59.000Z"));
		expect(formatRelativeTime("2026-02-15T10:00:00.000Z")).toBe("방금 전");
	});

	it("1분 → '1분 전'", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-15T10:01:00.000Z"));
		expect(formatRelativeTime("2026-02-15T10:00:00.000Z")).toBe("1분 전");
	});

	it("30분 → '30분 전'", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-15T10:30:00.000Z"));
		expect(formatRelativeTime("2026-02-15T10:00:00.000Z")).toBe("30분 전");
	});

	it("59분 → '59분 전'", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-15T10:59:00.000Z"));
		expect(formatRelativeTime("2026-02-15T10:00:00.000Z")).toBe("59분 전");
	});

	it("1시간 → '1시간 전'", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-15T11:00:00.000Z"));
		expect(formatRelativeTime("2026-02-15T10:00:00.000Z")).toBe("1시간 전");
	});

	it("5시간 → '5시간 전'", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-15T15:00:00.000Z"));
		expect(formatRelativeTime("2026-02-15T10:00:00.000Z")).toBe("5시간 전");
	});

	it("23시간 → '23시간 전'", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-16T09:00:00.000Z"));
		expect(formatRelativeTime("2026-02-15T10:00:00.000Z")).toBe("23시간 전");
	});

	it("1일 → '1일 전'", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-16T10:00:00.000Z"));
		expect(formatRelativeTime("2026-02-15T10:00:00.000Z")).toBe("1일 전");
	});

	it("6일 → '6일 전'", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-21T10:00:00.000Z"));
		expect(formatRelativeTime("2026-02-15T10:00:00.000Z")).toBe("6일 전");
	});

	it("7일 → 날짜 포맷 (월.일)", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-22T10:00:00.000Z"));
		const result = formatRelativeTime("2026-02-15T10:00:00.000Z");
		// toLocaleDateString('ko-KR', {month:'short', day:'numeric'})
		// 결과: "2월 15일" 형태
		expect(result).not.toContain("일 전");
		expect(result).toContain("15");
	});

	/* ── 미래 날짜 (음수 diff) ── */

	it("미래 날짜 → '방금 전' (seconds < 0 → < 60이므로 첫 분기)", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-15T10:00:00.000Z"));
		// 1시간 후 미래 시점
		expect(formatRelativeTime("2026-02-15T11:00:00.000Z")).toBe("방금 전");
	});

	/* ── 잘못된 입력 ── */

	it("잘못된 날짜 문자열 → NaN diff → '방금 전'", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-15T10:00:00.000Z"));
		// new Date("not-a-date").getTime() = NaN, now - NaN = NaN
		// Math.floor(NaN) = NaN, NaN < 60 = false, NaN < 60 = false...
		// 마지막 분기: toLocaleDateString 호출
		const result = formatRelativeTime("not-a-date");
		expect(result).toBe("Invalid Date");
	});
});

/* ─── facilityStatusLabel ─── */

describe("facilityStatusLabel", () => {
	it("available → '빈자리 있음'", () => {
		expect(facilityStatusLabel("available")).toBe("빈자리 있음");
	});

	it("waiting → '대기 중'", () => {
		expect(facilityStatusLabel("waiting")).toBe("대기 중");
	});

	it("full → '마감'", () => {
		expect(facilityStatusLabel("full")).toBe("마감");
	});
});

/* ─── facilityTypeBadgeColor ─── */

describe("facilityTypeBadgeColor", () => {
	// 어린이집 6종 정확한 색상 매핑
	const daycareExpected: [string, "blue" | "amber" | "forest" | "purple" | "pink" | "zinc"][] = [
		["국공립", "blue"],
		["민간", "amber"],
		["가정", "forest"],
		["직장", "purple"],
		["협동", "pink"],
		["사회복지", "zinc"],
	];

	for (const [type, color] of daycareExpected) {
		it(`어린이집: ${type} → ${color}`, () => {
			expect(facilityTypeBadgeColor(type)).toBe(color);
		});
	}

	// 유치원 3종 정확한 색상 매핑
	const kindergartenExpected: [string, "blue" | "purple"][] = [
		["국립유치원", "blue"],
		["공립유치원", "blue"],
		["사립유치원", "purple"],
	];

	for (const [type, color] of kindergartenExpected) {
		it(`유치원: ${type} → ${color}`, () => {
			expect(facilityTypeBadgeColor(type)).toBe(color);
		});
	}

	// 폴백
	it("알 수 없는 타입 → zinc", () => {
		expect(facilityTypeBadgeColor("알수없음")).toBe("zinc");
	});

	it("빈 문자열 → zinc", () => {
		expect(facilityTypeBadgeColor("")).toBe("zinc");
	});
});

/* ─── formatDistance ─── */

describe("formatDistance", () => {
	// 경계값 정밀 테스트
	it("0m → '0m'", () => {
		expect(formatDistance(0)).toBe("0m");
	});

	it("1m → '1m'", () => {
		expect(formatDistance(1)).toBe("1m");
	});

	it("99m → '99m' (100 미만: Math.round 그대로)", () => {
		expect(formatDistance(99)).toBe("99m");
	});

	it("99.6m → '100m' (Math.round(99.6)=100, 여전히 < 100 분기)", () => {
		// Math.round(99.6) = 100 → "100m" (첫 분기: meters < 100 → false → 두번째 분기)
		// 실제: 99.6 < 100 → true → Math.round(99.6)=100 → "100m"
		expect(formatDistance(99.6)).toBe("100m");
	});

	it("100m → '100m' (100~999: 10 단위 반올림)", () => {
		// Math.round(100/10)*10 = 100
		expect(formatDistance(100)).toBe("100m");
	});

	it("456m → '460m'", () => {
		// Math.round(456/10)*10 = Math.round(45.6)*10 = 46*10 = 460
		expect(formatDistance(456)).toBe("460m");
	});

	it("999m → '1000m' (경계: 아직 km 아님)", () => {
		// Math.round(999/10)*10 = Math.round(99.9)*10 = 100*10 = 1000
		expect(formatDistance(999)).toBe("1000m");
	});

	it("1000m → '1.0km'", () => {
		// (1000/1000).toFixed(1) = "1.0"
		expect(formatDistance(1000)).toBe("1.0km");
	});

	it("1500m → '1.5km'", () => {
		expect(formatDistance(1500)).toBe("1.5km");
	});

	it("2345m → '2.3km'", () => {
		// (2345/1000).toFixed(1) = "2.3"
		expect(formatDistance(2345)).toBe("2.3km");
	});

	it("9999m → '10.0km' (경계: 아직 toFixed(1) 분기)", () => {
		// (9999/1000).toFixed(1) = "10.0"
		expect(formatDistance(9999)).toBe("10.0km");
	});

	it("10000m → '10km'", () => {
		// Math.round(10000/1000) = 10
		expect(formatDistance(10000)).toBe("10km");
	});

	it("15432m → '15km'", () => {
		expect(formatDistance(15432)).toBe("15km");
	});

	it("99999m → '100km'", () => {
		expect(formatDistance(99999)).toBe("100km");
	});
});
