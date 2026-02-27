import { describe, expect, it, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const { authMock, dbConnectMock, facilitySearchMock, facilityFindByIdMock } = vi.hoisted(() => ({
	authMock: vi.fn(),
	dbConnectMock: vi.fn(),
	facilitySearchMock: vi.fn(),
	facilityFindByIdMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
	auth: authMock,
}));

vi.mock("@/lib/db", () => ({
	default: dbConnectMock,
}));

vi.mock("@/lib/services/facility.service", () => ({
	facilityService: {
		search: facilitySearchMock,
		findById: facilityFindByIdMock,
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
	authMock.mockResolvedValue(null);
	dbConnectMock.mockResolvedValue(undefined);
});

function ensureCryptoRandomUUID(): void {
	if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
		return;
	}

	(globalThis as typeof globalThis & { crypto: Crypto }).crypto = {
		randomUUID: () => "00000000-0000-4000-8000-000000000000",
	} as Crypto;
}

function makeFacilityItem(overrides: Record<string, unknown> = {}) {
	return {
		id: "507f1f77bcf86cd799439011",
		name: "강남유치원",
		type: "국공립",
		status: "available",
		address: "서울특별시 강남구",
		lat: 37.5,
		lng: 127.0,
		phone: "02-0000-0000",
		capacity: { total: 30, current: 20, waiting: 3 },
		features: ["영어", "낮잠"],
		rating: 4.2,
		reviewCount: 10,
		lastSyncedAt: "2026-02-01T00:00:00.000Z",
		images: ["https://example.com/img.jpg"],
		region: { sido: "서울", sigungu: "강남구", dong: "역삼동" },
		programs: ["놀이"],
		premium: {
			isActive: true,
			plan: "pro",
			features: ["우선순위"],
			sortBoost: 5,
			verifiedAt: "2026-02-01T00:00:00.000Z",
		},
		dataQuality: { score: 80, missing: ["사진"], updatedAt: "2026-02-01T00:00:00.000Z" },
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-02-10T00:00:00.000Z",
		kakaoPlaceUrl: "https://place.map.kakao.com/123",
		kakaoPlaceId: "123",
		dataSource: "seed",
		roomCount: 3,
		teacherCount: 5,
		establishmentYear: 2010,
		operatingHours: { open: "09:00", close: "18:00", extendedCare: false },
		evaluationGrade: "A",
		...overrides,
	};
}

describe("GET /api/facilities", () => {
	it("returns a sanitized list response schema", async () => {
		ensureCryptoRandomUUID();

		facilitySearchMock.mockResolvedValueOnce({
			data: [makeFacilityItem()],
			pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
		} satisfies { data: unknown[]; pagination: Record<string, unknown> });

		const { GET } = await import("@/app/api/facilities/route");
		const req = new NextRequest("http://localhost:3000/api/facilities");

		const res = await GET(req);
		expect(res.status).toBe(200);

		const json = await res.json();
		expect(json).toMatchObject({
			data: expect.any(Array),
			pagination: {
				page: expect.any(Number),
				limit: expect.any(Number),
				total: expect.any(Number),
				totalPages: expect.any(Number),
			},
		});

		expect(json.data).toHaveLength(1);
		expect(json.data[0]).toMatchObject({
			id: "507f1f77bcf86cd799439011",
			name: "강남유치원",
			type: "국공립",
			status: "available",
			address: "서울특별시 강남구",
			capacity: { total: 30, current: 20, waiting: 3 },
		});

		expect(json.data[0]).not.toHaveProperty("dataQuality");
		expect(json.data[0]).not.toHaveProperty("createdAt");
		expect(json.data[0]).not.toHaveProperty("updatedAt");
		expect(json.data[0]).not.toHaveProperty("kakaoPlaceUrl");
		expect(json.data[0]).not.toHaveProperty("kakaoPlaceId");
		expect(json.data[0]).not.toHaveProperty("dataSource");
		expect(json.data[0]).not.toHaveProperty("roomCount");
		expect(json.data[0]).not.toHaveProperty("teacherCount");
		expect(json.data[0]).not.toHaveProperty("establishmentYear");
		expect(json.data[0]).not.toHaveProperty("operatingHours");
		expect(json.data[0]).not.toHaveProperty("evaluationGrade");
	});

	it("returns an empty list when no facilities match", async () => {
		ensureCryptoRandomUUID();

		facilitySearchMock.mockResolvedValueOnce({
			data: [],
			pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
		});

		const { GET } = await import("@/app/api/facilities/route");
		const req = new NextRequest("http://localhost:3000/api/facilities?q=없는시설");

		const res = await GET(req);
		expect(res.status).toBe(200);

		const json = await res.json();
		expect(json.data).toHaveLength(0);
		expect(json.pagination.total).toBe(0);
	});

	it("passes query parameters through to the service", async () => {
		ensureCryptoRandomUUID();

		facilitySearchMock.mockResolvedValueOnce({
			data: [],
			pagination: { page: 2, limit: 10, total: 50, totalPages: 5 },
		});

		const { GET } = await import("@/app/api/facilities/route");
		const req = new NextRequest(
			"http://localhost:3000/api/facilities?page=2&limit=10&type=국공립&sido=서울&q=강남",
		);

		const res = await GET(req);
		expect(res.status).toBe(200);

		expect(facilitySearchMock).toHaveBeenCalledWith(
			expect.objectContaining({
				page: "2",
				limit: "10",
				type: "국공립",
				sido: "서울",
				q: "강남",
			}),
		);
	});

	it("filters out full facilities when status=available", async () => {
		ensureCryptoRandomUUID();

		const availableFacility = makeFacilityItem({
			id: "507f1f77bcf86cd799439011",
			name: "빈자리유치원",
			capacity: { total: 30, current: 20, waiting: 3 },
		});
		const fullFacility = makeFacilityItem({
			id: "507f1f77bcf86cd799439012",
			name: "꽉찬유치원",
			capacity: { total: 30, current: 30, waiting: 5 },
		});

		facilitySearchMock.mockResolvedValueOnce({
			data: [availableFacility, fullFacility],
			pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
		});

		const { GET } = await import("@/app/api/facilities/route");
		const req = new NextRequest("http://localhost:3000/api/facilities?status=available");

		const res = await GET(req);
		expect(res.status).toBe(200);

		const json = await res.json();
		expect(json.data).toHaveLength(1);
		expect(json.data[0].name).toBe("빈자리유치원");
	});

	it("sorts premium facilities first when no custom sort is specified", async () => {
		ensureCryptoRandomUUID();

		const premiumFacility = makeFacilityItem({
			id: "507f1f77bcf86cd799439012",
			name: "프리미엄유치원",
			premium: { isActive: true, sortBoost: 10 },
		});
		const normalFacility = makeFacilityItem({
			id: "507f1f77bcf86cd799439011",
			name: "일반유치원",
			premium: { isActive: false, sortBoost: 0 },
		});

		facilitySearchMock.mockResolvedValueOnce({
			data: [normalFacility, premiumFacility],
			pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
		});

		const { GET } = await import("@/app/api/facilities/route");
		const req = new NextRequest("http://localhost:3000/api/facilities");

		const res = await GET(req);
		expect(res.status).toBe(200);

		const json = await res.json();
		expect(json.data).toHaveLength(2);
		expect(json.data[0].name).toBe("프리미엄유치원");
		expect(json.data[1].name).toBe("일반유치원");
	});

	it("does not apply premium sort when a custom sort param is provided", async () => {
		ensureCryptoRandomUUID();

		const premiumFacility = makeFacilityItem({
			id: "507f1f77bcf86cd799439012",
			name: "프리미엄유치원",
			premium: { isActive: true, sortBoost: 10 },
		});
		const normalFacility = makeFacilityItem({
			id: "507f1f77bcf86cd799439011",
			name: "일반유치원",
			premium: { isActive: false, sortBoost: 0 },
		});

		facilitySearchMock.mockResolvedValueOnce({
			data: [normalFacility, premiumFacility],
			pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
		});

		const { GET } = await import("@/app/api/facilities/route");
		const req = new NextRequest("http://localhost:3000/api/facilities?sort=rating");

		const res = await GET(req);
		expect(res.status).toBe(200);

		const json = await res.json();
		expect(json.data).toHaveLength(2);
		// Order should remain as returned by the service (no re-sort)
		expect(json.data[0].name).toBe("일반유치원");
		expect(json.data[1].name).toBe("프리미엄유치원");
	});

	it("returns 500 when the service throws an unexpected error", async () => {
		ensureCryptoRandomUUID();

		facilitySearchMock.mockRejectedValueOnce(new Error("DB connection lost"));

		const { GET } = await import("@/app/api/facilities/route");
		const req = new NextRequest("http://localhost:3000/api/facilities");

		const res = await GET(req);
		expect(res.status).toBe(500);

		const json = await res.json();
		expect(json).toMatchObject({ code: "INTERNAL_ERROR" });
		// Must not leak internal error details
		expect(json.message).not.toContain("DB connection lost");
	});

	it("preserves sanitized fields like name, rating, features", async () => {
		ensureCryptoRandomUUID();

		facilitySearchMock.mockResolvedValueOnce({
			data: [makeFacilityItem()],
			pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
		});

		const { GET } = await import("@/app/api/facilities/route");
		const req = new NextRequest("http://localhost:3000/api/facilities");

		const res = await GET(req);
		const json = await res.json();

		expect(json.data[0]).toHaveProperty("name", "강남유치원");
		expect(json.data[0]).toHaveProperty("rating", 4.2);
		expect(json.data[0]).toHaveProperty("features");
		expect(json.data[0].features).toEqual(["영어", "낮잠"]);
		expect(json.data[0]).toHaveProperty("region");
		expect(json.data[0].region).toMatchObject({ sido: "서울", sigungu: "강남구" });
	});
});

describe("GET /api/facilities/[id]", () => {
	it("returns a detail response schema", async () => {
		ensureCryptoRandomUUID();

		facilityFindByIdMock.mockResolvedValueOnce({
			id: "507f1f77bcf86cd799439011",
			name: "강남유치원",
			type: "국공립",
			status: "available",
			address: "서울특별시 강남구",
			lat: 37.5,
			lng: 127.0,
			capacity: { total: 30, current: 20, waiting: 3 },
			features: ["영어", "낮잠"],
			rating: 4.2,
			reviewCount: 10,
			lastSyncedAt: "2026-02-01T00:00:00.000Z",
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-02-10T00:00:00.000Z",
		} satisfies Record<string, unknown>);

		const { GET } = await import("@/app/api/facilities/[id]/route");
		const req = new NextRequest("http://localhost:3000/api/facilities/507f1f77bcf86cd799439011");
		const res = await GET(req, { params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }) });

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toMatchObject({
			data: {
				id: "507f1f77bcf86cd799439011",
				name: "강남유치원",
				type: "국공립",
				status: "available",
				address: "서울특별시 강남구",
				capacity: { total: 30, current: 20, waiting: 3 },
			},
		});
	});

	it("returns 400 for an invalid id format", async () => {
		ensureCryptoRandomUUID();

		const { ApiError } = await import("@/lib/api-handler");
		facilityFindByIdMock.mockRejectedValueOnce(new ApiError("유효하지 않은 시설 ID입니다", 400));

		const { GET } = await import("@/app/api/facilities/[id]/route");
		const req = new NextRequest("http://localhost:3000/api/facilities/not-an-objectid");
		const res = await GET(req, { params: Promise.resolve({ id: "not-an-objectid" }) });

		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json).toMatchObject({
			code: "BAD_REQUEST",
		});
	});

	it("returns 404 when the facility does not exist", async () => {
		ensureCryptoRandomUUID();

		const { NotFoundError } = await import("@/lib/api-handler");
		facilityFindByIdMock.mockRejectedValueOnce(new NotFoundError("시설을 찾을 수 없습니다"));

		const { GET } = await import("@/app/api/facilities/[id]/route");
		const req = new NextRequest("http://localhost:3000/api/facilities/507f1f77bcf86cd799439099");
		const res = await GET(req, { params: Promise.resolve({ id: "507f1f77bcf86cd799439099" }) });

		expect(res.status).toBe(404);
		const json = await res.json();
		expect(json).toMatchObject({ code: "NOT_FOUND" });
	});

	it("returns detail fields like createdAt and updatedAt", async () => {
		ensureCryptoRandomUUID();

		facilityFindByIdMock.mockResolvedValueOnce({
			id: "507f1f77bcf86cd799439011",
			name: "강남유치원",
			type: "국공립",
			status: "available",
			address: "서울특별시 강남구",
			lat: 37.5,
			lng: 127.0,
			capacity: { total: 30, current: 20, waiting: 3 },
			features: ["영어"],
			rating: 4.2,
			reviewCount: 10,
			lastSyncedAt: "2026-02-01T00:00:00.000Z",
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-02-10T00:00:00.000Z",
		});

		const { GET } = await import("@/app/api/facilities/[id]/route");
		const req = new NextRequest("http://localhost:3000/api/facilities/507f1f77bcf86cd799439011");
		const res = await GET(req, { params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }) });

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.data).toHaveProperty("createdAt");
		expect(json.data).toHaveProperty("updatedAt");
	});

	it("returns 500 when the service throws an unexpected error", async () => {
		ensureCryptoRandomUUID();

		facilityFindByIdMock.mockRejectedValueOnce(new Error("Unexpected DB failure"));

		const { GET } = await import("@/app/api/facilities/[id]/route");
		const req = new NextRequest("http://localhost:3000/api/facilities/507f1f77bcf86cd799439011");
		const res = await GET(req, { params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }) });

		expect(res.status).toBe(500);
		const json = await res.json();
		expect(json).toMatchObject({ code: "INTERNAL_ERROR" });
		expect(json.message).not.toContain("Unexpected DB failure");
	});
});
