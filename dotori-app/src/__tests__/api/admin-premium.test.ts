import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.fn();
const dbConnectMock = vi.fn();

const facilityFindByIdMock = vi.fn();
const facilityFindByIdAndUpdateMock = vi.fn();

vi.mock("@/auth", () => ({
	auth: authMock,
}));

vi.mock("@/lib/db", () => ({
	default: dbConnectMock,
}));

vi.mock("@/lib/logger", () => {
	const log = {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		withRequestId: () => log,
	};
	return { log };
});

vi.mock("@/models/Facility", () => ({
	default: {
		findById: facilityFindByIdMock,
		findByIdAndUpdate: facilityFindByIdAndUpdateMock,
	},
}));

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;

beforeEach(() => {
	authMock.mockReset();
	dbConnectMock.mockReset();
	facilityFindByIdMock.mockReset();
	facilityFindByIdAndUpdateMock.mockReset();

	dbConnectMock.mockResolvedValue(undefined);
});

afterEach(() => {
	if (typeof ORIGINAL_CRON_SECRET === "undefined") {
		delete process.env.CRON_SECRET;
	} else {
		process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
	}
});

describe("PUT /api/admin/facility/[id]/premium", () => {
	it("returns 401 when CRON_SECRET is missing", async () => {
		process.env.CRON_SECRET = "test-cron-secret";
		authMock
			.mockResolvedValueOnce({ user: { id: "admin-1", role: "admin" } })
			.mockResolvedValueOnce(null);

		const { PUT } = await import("@/app/api/admin/facility/[id]/premium/route");
		const facilityId = "507f1f77bcf86cd799439011";
		const req = new NextRequest(
			`http://localhost/api/admin/facility/${facilityId}/premium`,
			{
				method: "PUT",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({ isActive: true }),
			},
		);

		const res = await PUT(req, { params: Promise.resolve({ id: facilityId }) });
		expect(res.status).toBe(401);

		const json = await res.json();
		expect(json).toMatchObject({
			error: "인증이 필요합니다",
			code: "UNAUTHORIZED",
		});
		expect(facilityFindByIdMock).not.toHaveBeenCalled();
	});

	it("succeeds with a valid Bearer token", async () => {
		process.env.CRON_SECRET = "test-cron-secret";
		authMock.mockResolvedValue(null);

		const facilityId = "507f1f77bcf86cd799439011";
		facilityFindByIdMock.mockReturnValue({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockReturnValue({
					exec: vi.fn().mockResolvedValue({
						_id: facilityId,
						premium: { isActive: false, plan: "basic", features: [], sortBoost: 0 },
					}),
				}),
			}),
		});
		facilityFindByIdAndUpdateMock.mockReturnValue({
			select: vi.fn().mockResolvedValue({
				isPremium: true,
				premium: {
					isActive: true,
					plan: "pro",
					features: ["알림", "프로필"],
					sortBoost: 5,
				},
			}),
		});

		const { PUT } = await import("@/app/api/admin/facility/[id]/premium/route");
		const req = new NextRequest(
			`http://localhost/api/admin/facility/${facilityId}/premium`,
			{
				method: "PUT",
				headers: {
					authorization: `Bearer ${process.env.CRON_SECRET}`,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					isActive: true,
					plan: "pro",
					features: [" 알림 ", " ", "프로필"],
					sortBoost: 5,
				}),
			},
		);

		const res = await PUT(req, { params: Promise.resolve({ id: facilityId }) });
		expect(res.status).toBe(200);

		const json = await res.json();
		expect(json).toMatchObject({
			data: {
				id: facilityId,
				isPremium: true,
				premium: {
					isActive: true,
					plan: "pro",
					features: ["알림", "프로필"],
					sortBoost: 5,
				},
			},
		});
		expect(dbConnectMock).toHaveBeenCalledTimes(1);
	});
});

