import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { buildResponse } from "../response-builder";

const mockDbConnect = jest.fn();
const mockGenerateChatResponse = jest.fn();
const mockFacilityFind = jest.fn();
const mockUserFindById = jest.fn();
const mockWaitlistFind = jest.fn();

jest.mock("@/lib/db", () => ({
	__esModule: true,
	default: () => mockDbConnect(),
}));

jest.mock("@/lib/ai/claude", () => ({
	__esModule: true,
	generateChatResponse: (...args: unknown[]) => mockGenerateChatResponse(...args),
}));

jest.mock("@/models/Facility", () => ({
	__esModule: true,
	default: {
		find: (...args: unknown[]) => mockFacilityFind(...args),
	},
}));

jest.mock("@/models/User", () => ({
	__esModule: true,
	default: {
		findById: (...args: unknown[]) => mockUserFindById(...args),
	},
}));

jest.mock("@/models/Waitlist", () => ({
	__esModule: true,
	default: {
		find: (...args: unknown[]) => mockWaitlistFind(...args),
	},
}));

jest.mock("@/lib/dto", () => ({
	__esModule: true,
	toFacilityDTO: (facility: any) => ({
		id: facility.id ?? facility._id ?? "facility-id",
		name: facility.name ?? "시설",
		type: facility.type ?? "국공립",
		status: facility.status ?? "available",
		address: facility.address ?? "주소",
		lat: facility.lat ?? 37.5,
		lng: facility.lng ?? 127.0,
		capacity: facility.capacity ?? { total: 30, current: 20, waiting: 0 },
		rating: facility.rating ?? 4.2,
		reviewCount: facility.reviewCount ?? 0,
		features: facility.features ?? [],
		evaluationGrade: facility.evaluationGrade,
	}),
	toChildProfile: (child: Record<string, string> | undefined) => child ?? null,
}));

const buildFacilityQuery = (items: unknown[]) => {
	const query: {
		sort: jest.Mock;
		limit: jest.Mock;
		lean: jest.Mock;
	} = {
		sort: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		lean: jest.fn().mockResolvedValue(items),
	};

	return query;
};

const sampleFacility = {
	_id: "f1",
	name: "해오름어린이집",
	type: "국공립",
	status: "available",
	address: "서울시 강남구",
	lat: 37.4952,
	lng: 127.0266,
	capacity: { total: 30, current: 20, waiting: 3 },
	rating: 4.3,
	reviewCount: 20,
	features: ["낮은 그룹활동", "영어수업"],
	evaluationGrade: "A",
};

const sampleFacility2 = {
	...sampleFacility,
	_id: "f2",
	name: "푸른어린이집",
};

describe("buildResponse", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockDbConnect.mockResolvedValue(undefined);
		mockGenerateChatResponse.mockResolvedValue({
			success: false,
			content: undefined,
		});
		mockFacilityFind.mockReset();
		mockUserFindById.mockReset();
		mockWaitlistFind.mockReset();
	});

	it("buildTransferResponse uses fallback with 이동 keyword", async () => {
		const response = await buildResponse("transfer", "반편성이 너무 힘들어");

		expect(response.content).toContain("이동");
		expect(response.content).not.toMatch(/이사/);
		expect(response.blocks).toHaveLength(1);
		expect(response.blocks[0]).toEqual({ type: "text", content: expect.any(String) });
	});

	it("buildRecommendResponse returns facility list and map blocks", async () => {
		mockFacilityFind.mockReturnValue(buildFacilityQuery([sampleFacility, sampleFacility2]));

		const response = await buildResponse("recommend", "강남구 어린이집 추천해줘");

		expect(mockDbConnect).toHaveBeenCalledTimes(1);
		expect(response.blocks).toEqual(
			expect.arrayContaining([
				{ type: "text", content: expect.any(String) },
				{ type: "facility_list", facilities: expect.any(Array) },
				{
					type: "map",
					center: { lat: 37.4952, lng: 127.0266 },
					markers: expect.any(Array),
				},
			]),
		);
	});

	it("buildCompareResponse returns compare block with criteria", async () => {
		mockFacilityFind.mockReturnValue(buildFacilityQuery([sampleFacility, sampleFacility2]));

		const response = await buildResponse("compare", "A vs B 비교해줘");
		const compareBlock = response.blocks.find((block) => block.type === "compare");

		expect(compareBlock).toBeDefined();
		expect(compareBlock?.type).toBe("compare");
		expect(compareBlock).toMatchObject({
			type: "compare",
			criteria: ["정원", "입소 상태", "대기", "평점", "유형"],
		});
	});

	it("buildExplainResponse includes text and action block", async () => {
		mockFacilityFind.mockReturnValue(buildFacilityQuery([]));

		const response = await buildResponse("explain", "해오름어린이집이 뭐야");
		const types = response.blocks.map((block) => block.type);

		expect(types).toContain("text");
		expect(types).toContain("actions");
		expect(response.blocks[0]).toMatchObject({ type: "text" });
	});

	it("buildKnowledgeResponse returns response with helpful fallback", async () => {
		const response = await buildResponse("knowledge", "국공립 대기 신청 방법 알려줘");

		expect(response.blocks[0]).toMatchObject({ type: "text" });
		expect(response.blocks[1]).toMatchObject({
			type: "actions",
			buttons: expect.arrayContaining([
				expect.objectContaining({ id: "explore" }),
				expect.objectContaining({ id: "checklist" }),
			]),
		});
	});

	it("buildStatusResponse returns login CTA without userId", async () => {
		const response = await buildResponse("status", "내 대기 순번 알려줘", undefined);

		const actionBlock = response.blocks.find((block) => block.type === "actions");
		expect(response.content).toContain("로그인하면");
		expect(actionBlock?.type).toBe("actions");
		expect(actionBlock).toMatchObject({
			buttons: expect.arrayContaining([expect.objectContaining({ id: "login" })]),
		});
	});

	it("buildChecklistResponse returns checklist block", async () => {
		mockFacilityFind.mockReturnValue(buildFacilityQuery([]));

		const response = await buildResponse("checklist", "입소 준비물 체크리스트");

		expect(response.blocks.some((block) => block.type === "checklist")).toBe(true);
		const checklistBlock = response.blocks.find((block) => block.type === "checklist");
		expect(checklistBlock).toMatchObject({
			type: "checklist",
			categories: expect.any(Array),
		});
	});

	it("buildGeneralResponse returns fallback guidance actions", async () => {
		const response = await buildResponse("general", "안녕하세요");
		const types = response.blocks.map((block) => block.type);

		expect(types).toContain("text");
		expect(types).toContain("actions");
	});
});
