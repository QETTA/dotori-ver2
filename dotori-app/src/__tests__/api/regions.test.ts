import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/* ─── Hoisted Mocks ─── */
const { authMock, dbConnectMock, facilityDistinctMock } = vi.hoisted(() => ({
	authMock: vi.fn(),
	dbConnectMock: vi.fn(),
	facilityDistinctMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db", () => ({ default: dbConnectMock }));

vi.mock("@/models/Facility", () => ({
	default: {
		distinct: facilityDistinctMock,
	},
}));

vi.mock("@/lib/logger", () => ({
	log: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), withRequestId: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() }) },
}));

function ensureCryptoRandomUUID(): void {
	if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") return;
	(globalThis as typeof globalThis & { crypto: Crypto }).crypto = {
		randomUUID: () => "00000000-0000-4000-8000-000000000000",
	} as Crypto;
}

beforeEach(() => {
	vi.clearAllMocks();
	authMock.mockResolvedValue(null);
	dbConnectMock.mockResolvedValue(undefined);
});

describe("/api/regions/sido", () => {
	it("returns sorted sido list", async () => {
		ensureCryptoRandomUUID();
		facilityDistinctMock.mockResolvedValueOnce(["경기도", "서울특별시", "부산광역시"]);

		const { GET } = await import("@/app/api/regions/sido/route");
		const req = new NextRequest("http://localhost/api/regions/sido");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data).toEqual(["경기도", "부산광역시", "서울특별시"]);
		expect(facilityDistinctMock).toHaveBeenCalledWith("region.sido");
	});

	it("returns empty array on DB error", async () => {
		ensureCryptoRandomUUID();
		facilityDistinctMock.mockRejectedValueOnce(new Error("DB error"));

		const { GET } = await import("@/app/api/regions/sido/route");
		const req = new NextRequest("http://localhost/api/regions/sido");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data).toEqual([]);
	});

	it("does not require authentication", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce(null);
		facilityDistinctMock.mockResolvedValueOnce(["서울특별시"]);

		const { GET } = await import("@/app/api/regions/sido/route");
		const req = new NextRequest("http://localhost/api/regions/sido");
		const res = await GET(req);

		expect(res.status).toBe(200);
	});

	it("sets Cache-Control header with s-maxage=3600", async () => {
		ensureCryptoRandomUUID();
		facilityDistinctMock.mockResolvedValueOnce(["서울특별시"]);

		const { GET } = await import("@/app/api/regions/sido/route");
		const req = new NextRequest("http://localhost/api/regions/sido");
		const res = await GET(req);

		expect(res.headers.get("Cache-Control")).toContain("s-maxage=3600");
	});
});

describe("/api/regions/sigungu", () => {
	it("returns sigungu list for given sido", async () => {
		ensureCryptoRandomUUID();
		facilityDistinctMock.mockResolvedValueOnce(["강남구", "서초구", "송파구"]);

		const { GET } = await import("@/app/api/regions/sigungu/route");
		const req = new NextRequest("http://localhost/api/regions/sigungu?sido=서울특별시");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data).toEqual(["강남구", "서초구", "송파구"]);
		expect(facilityDistinctMock).toHaveBeenCalledWith("region.sigungu", { "region.sido": "서울특별시" });
	});

	it("returns 400 when sido parameter is missing", async () => {
		ensureCryptoRandomUUID();

		const { GET } = await import("@/app/api/regions/sigungu/route");
		const req = new NextRequest("http://localhost/api/regions/sigungu");
		const res = await GET(req);

		expect(res.status).toBe(400);
	});

	it("returns empty array for non-existent sido", async () => {
		ensureCryptoRandomUUID();
		facilityDistinctMock.mockResolvedValueOnce([]);

		const { GET } = await import("@/app/api/regions/sigungu/route");
		const req = new NextRequest("http://localhost/api/regions/sigungu?sido=존재하지않는시도");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data).toEqual([]);
	});
});
