import { describe, it, expect, vi, afterEach } from "vitest";
import { calculateAgeClass, generateChecklist } from "../checklist-engine";

/* ─── calculateAgeClass ─── */

describe("calculateAgeClass", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns 만0세반 for 6-month-old (fixed time)", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 5, 15)); // June 15 2026
		// 3월 1일 기준: age = 2026 - 2025 = 1, but birth month(11) > 2 → age=0
		expect(calculateAgeClass("2025-12-01")).toBe("만0세반");
	});

	it("returns 만1세반 for child born 2025-01 (cutoff 2026-03-01)", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 5, 15));
		// age = 2026 - 2025 = 1, birth month(0) <= 2 → age stays 1
		expect(calculateAgeClass("2025-01-15")).toBe("만1세반");
	});

	it("returns 만2세반 for child born 2024-02", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 5, 15));
		// age = 2026 - 2024 = 2
		expect(calculateAgeClass("2024-02-15")).toBe("만2세반");
	});

	it("returns 만3세반 for child born 2023-01", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 5, 15));
		expect(calculateAgeClass("2023-01-01")).toBe("만3세반");
	});

	it("returns 만4세반 for child born 2022-01", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 5, 15));
		expect(calculateAgeClass("2022-01-01")).toBe("만4세반");
	});

	it("returns 만5세반 for child born 2021-01", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 5, 15));
		expect(calculateAgeClass("2021-01-01")).toBe("만5세반");
	});

	it("returns 만0세반 for invalid date formats", () => {
		expect(calculateAgeClass("not-a-date")).toBe("만0세반");
		expect(calculateAgeClass("")).toBe("만0세반");
		expect(calculateAgeClass("2026/01/15")).toBe("만0세반");
	});

	it("returns 만0세반 for impossible date (Feb 30)", () => {
		// new Date(2025, 1, 30) rolls to March 2 → validation catches mismatch
		expect(calculateAgeClass("2025-02-30")).toBe("만0세반");
	});

	it("handles March 1 boundary: child born March 2 vs March 1", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 5, 15));
		// Born 2024-03-01: age = 2026-2024=2, month(2)==cutoff month(2), day(1)<=cutoff day(1) → age stays 2
		expect(calculateAgeClass("2024-03-01")).toBe("만2세반");
		// Born 2024-03-02: age = 2026-2024=2, month(2)==cutoff month(2), day(2)>cutoff day(1) → age=1
		expect(calculateAgeClass("2024-03-02")).toBe("만1세반");
	});
});

/* ─── generateChecklist ─── */

