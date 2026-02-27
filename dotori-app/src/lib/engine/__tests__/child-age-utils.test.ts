import { describe, it, expect, vi, afterEach } from "vitest";
import { getChildAgeMonths, formatAge, getClassAge } from "../child-age-utils";

/* ─── getChildAgeMonths ─── */

describe("getChildAgeMonths", () => {
	it("calculates months for a 1-year-old", () => {
		const ref = new Date(2026, 1, 15); // Feb 2026
		expect(getChildAgeMonths("2025-02-15", ref)).toBe(12);
	});

	it("calculates months for a 6-month-old", () => {
		const ref = new Date(2026, 1, 15);
		expect(getChildAgeMonths("2025-08-15", ref)).toBe(6);
	});

	it("returns 0 for same month", () => {
		const ref = new Date(2026, 1, 15);
		expect(getChildAgeMonths("2026-02-01", ref)).toBe(0);
	});

	it("returns negative for future birthDate", () => {
		const ref = new Date(2026, 1, 15);
		expect(getChildAgeMonths("2027-01-01", ref)).toBeLessThan(0);
	});

	it("returns -1 for invalid date string", () => {
		expect(getChildAgeMonths("not-a-date")).toBe(-1);
		expect(getChildAgeMonths("")).toBe(-1);
	});

	it("uses current date when no referenceDate", () => {
		const now = new Date();
		const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
		const result = getChildAgeMonths(oneYearAgo.toISOString().slice(0, 10));
		expect(result).toBeGreaterThanOrEqual(12);
	});

	/* day-of-month 무시 동작 문서화 (소스 버그/의도적 설계 기록) */

	it("같은 달 내에서 day 차이는 0개월 (day 무시)", () => {
		// born Mar 15, ref Mar 1 → same month → 0
		const ref = new Date(2026, 2, 1); // Mar 1
		expect(getChildAgeMonths("2026-03-15", ref)).toBe(0);
	});

	it("월 경계: born Feb 28, ref Mar 1 → 1개월 (day 무관)", () => {
		// 실제로는 1일밖에 안 지났지만 month 차이 = 1
		const ref = new Date(2026, 2, 1); // Mar 1
		expect(getChildAgeMonths("2026-02-28", ref)).toBe(1);
	});

	it("born Dec 31, ref Jan 1 → 1개월 (연도+월 차이만 계산)", () => {
		const ref = new Date(2027, 0, 1); // Jan 1, 2027
		expect(getChildAgeMonths("2026-12-31", ref)).toBe(1);
	});
});

/* ─── formatAge ─── */

describe("formatAge", () => {
	it("formats months under 12 as 개월", () => {
		expect(formatAge(0)).toBe("0개월");
		expect(formatAge(6)).toBe("6개월");
		expect(formatAge(11)).toBe("11개월");
	});

	it("formats exact years without remainder", () => {
		expect(formatAge(12)).toBe("만 1세");
		expect(formatAge(24)).toBe("만 2세");
		expect(formatAge(60)).toBe("만 5세");
	});

	it("formats years with remainder months", () => {
		expect(formatAge(15)).toBe("만 1세 3개월");
		expect(formatAge(30)).toBe("만 2세 6개월");
		expect(formatAge(37)).toBe("만 3세 1개월");
	});
});

/* ─── getClassAge ─── */

describe("getClassAge", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns 영아반(0세) for newborn", () => {
		const result = getClassAge("2026-01-01", 2026);
		expect(result.classAge).toBe(0);
		expect(result.className).toBe("영아반(0세)");
	});

	it("returns 영아반(1세) for 1-year-old", () => {
		const result = getClassAge("2025-06-01", 2026);
		expect(result.classAge).toBe(1);
		expect(result.className).toBe("영아반(1세)");
	});

	it("returns 유아반(3세) for 3-year-old", () => {
		const result = getClassAge("2023-03-15", 2026);
		expect(result.classAge).toBe(3);
		expect(result.className).toBe("유아반(3세)");
	});

	it("returns 유아반(5세) for 5-year-old", () => {
		const result = getClassAge("2021-09-01", 2026);
		expect(result.classAge).toBe(5);
		expect(result.className).toBe("유아반(5세)");
	});

	it("clamps className to 유아반(5세) for age > 5 (classAge is unclamped)", () => {
		const result = getClassAge("2019-01-01", 2026);
		expect(result.classAge).toBe(7);
		expect(result.className).toBe("유아반(5세)");
	});

	it("clamps classAge to 0 for future birthDate", () => {
		const result = getClassAge("2028-01-01", 2026);
		expect(result.classAge).toBe(0);
		expect(result.className).toBe("영아반(0세)");
	});

	it("uses current year when targetYear is not provided (after March)", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 5, 1)); // June 2026 (month >= 2)
		const result = getClassAge("2024-01-01");
		expect(result.classAge).toBe(2); // 2026 - 2024
		expect(result.className).toBe("영아반(2세)");
	});

	it("uses previous year when before March", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 0, 15)); // January 2026 (month < 2)
		const result = getClassAge("2024-01-01");
		expect(result.classAge).toBe(1); // 2025 - 2024
		expect(result.className).toBe("영아반(1세)");
	});
});
