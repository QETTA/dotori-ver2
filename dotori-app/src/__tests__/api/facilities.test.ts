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

describe("GET /api/facilities", () => {
	it("returns a sanitized list response schema", async () => {
		ensureCryptoRandomUUID();

		facilitySearchMock.mockResolvedValueOnce({
			data: [
				{
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
					// Fields that should be stripped from list responses
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
				},
			],
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
});

