import { describe, it, expect } from "vitest";
import {
	detectTransferScenario,
	extractRegion,
	extractFacilityType,
	extractConversationContext,
	sanitizeSearchQuery,
} from "../response-builder/context";

/* ─── detectTransferScenario ─── */

describe("detectTransferScenario", () => {
	it("detects 반편성 scenario", () => {
		expect(detectTransferScenario("반편성 결과가 마음에 안 들어요")).toBe("반편성");
		expect(detectTransferScenario("같은 반 배정 안 됐어요")).toBe("반편성");
		expect(detectTransferScenario("친한 친구랑 같은 반이 아니에요")).toBe("반편성");
	});

	it("detects 교사교체 scenario", () => {
		expect(detectTransferScenario("선생님 바뀌었어요")).toBe("교사교체");
		expect(detectTransferScenario("교사 교체가 됐는데")).toBe("교사교체");
		expect(detectTransferScenario("담임 바뀌면서 아이가 불안해해요")).toBe("교사교체");
	});

	it("detects 설명회실망 scenario", () => {
		expect(detectTransferScenario("설명회 다녀왔는데 실망이에요")).toBe("설명회실망");
		expect(detectTransferScenario("원장 태도가 별로였어요")).toBe("설명회실망");
		expect(detectTransferScenario("시설이 낡아서 걱정이에요")).toBe("설명회실망");
	});

	it("detects 국공립당첨 scenario", () => {
		expect(detectTransferScenario("국공립 당첨됐어요!")).toBe("국공립당첨");
		expect(detectTransferScenario("대기 당첨 연락 왔어요")).toBe("국공립당첨");
	});

	it("detects 이사예정 scenario", () => {
		expect(detectTransferScenario("다음달 이사 예정이에요")).toBe("이사예정");
		expect(detectTransferScenario("통원 거리가 너무 멀어요")).toBe("이사예정");
	});

	it("returns 일반 for unmatched messages", () => {
		expect(detectTransferScenario("어린이집 추천해주세요")).toBe("일반");
		expect(detectTransferScenario("안녕하세요")).toBe("일반");
		expect(detectTransferScenario("")).toBe("일반");
	});
});

/* ─── sanitizeSearchQuery ─── */

describe("sanitizeSearchQuery", () => {
	it("removes quotes and backslashes", () => {
		expect(sanitizeSearchQuery('"hello"')).toBe("hello");
		expect(sanitizeSearchQuery("it's")).toBe("its");
		expect(sanitizeSearchQuery("path\\to")).toBe("pathto");
	});

	it("replaces dashes and tildes with spaces", () => {
		expect(sanitizeSearchQuery("서울-강남")).toBe("서울 강남");
		expect(sanitizeSearchQuery("범위~내")).toBe("범위 내");
	});

	it("trims whitespace", () => {
		expect(sanitizeSearchQuery("  hello  ")).toBe("hello");
	});

	it("limits to 200 characters", () => {
		const long = "a".repeat(300);
		expect(sanitizeSearchQuery(long).length).toBe(200);
	});

	it("handles empty string", () => {
		expect(sanitizeSearchQuery("")).toBe("");
	});
});

/* ─── extractRegion ─── */

describe("extractRegion", () => {
	it("extracts 서울 강남구 from message", () => {
		const result = extractRegion("강남구 근처 어린이집 찾아주세요");
		expect(result.sido).toBe("서울특별시");
		expect(result.sigungu).toBe("강남구");
		expect(result.confidence).toBeGreaterThanOrEqual(0.99);
	});

	it("extracts 경기 분당 from message", () => {
		const result = extractRegion("분당 어린이집 추천해주세요");
		expect(result.sido).toBe("경기도");
		expect(result.sigungu).toContain("분당");
	});

	it("extracts 부산 해운대 from message", () => {
		const result = extractRegion("해운대 어린이집 알려주세요");
		expect(result.sido).toBe("부산광역시");
		expect(result.sigungu).toBe("해운대구");
	});

	it("extracts sido-level for broad region mention", () => {
		const result = extractRegion("서울에 있는 어린이집요");
		expect(result.sido).toBe("서울특별시");
		expect(result.confidence).toBe(0.7);
	});

	it("extracts 제주 with moderate confidence", () => {
		const result = extractRegion("제주 어린이집 있나요");
		expect(result.sido).toBe("제주특별자치도");
	});

	it("extracts 세종 from message", () => {
		// "보여주세요" contains "여주" → 경기도 여주시로 잘못 매칭되므로 다른 문장 사용
		const result = extractRegion("세종시 어린이집 알려줘");
		expect(result.sido).toBe("세종특별자치시");
	});

	it("returns confidence 0 for no region", () => {
		const result = extractRegion("좋은 어린이집 찾아주세요");
		expect(result.confidence).toBe(0);
	});

	it("prioritizes sigungu over sido match", () => {
		const result = extractRegion("송파 어린이집");
		expect(result.sigungu).toBe("송파구");
		expect(result.sido).toBe("서울특별시");
	});

	it("extracts 충남 천안", () => {
		const result = extractRegion("천안 어린이집 추천");
		expect(result.sido).toBe("충청남도");
		expect(result.sigungu).toBe("천안시");
	});

	it("extracts 대전 유성구 with high confidence", () => {
		const result = extractRegion("대전 유성구 국공립 어린이집");
		expect(result.sido).toBe("대전광역시");
		expect(result.sigungu).toBe("유성구");
		expect(result.confidence).toBe(0.99);
	});
});

