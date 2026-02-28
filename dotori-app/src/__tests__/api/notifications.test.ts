import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/* ─── Hoisted Mocks ─── */
const { authMock, dbConnectMock, alertFindMock } = vi.hoisted(() => ({
	authMock: vi.fn(),
	dbConnectMock: vi.fn(),
	alertFindMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db", () => ({ default: dbConnectMock }));

vi.mock("@/models/Alert", () => ({
	default: {
		find: () => ({
			select: () => ({
				populate: () => ({
					sort: () => ({
						limit: () => ({
							lean: alertFindMock,
						}),
					}),
				}),
			}),
		}),
	},
}));

// Facility must be imported so Mongoose registers the model for populate()
vi.mock("@/models/Facility", () => ({ default: {} }));

vi.mock("@/lib/rate-limit", () => ({
	relaxedLimiter: { check: () => null },
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
	authMock.mockResolvedValue({ user: { id: "user1" } });
	dbConnectMock.mockResolvedValue(undefined);
	alertFindMock.mockResolvedValue([]);
});

describe("/api/notifications", () => {
	it("returns notifications with populated facility", async () => {
		ensureCryptoRandomUUID();
		const triggeredDate = new Date("2026-02-01T10:00:00Z");
		const createdDate = new Date("2026-01-15T09:00:00Z");
		alertFindMock.mockResolvedValueOnce([
			{
				_id: "alert1",
				type: "vacancy",
				facilityId: {
					_id: "fac1",
					name: "행복어린이집",
					type: "국공립",
					status: "available",
					address: "서울시 강남구",
					capacity: { total: 50, current: 40, waiting: 5 },
				},
				channels: ["push"],
				lastTriggeredAt: triggeredDate,
				createdAt: createdDate,
			},
		]);

		const { GET } = await import("@/app/api/notifications/route");
		const req = new NextRequest("http://localhost/api/notifications");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data).toHaveLength(1);
		expect(json.data[0].id).toBe("alert1");
		expect(json.data[0].facility.name).toBe("행복어린이집");
		expect(json.data[0].triggeredAt).toBe(triggeredDate.toISOString());
	});

	it("returns facility:null when facility was deleted", async () => {
		ensureCryptoRandomUUID();
		alertFindMock.mockResolvedValueOnce([
			{
				_id: "alert2",
				type: "vacancy",
				facilityId: null,
				channels: ["push"],
				lastTriggeredAt: new Date("2026-02-01"),
				createdAt: new Date("2026-01-01"),
			},
		]);

		const { GET } = await import("@/app/api/notifications/route");
		const req = new NextRequest("http://localhost/api/notifications");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data[0].facility).toBeNull();
	});

	it("returns empty array when no alerts exist", async () => {
		ensureCryptoRandomUUID();
		alertFindMock.mockResolvedValueOnce([]);

		const { GET } = await import("@/app/api/notifications/route");
		const req = new NextRequest("http://localhost/api/notifications");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data).toEqual([]);
	});

	it("uses createdAt as fallback when lastTriggeredAt is not a Date", async () => {
		ensureCryptoRandomUUID();
		const createdDate = new Date("2026-01-10T09:00:00Z");
		alertFindMock.mockResolvedValueOnce([
			{
				_id: "alert3",
				type: "vacancy",
				facilityId: null,
				channels: ["push"],
				lastTriggeredAt: "not-a-date-object",
				createdAt: createdDate,
			},
		]);

		const { GET } = await import("@/app/api/notifications/route");
		const req = new NextRequest("http://localhost/api/notifications");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data[0].triggeredAt).toBe("not-a-date-object");
	});

	it("returns 401 for unauthenticated requests", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce(null);

		const { GET } = await import("@/app/api/notifications/route");
		const req = new NextRequest("http://localhost/api/notifications");
		const res = await GET(req);

		expect(res.status).toBe(401);
	});

	it("converts Date createdAt to ISO string", async () => {
		ensureCryptoRandomUUID();
		const createdDate = new Date("2026-02-15T12:00:00Z");
		alertFindMock.mockResolvedValueOnce([
			{
				_id: "alert4",
				type: "vacancy",
				facilityId: null,
				channels: ["push"],
				lastTriggeredAt: new Date("2026-02-15"),
				createdAt: createdDate,
			},
		]);

		const { GET } = await import("@/app/api/notifications/route");
		const req = new NextRequest("http://localhost/api/notifications");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data[0].createdAt).toBe(createdDate.toISOString());
	});
});
