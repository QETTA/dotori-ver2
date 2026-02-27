import { describe, it, expect } from "vitest";
import type { ChildProfile, Facility } from "@/types/dotori";
import { generateTransferReasons, generateWhyInsights, type WhyInsight } from "../why-engine";

/* ─── Helpers ─── */

function makeFacility(overrides: Partial<Facility> = {}): Facility {
	return {
		id: "f1",
		name: "테스트어린이집",
		type: "국공립",
		status: "available",
		address: "서울시 강남구",
		lat: 37.4952,
		lng: 127.0266,
		capacity: { total: 30, current: 25, waiting: 0 },
		features: [],
		rating: 4.2,
		reviewCount: 12,
		lastSyncedAt: new Date().toISOString(),
		...overrides,
	};
}

/** 특정 source를 가진 인사이트를 찾는 헬퍼 (source가 unique하므로 강한 매칭) */
function findBySource(insights: WhyInsight[], source: string): WhyInsight | undefined {
	return insights.find((i) => i.source === source);
}

/* ─── generateWhyInsights ─── */

describe("generateWhyInsights", () => {
	/* ── 1. 여석/정원 분석 ── */

	it("available + toCount > 0 → positive 여석 인사이트, 정확한 숫자 포함", () => {
		const f = makeFacility({ status: "available", capacity: { total: 30, current: 25, waiting: 0 } });
		const insight = findBySource(generateWhyInsights(f), "아이사랑 정원현황");
		expect(insight).toBeDefined();
		expect(insight!.sentiment).toBe("positive");
		expect(insight!.text).toContain("5자리");
		expect(insight!.text).toContain("30명 중 25명");
	});

	it("waiting → caution 대기 인사이트, 대기 수 포함", () => {
		const f = makeFacility({ status: "waiting", capacity: { total: 30, current: 30, waiting: 7 } });
		const insight = findBySource(generateWhyInsights(f), "아이사랑 대기현황");
		expect(insight).toBeDefined();
		expect(insight!.sentiment).toBe("caution");
		expect(insight!.text).toContain("7명");
	});

	it("full → caution 마감 인사이트", () => {
		const f = makeFacility({ status: "full", capacity: { total: 30, current: 30, waiting: 0 } });
		const insight = findBySource(generateWhyInsights(f), "아이사랑 정원현황");
		expect(insight).toBeDefined();
		expect(insight!.sentiment).toBe("caution");
		expect(insight!.text).toContain("가득");
	});

	it("available but toCount=0 → 여석 인사이트 미생성 (status와 현원 불일치 케이스)", () => {
		const f = makeFacility({ status: "available", capacity: { total: 30, current: 30, waiting: 0 } });
		const insights = generateWhyInsights(f);
		// toCount=0이므로 첫번째 조건 안 탐. "대기"도 아니고 "full"도 아님 → 정원현황 인사이트 없음
		expect(findBySource(insights, "아이사랑 정원현황")).toBeUndefined();
		expect(findBySource(insights, "아이사랑 대기현황")).toBeUndefined();
	});

	/* ── 2. 규모 분석 ── */

	it("capacity >= 100 → positive 대형 인사이트", () => {
		const f = makeFacility({ capacity: { total: 120, current: 100, waiting: 0 } });
		const insight = findBySource(generateWhyInsights(f), "시설 정보");
		expect(insight).toBeDefined();
		expect(insight!.sentiment).toBe("positive");
		expect(insight!.text).toContain("120명");
		expect(insight!.text).toContain("대형");
	});

	it("capacity <= 20 → neutral 소규모 인사이트", () => {
		const f = makeFacility({ capacity: { total: 15, current: 10, waiting: 0 } });
		const insight = findBySource(generateWhyInsights(f), "시설 정보");
		expect(insight).toBeDefined();
		expect(insight!.sentiment).toBe("neutral");
		expect(insight!.text).toContain("소규모");
	});

	it("21 <= capacity <= 99 → 규모 인사이트 없음", () => {
		const f = makeFacility({ capacity: { total: 50, current: 30, waiting: 0 } });
		const insight = findBySource(generateWhyInsights(f), "시설 정보");
		expect(insight).toBeUndefined();
	});

	/* ── 3. 유형별 특성 ── */

	it("국공립 → 보육료 저렴 + 높은 평가인증 문구", () => {
		const f = makeFacility({ type: "국공립" });
		const insight = findBySource(generateWhyInsights(f), "보건복지부 통계");
		expect(insight).toBeDefined();
		expect(insight!.sentiment).toBe("neutral");
		expect(insight!.text).toContain("보육료");
	});

	it("가정 → 소규모 가정적 분위기 문구", () => {
		const f = makeFacility({ type: "가정" });
		const insight = findBySource(generateWhyInsights(f), "보건복지부 유형 정보");
		expect(insight).toBeDefined();
		expect(insight!.text).toContain("가정어린이집");
	});

	it("협동/사회복지 → 유형 인사이트 없음 (매핑에 없는 타입)", () => {
		for (const type of ["협동", "사회복지"] as const) {
			const f = makeFacility({ type });
			const insights = generateWhyInsights(f);
			const typeInsight = insights.find((i) => i.source === "보건복지부 통계" || i.source === "보건복지부 유형 정보");
			expect(typeInsight, `유형 인사이트가 있으면 안됨: ${type}`).toBeUndefined();
		}
	});

	/* ── 4. 평가등급 ── */

	it("A등급 → positive", () => {
		const f = makeFacility({ evaluationGrade: "A" });
		const insight = findBySource(generateWhyInsights(f), "한국보육진흥원 평가");
		expect(insight).toBeDefined();
		expect(insight!.sentiment).toBe("positive");
		expect(insight!.text).toContain("A등급");
	});

	it("D등급 → caution", () => {
		const f = makeFacility({ evaluationGrade: "D" });
		const insight = findBySource(generateWhyInsights(f), "한국보육진흥원 평가");
		expect(insight!.sentiment).toBe("caution");
		expect(insight!.text).toContain("D등급");
	});

	it("등급 없으면 → 평가 인사이트 없음", () => {
		const f = makeFacility();
		expect(findBySource(generateWhyInsights(f), "한국보육진흥원 평가")).toBeUndefined();
	});

	it("유효하지 않은 등급(E) → 인사이트 없음", () => {
		const f = makeFacility({ evaluationGrade: "E" });
		expect(findBySource(generateWhyInsights(f), "한국보육진흥원 평가")).toBeUndefined();
	});

	/* ── 5. 연장보육 ── */

	it("extendedCare true → positive, 종료 시간 포함", () => {
		const f = makeFacility({ operatingHours: { open: "07:30", close: "19:30", extendedCare: true } });
		const insight = findBySource(generateWhyInsights(f), "시설 운영정보");
		expect(insight).toBeDefined();
		expect(insight!.sentiment).toBe("positive");
		expect(insight!.text).toContain("19:30");
	});

	it("extendedCare false → 운영 인사이트 없음", () => {
		const f = makeFacility({ operatingHours: { open: "07:30", close: "18:00", extendedCare: false } });
		expect(findBySource(generateWhyInsights(f), "시설 운영정보")).toBeUndefined();
	});

	/* ── 6. 평점 ── */

	it("rating >= 4.5 && reviewCount >= 5 → positive 만족도", () => {
		const f = makeFacility({ rating: 4.8, reviewCount: 10 });
		const insight = findBySource(generateWhyInsights(f), "이용자 리뷰");
		expect(insight).toBeDefined();
		expect(insight!.sentiment).toBe("positive");
		expect(insight!.text).toContain("4.8");
		expect(insight!.text).toContain("10개");
	});

	it("rating < 3.0 && reviewCount >= 3 → caution", () => {
		const f = makeFacility({ rating: 2.5, reviewCount: 5 });
		const insight = findBySource(generateWhyInsights(f), "이용자 리뷰");
		expect(insight!.sentiment).toBe("caution");
		expect(insight!.text).toContain("리뷰를 확인");
	});

	it("rating 4.5 but reviewCount < 5 → 평점 인사이트 없음", () => {
		const f = makeFacility({ rating: 4.5, reviewCount: 3 });
		expect(findBySource(generateWhyInsights(f), "이용자 리뷰")).toBeUndefined();
	});

	it("rating 3.0~4.4 → 평점 인사이트 없음 (중간 구간)", () => {
		const f = makeFacility({ rating: 3.8, reviewCount: 20 });
		expect(findBySource(generateWhyInsights(f), "이용자 리뷰")).toBeUndefined();
	});

	/* ── 7. 경쟁 분석 ── */

	it("occupancy >= 95% + waiting > 10 → caution 인기 시설", () => {
		const f = makeFacility({ status: "waiting", capacity: { total: 100, current: 96, waiting: 15 } });
		const insight = findBySource(generateWhyInsights(f), "정원 데이터 분석");
		expect(insight).toBeDefined();
		expect(insight!.sentiment).toBe("caution");
		expect(insight!.text).toContain("96%");
	});

	it("occupancy < 70% + available → positive 여유", () => {
		const f = makeFacility({ status: "available", capacity: { total: 100, current: 60, waiting: 0 } });
		const insight = findBySource(generateWhyInsights(f), "정원 데이터 분석");
		expect(insight).toBeDefined();
		expect(insight!.sentiment).toBe("positive");
		expect(insight!.text).toContain("60%");
	});

	it("occupancy 70-94% → 경쟁 분석 없음", () => {
		const f = makeFacility({ status: "available", capacity: { total: 100, current: 80, waiting: 0 } });
		expect(findBySource(generateWhyInsights(f), "정원 데이터 분석")).toBeUndefined();
	});

	/* ── 8. 아이 매칭 ── */

	it("infant (< 12개월) + 가정 → positive 영아 케어", () => {
		const f = makeFacility({ type: "가정" });
		const child: ChildProfile = { id: "c1", name: "아기", birthDate: "2026-01-01", gender: "male" };
		const insight = findBySource(generateWhyInsights(f, child), "아이 맞춤 분석");
		expect(insight).toBeDefined();
		expect(insight!.sentiment).toBe("positive");
		expect(insight!.text).toContain("아기");
		expect(insight!.text).toContain("영아");
	});

	it("3세+ + 누리과정 시설 → positive 누리과정 매칭", () => {
		const f = makeFacility({ features: ["누리과정"] });
		const child: ChildProfile = { id: "c1", name: "도토리", birthDate: "2022-06-01", gender: "female" };
		const insight = findBySource(generateWhyInsights(f, child), "아이 맞춤 분석");
		expect(insight!.sentiment).toBe("positive");
		expect(insight!.text).toContain("누리과정");
	});

	it("일반 케이스 → neutral 연령 기준 분석 문구", () => {
		const f = makeFacility({ type: "민간" });
		const child: ChildProfile = { id: "c1", name: "참깨", birthDate: "2024-06-01", gender: "male" };
		const insight = findBySource(generateWhyInsights(f, child), "아이 맞춤 분석");
		expect(insight!.sentiment).toBe("neutral");
		expect(insight!.text).toContain("참깨");
	});

	it("child가 null/undefined면 아이 맞춤 인사이트 없음", () => {
		const f = makeFacility();
		expect(findBySource(generateWhyInsights(f, null), "아이 맞춤 분석")).toBeUndefined();
		expect(findBySource(generateWhyInsights(f, undefined), "아이 맞춤 분석")).toBeUndefined();
	});

	/* ── 9. 특징 하이라이트 ── */

	it("텃밭 포함 → neutral 텃밭 인사이트", () => {
		const f = makeFacility({ features: ["텃밭활동"] });
		const insight = findBySource(generateWhyInsights(f), "시설 특징");
		expect(insight).toBeDefined();
		expect(insight!.text).toContain("텃밭");
	});

	it("특징 없으면 → 시설 특징 인사이트 없음", () => {
		const f = makeFacility({ features: [] });
		expect(findBySource(generateWhyInsights(f), "시설 특징")).toBeUndefined();
	});

	it("여러 특징 있어도 하나만 선택 (첫 번째 매칭)", () => {
		const f = makeFacility({ features: ["텃밭", "영어", "숲체험"] });
		const insights = generateWhyInsights(f);
		const featureInsights = insights.filter((i) => i.source === "시설 특징");
		expect(featureInsights).toHaveLength(1);
	});

	/* ── 제한/정렬 ── */

	it("최대 5개 인사이트 반환", () => {
		const f = makeFacility({
			status: "available",
			type: "국공립",
			capacity: { total: 120, current: 60, waiting: 0 },
			evaluationGrade: "A",
			rating: 4.8,
			reviewCount: 20,
			operatingHours: { open: "07:30", close: "19:30", extendedCare: true },
			features: ["텃밭", "영어"],
		});
		const child: ChildProfile = { id: "c1", name: "도토리", birthDate: "2024-01-01", gender: "female" };
		const insights = generateWhyInsights(f, child);
		expect(insights).toHaveLength(5);
	});

	it("positive > caution > neutral 순서로 정렬됨", () => {
		const f = makeFacility({
			status: "available",
			type: "국공립",
			capacity: { total: 30, current: 25, waiting: 0 },
			evaluationGrade: "A",
		});
		const insights = generateWhyInsights(f);
		const order = { positive: 3, caution: 2, neutral: 1 };
		for (let i = 1; i < insights.length; i++) {
			expect(
				order[insights[i - 1].sentiment],
				`index ${i - 1}(${insights[i - 1].sentiment}) should >= index ${i}(${insights[i].sentiment})`,
			).toBeGreaterThanOrEqual(order[insights[i].sentiment]);
		}
	});

	/* ── 엣지 케이스 ── */

	it("capacity.total = 0 → division by zero 없이 정상 동작", () => {
		const f = makeFacility({ capacity: { total: 0, current: 0, waiting: 0 } });
		const insights = generateWhyInsights(f);
		expect(Array.isArray(insights)).toBe(true);
	});
});