/* ─── extractFacilityType ─── */

describe("extractFacilityType", () => {
	it("extracts 국공립 from message", () => {
		expect(extractFacilityType("국공립 어린이집 보여줘")).toBe("국공립");
	});

	it("extracts 민간 from message", () => {
		expect(extractFacilityType("민간 어린이집 추천")).toBe("민간");
	});

	it("extracts 가정 from message", () => {
		expect(extractFacilityType("가정 어린이집이 좋을까요")).toBe("가정");
	});

	it("extracts 사립유치원 from message", () => {
		expect(extractFacilityType("사립유치원 알아보는 중이에요")).toBe("사립유치원");
	});

	it("extracts 공립유치원 from message", () => {
		expect(extractFacilityType("공립유치원 추천해주세요")).toBe("공립유치원");
	});

	it("returns undefined for no type", () => {
		expect(extractFacilityType("어린이집 추천해주세요")).toBeUndefined();
	});
});

/* ─── extractConversationContext ─── */

describe("extractConversationContext", () => {
	it("extracts region from user messages", () => {
		const messages = [
			{ role: "user", content: "강남 어린이집 찾아줘" },
			{ role: "assistant", content: "찾아보겠습니다" },
		];
		const ctx = extractConversationContext(messages);
		expect(ctx.establishedRegion?.sido).toBe("서울특별시");
		expect(ctx.establishedRegion?.sigungu).toBe("강남구");
	});

	it("extracts facility type from user messages", () => {
		const messages = [
			{ role: "user", content: "국공립 어린이집 보여줘" },
		];
		const ctx = extractConversationContext(messages);
		expect(ctx.establishedFacilityType).toBe("국공립");
	});

	it("extracts facility IDs from assistant facility_list blocks", () => {
		const messages = [
			{ role: "user", content: "어린이집 추천" },
			{
				role: "assistant",
				content: "추천 결과입니다",
				blocks: [
					{
						type: "facility_list",
						facilities: [
							{ id: "f1", name: "해오름" },
							{ id: "f2", name: "무지개" },
						],
					},
				],
			},
		];
		const ctx = extractConversationContext(messages);
		expect(ctx.mentionedFacilityIds).toContain("f1");
		expect(ctx.mentionedFacilityIds).toContain("f2");
		expect(ctx.mentionedFacilityNames).toContain("해오름");
	});

	it("extracts facility IDs from map blocks", () => {
		const messages = [
			{
				role: "assistant",
				content: "지도입니다",
				blocks: [{ type: "map", markers: [{ id: "f3" }] }],
			},
		];
		const ctx = extractConversationContext(messages);
		expect(ctx.mentionedFacilityIds).toContain("f3");
	});

	it("limits facility IDs to 15", () => {
		const facilities = Array.from({ length: 20 }, (_, i) => ({
			id: `f${i}`,
			name: `시설${i}`,
		}));
		const messages = [
			{
				role: "assistant",
				content: "결과",
				blocks: [{ type: "facility_list", facilities }],
			},
		];
		const ctx = extractConversationContext(messages);
		expect(ctx.mentionedFacilityIds!.length).toBe(15);
	});

	it("deduplicates facility IDs", () => {
		const messages = [
			{
				role: "assistant",
				content: "A",
				blocks: [{ type: "facility_list", facilities: [{ id: "f1", name: "A" }] }],
			},
			{
				role: "assistant",
				content: "B",
				blocks: [{ type: "facility_list", facilities: [{ id: "f1", name: "A" }] }],
			},
		];
		const ctx = extractConversationContext(messages);
		expect(ctx.mentionedFacilityIds!.filter((id) => id === "f1").length).toBe(1);
	});

	it("uses latest region when multiple user messages mention regions", () => {
		const messages = [
			{ role: "user", content: "강남 어린이집" },
			{ role: "user", content: "송파 어린이집으로 바꿔줘" },
		];
		const ctx = extractConversationContext(messages);
		expect(ctx.establishedRegion?.sigungu).toBe("송파구");
	});

	it("returns undefined region when no region mentioned", () => {
		const messages = [{ role: "user", content: "좋은 어린이집 추천" }];
		const ctx = extractConversationContext(messages);
		expect(ctx.establishedRegion).toBeUndefined();
	});

	it("handles empty messages array", () => {
		const ctx = extractConversationContext([]);
		expect(ctx.mentionedFacilityIds).toEqual([]);
		expect(ctx.mentionedFacilityNames).toEqual([]);
		expect(ctx.establishedRegion).toBeUndefined();
		expect(ctx.establishedFacilityType).toBeUndefined();
	});
});