describe("generateChecklist", () => {
	/* ── 구조 검증 ── */

	it("returns correct block type for all 9 facility types", () => {
		const types = ["국공립", "민간", "가정", "직장", "협동", "사회복지", "국립유치원", "공립유치원", "사립유치원"] as const;
		for (const type of types) {
			const result = generateChecklist({ facilityType: type });
			expect(result.type).toBe("checklist");
			// 기본 서류 5개 존재
			const baseCat = result.categories.find((c) => c.title === "기본 서류");
			expect(baseCat, `base docs missing for ${type}`).toBeDefined();
			expect(baseCat!.items).toHaveLength(5);
			// base doc IDs 검증 (deep copy 확인)
			expect(baseCat!.items[0].id).toBe("base-1");
			expect(baseCat!.items[4].id).toBe("base-5");
		}
	});

	it("returns deep-copied items (mutation-safe)", () => {
		const result1 = generateChecklist({ facilityType: "국공립" });
		const result2 = generateChecklist({ facilityType: "국공립" });
		// 체크 상태 변경해도 다른 인스턴스에 영향 없어야 함
		result1.categories[0].items[0].checked = true;
		expect(result2.categories[0].items[0].checked).toBe(false);
	});

	/* ── 어린이집 유형별 서류 ── */

	it("국공립: 소득증빙 + 보육료 지원 결정 통지서 (2건)", () => {
		const result = generateChecklist({ facilityType: "국공립" });
		const typeCat = result.categories.find((c) => c.title === "국공립 추가 서류");
		expect(typeCat).toBeDefined();
		expect(typeCat!.items).toHaveLength(2);
		expect(typeCat!.items[0].id).toBe("public-1");
		expect(typeCat!.items[0].text).toContain("소득증빙");
		expect(typeCat!.items[1].id).toBe("public-2");
		expect(typeCat!.items[1].text).toContain("보육료 지원");
	});

	it("직장: 재직증명서 필수 + 사업자등록증 선택 (2건)", () => {
		const result = generateChecklist({ facilityType: "직장" });
		const typeCat = result.categories.find((c) => c.title === "직장 추가 서류");
		expect(typeCat!.items).toHaveLength(2);
		expect(typeCat!.items[0].required).toBe(true);
		expect(typeCat!.items[1].required).toBe(false);
	});

	it("협동: 가입신청서 + 출자금 확인서 (2건)", () => {
		const result = generateChecklist({ facilityType: "협동" });
		const typeCat = result.categories.find((c) => c.title === "협동 추가 서류");
		expect(typeCat!.items).toHaveLength(2);
		expect(typeCat!.items[0].id).toBe("coop-1");
		expect(typeCat!.items[1].id).toBe("coop-2");
	});

	it("민간: 보육료 지원 결정 통지서 1건", () => {
		const result = generateChecklist({ facilityType: "민간" });
		const typeCat = result.categories.find((c) => c.title === "민간 추가 서류");
		expect(typeCat!.items).toHaveLength(1);
		expect(typeCat!.items[0].id).toBe("private-1");
	});

	it("가정: 보육료 지원 결정 통지서 1건", () => {
		const result = generateChecklist({ facilityType: "가정" });
		const typeCat = result.categories.find((c) => c.title === "가정 추가 서류");
		expect(typeCat!.items).toHaveLength(1);
		expect(typeCat!.items[0].id).toBe("home-1");
	});

	it("사회복지: 보육료 지원 결정 통지서 1건", () => {
		const result = generateChecklist({ facilityType: "사회복지" });
		const typeCat = result.categories.find((c) => c.title === "사회복지 추가 서류");
		expect(typeCat!.items).toHaveLength(1);
		expect(typeCat!.items[0].id).toBe("welfare-1");
	});

	/* ── 유치원 유형별 서류 ── */

	it("국립유치원: 입학원서 필수 + 생활기록부 선택 (2건)", () => {
		const result = generateChecklist({ facilityType: "국립유치원" });
		const typeCat = result.categories.find((c) => c.title === "국립유치원 추가 서류");
		expect(typeCat).toBeDefined();
		expect(typeCat!.items).toHaveLength(2);
		expect(typeCat!.items[0].id).toBe("kinder-national-1");
		expect(typeCat!.items[0].text).toBe("입학원서");
		expect(typeCat!.items[0].required).toBe(true);
		expect(typeCat!.items[1].id).toBe("kinder-national-2");
		expect(typeCat!.items[1].text).toContain("생활기록부");
		expect(typeCat!.items[1].required).toBe(false);
	});

	it("공립유치원: 입학원서 + 생활기록부 (2건)", () => {
		const result = generateChecklist({ facilityType: "공립유치원" });
		const typeCat = result.categories.find((c) => c.title === "공립유치원 추가 서류");
		expect(typeCat!.items).toHaveLength(2);
		expect(typeCat!.items[0].id).toBe("kinder-public-1");
	});

	it("사립유치원: 입학원서(자체양식) + 생활기록부 (2건)", () => {
		const result = generateChecklist({ facilityType: "사립유치원" });
		const typeCat = result.categories.find((c) => c.title === "사립유치원 추가 서류");
		expect(typeCat!.items).toHaveLength(2);
		expect(typeCat!.items[0].id).toBe("kinder-private-1");
		expect(typeCat!.items[0].detail).toContain("자체 양식");
	});

	/* ── 제목 분기: 입학 vs 입소 ── */

	it("유치원 → '입학 서류' 제목, 어린이집 → '입소 서류' 제목", () => {
		for (const type of ["국립유치원", "공립유치원", "사립유치원"] as const) {
			const r = generateChecklist({ facilityType: type });
			expect(r.title).toContain("입학 서류 체크리스트");
			expect(r.title).not.toContain("입소");
			// 카테고리 제목에 "어린이집" 없어야 함
			const typeCat = r.categories.find((c) => c.title.includes(type));
			expect(typeCat!.title).not.toContain("어린이집");
		}
		for (const type of ["국공립", "민간", "가정", "직장", "협동", "사회복지"] as const) {
			const r = generateChecklist({ facilityType: type });
			expect(r.title).toContain("입소 서류 체크리스트");
			expect(r.title).not.toContain("입학");
		}
	});

	/* ── 우선순위 가점 서류 ── */

	it("다자녀: 가족관계증명서 1건 추가", () => {
		const result = generateChecklist({ facilityType: "국공립", hasMultipleChildren: true });
		const p = result.categories.find((c) => c.title === "우선순위 가점 서류");
		expect(p).toBeDefined();
		expect(p!.items).toHaveLength(1);
		expect(p!.items[0].id).toBe("priority-multi");
	});

	it("맞벌이: 부/모 재직증명서 2건 추가", () => {
		const result = generateChecklist({ facilityType: "국공립", isDualIncome: true });
		const p = result.categories.find((c) => c.title === "우선순위 가점 서류");
		expect(p!.items).toHaveLength(2);
		expect(p!.items[0].id).toBe("priority-dual-1");
		expect(p!.items[1].id).toBe("priority-dual-2");
	});

	it("한부모: 한부모가족 증명서 1건", () => {
		const result = generateChecklist({ facilityType: "민간", isSingleParent: true });
		const p = result.categories.find((c) => c.title === "우선순위 가점 서류");
		expect(p!.items).toHaveLength(1);
		expect(p!.items[0].id).toBe("priority-single");
		expect(p!.items[0].text).toContain("한부모");
	});

	it("장애: 장애인 등록증/진단서 1건", () => {
		const result = generateChecklist({ facilityType: "민간", hasDisability: true });
		const p = result.categories.find((c) => c.title === "우선순위 가점 서류");
		expect(p!.items).toHaveLength(1);
		expect(p!.items[0].id).toBe("priority-disability");
	});

	it("전체 가점 조합: 다자녀+맞벌이+한부모+장애 = 5건", () => {
		const result = generateChecklist({
			facilityType: "국공립",
			hasMultipleChildren: true,
			isDualIncome: true,
			isSingleParent: true,
			hasDisability: true,
		});
		const p = result.categories.find((c) => c.title === "우선순위 가점 서류");
		expect(p!.items).toHaveLength(5);
		const ids = p!.items.map((i) => i.id);
		expect(ids).toEqual([
			"priority-multi",
			"priority-dual-1",
			"priority-dual-2",
			"priority-single",
			"priority-disability",
		]);
	});

	it("가점 조건 없으면 우선순위 카테고리 미생성", () => {
		const result = generateChecklist({ facilityType: "국공립" });
		expect(result.categories.find((c) => c.title === "우선순위 가점 서류")).toBeUndefined();
	});

	/* ── 연령반 정보 ── */

	it("childBirthDate 있으면 참고 정보에 연령반 표시", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 5, 15));
		const result = generateChecklist({ facilityType: "국공립", childBirthDate: "2024-02-15" });
		const info = result.categories.find((c) => c.title === "참고 정보");
		expect(info).toBeDefined();
		expect(info!.items[0].id).toBe("info-age");
		expect(info!.items[0].text).toContain("만2세반");
		expect(info!.items[0].checked).toBe(true);
		expect(info!.items[0].required).toBe(false);
		vi.useRealTimers();
	});

	it("childBirthDate 없으면 참고 정보 미생성", () => {
		const result = generateChecklist({ facilityType: "국공립" });
		expect(result.categories.find((c) => c.title === "참고 정보")).toBeUndefined();
	});

	/* ── 카테고리 개수 검증 ── */

	it("기본 조건: 기본 서류 + 유형별 = 2카테고리", () => {
		const result = generateChecklist({ facilityType: "국공립" });
		expect(result.categories).toHaveLength(2);
	});

	it("전체 조건: 기본 + 유형별 + 가점 + 참고 = 4카테고리", () => {
		const result = generateChecklist({
			facilityType: "국공립",
			hasMultipleChildren: true,
			childBirthDate: "2024-06-15",
		});
		expect(result.categories).toHaveLength(4);
	});
});