/* ─── generateTransferReasons ─── */

describe("generateTransferReasons", () => {
	it("class_dissatisfaction: 교사 대비 인원 과다 + 충원율 85%↑", () => {
		const f = makeFacility({
			teacherCount: 3,
			capacity: { total: 40, current: 36, waiting: 0 }, // 36/3=12 >= 10, 36/40=90%
		});
		const reasons = generateTransferReasons({ facility: f });
		const r = reasons.find((r) => r.category === "class_dissatisfaction");
		expect(r).toBeDefined();
		expect(r!.sentiment).toBe("caution");
	});

	it("class_dissatisfaction 안 뜸: 교사 충분", () => {
		const f = makeFacility({
			teacherCount: 10,
			capacity: { total: 40, current: 36, waiting: 0 }, // 36/10=3.6 < 10
		});
		const reasons = generateTransferReasons({ facility: f });
		expect(reasons.find((r) => r.category === "class_dissatisfaction")).toBeUndefined();
	});

	it("teacher_turnover: 교사 <= 2 + 정원 > 40", () => {
		const f = makeFacility({ teacherCount: 1, capacity: { total: 80, current: 50, waiting: 5 } });
		const reasons = generateTransferReasons({ facility: f });
		const r = reasons.find((r) => r.category === "teacher_turnover");
		expect(r).toBeDefined();
		expect(r!.source).toBe("인력 구성 분석");
	});

	it("teacher_turnover 안 뜸: 교사 3명", () => {
		const f = makeFacility({ teacherCount: 3, capacity: { total: 80, current: 50, waiting: 5 } });
		expect(generateTransferReasons({ facility: f }).find((r) => r.category === "teacher_turnover")).toBeUndefined();
	});

	it("director_distrust: 평가등급 D + rating > 0", () => {
		const f = makeFacility({ evaluationGrade: "D", rating: 3.5 });
		const r = generateTransferReasons({ facility: f }).find((r) => r.category === "director_distrust");
		expect(r).toBeDefined();
		expect(r!.sentiment).toBe("caution");
	});

	it("director_distrust 안 뜸: 등급 A", () => {
		const f = makeFacility({ evaluationGrade: "A", rating: 4.5 });
		expect(generateTransferReasons({ facility: f }).find((r) => r.category === "director_distrust")).toBeUndefined();
	});

	it("facility_poor: 낮은 평점(< 3.0) + reviewCount >= 3", () => {
		const f = makeFacility({ rating: 2.5, reviewCount: 5 });
		const r = generateTransferReasons({ facility: f }).find((r) => r.category === "facility_poor");
		expect(r).toBeDefined();
	});

	it("facility_poor 안 뜸: 평점 3.5", () => {
		const f = makeFacility({ rating: 3.5, reviewCount: 10 });
		expect(generateTransferReasons({ facility: f }).find((r) => r.category === "facility_poor")).toBeUndefined();
	});

	it("public_waitlist: 국공립 + waiting > 0 + publicWaitlistWon=false", () => {
		const f = makeFacility({ type: "국공립", capacity: { total: 25, current: 25, waiting: 12 } });
		const r = generateTransferReasons({ facility: f }).find((r) => r.category === "public_waitlist");
		expect(r).toBeDefined();
		expect(r!.sentiment).toBe("neutral");
	});

	it("public_waitlist 안 뜸: waiting=0", () => {
		const f = makeFacility({ type: "국공립", capacity: { total: 20, current: 20, waiting: 0 } });
		expect(generateTransferReasons({ facility: f }).find((r) => r.category === "public_waitlist")).toBeUndefined();
	});

	it("public_waitlist 안 뜸: publicWaitlistWon=true", () => {
		const f = makeFacility({ type: "국공립", capacity: { total: 25, current: 25, waiting: 12 } });
		const r = generateTransferReasons({ facility: f, publicWaitlistWon: true }).find(
			(r) => r.category === "public_waitlist",
		);
		expect(r).toBeUndefined();
	});

	it("sibling_separation: siblingCount > 1", () => {
		const r = generateTransferReasons({ facility: makeFacility(), siblingCount: 2 }).find(
			(r) => r.category === "sibling_separation",
		);
		expect(r).toBeDefined();
		expect(r!.text).toContain("형제");
	});

	it("sibling_separation 안 뜸: siblingCount=1", () => {
		expect(
			generateTransferReasons({ facility: makeFacility(), siblingCount: 1 }).find(
				(r) => r.category === "sibling_separation",
			),
		).toBeUndefined();
	});

	it("safety_concern: 안전 키워드 없음 + 충원율 >= 75%", () => {
		const f = makeFacility({ features: ["급식"], capacity: { total: 100, current: 80, waiting: 0 } });
		const r = generateTransferReasons({ facility: f }).find((r) => r.category === "safety_concern");
		expect(r).toBeDefined();
		expect(r!.sentiment).toBe("caution");
	});

	it("safety_concern 안 뜸: CCTV 있음", () => {
		const f = makeFacility({ features: ["CCTV"], capacity: { total: 100, current: 80, waiting: 0 } });
		expect(generateTransferReasons({ facility: f }).find((r) => r.category === "safety_concern")).toBeUndefined();
	});

	it("safety_concern 안 뜸: 충원율 74%", () => {
		const f = makeFacility({ features: [], capacity: { total: 100, current: 74, waiting: 0 } });
		expect(generateTransferReasons({ facility: f }).find((r) => r.category === "safety_concern")).toBeUndefined();
	});

	it("previousFacility로 행정동 비교 → relocation", () => {
		const f = makeFacility({ address: "서울시 강남구 역삼동" });
		const prev = makeFacility({ address: "서울시 송파구 잠실동" });
		const r = generateTransferReasons({ facility: f, previousFacility: prev }).find(
			(r) => r.category === "relocation" && r.source === "주소 비교",
		);
		expect(r).toBeDefined();
		expect(r!.text).toContain("행정동");
	});

	it("같은 행정동이면 relocation(주소 비교) 안 뜸", () => {
		const f = makeFacility({ address: "서울시 강남구 역삼동" });
		const prev = makeFacility({ address: "서울시 강남구 삼성동" });
		const r = generateTransferReasons({ facility: f, previousFacility: prev }).find(
			(r) => r.category === "relocation" && r.source === "주소 비교",
		);
		expect(r).toBeUndefined();
	});

	it("카테고리 중복 없음 (addIfMissing 검증)", () => {
		const f = makeFacility({
			evaluationGrade: "D",
			rating: 2.5,
			reviewCount: 5,
		});
		const reasons = generateTransferReasons({ facility: f });
		const categories = reasons.map((r) => r.category);
		expect(categories.length).toBe(new Set(categories).size);
	});

	it("특수문자 포함 시설명 → 에러 없음", () => {
		const f = makeFacility({ name: "★도토리&키즈!@#어린이집(테스트)" });
		expect(() => generateTransferReasons({ facility: f })).not.toThrow();
	});
});
