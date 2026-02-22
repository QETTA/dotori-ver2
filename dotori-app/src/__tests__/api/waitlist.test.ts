import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { authMock, dbConnectMock, applyWaitlistMock } = vi.hoisted(() => ({
	authMock: vi.fn(),
	dbConnectMock: vi.fn(),
	applyWaitlistMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
	auth: authMock,
}));

vi.mock("@/lib/db", () => ({
	default: dbConnectMock,
}));

vi.mock("@/lib/services/waitlist-service", () => ({
	applyWaitlist: applyWaitlistMock,
}));

beforeEach(() => {
	vi.clearAllMocks();
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

describe("POST /api/waitlist", () => {
	it("returns 400 when required fields are missing", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce({ user: { id: "user-1" } });

		const { POST } = await import("@/app/api/waitlist/route");
		const req = new NextRequest("http://localhost:3000/api/waitlist", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				facilityId: "507f1f77bcf86cd799439011",
				childName: "도토리",
				// childBirthDate missing
			}),
		});

		const res = await POST(req);
		expect(res.status).toBe(400);
		expect(applyWaitlistMock).not.toHaveBeenCalled();

		const json = await res.json();
		expect(json).toMatchObject({
			code: "BAD_REQUEST",
		});
	});

	it("creates a waitlist entry for valid payload", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce({ user: { id: "user-1" } });
		applyWaitlistMock.mockResolvedValueOnce({
			success: true,
			waitlist: {
				_id: "waitlist-1",
				userId: "user-1",
				facilityId: "507f1f77bcf86cd799439011",
				childName: "도토리",
				childBirthDate: "2021-05-03",
				status: "pending",
			},
			position: 3,
		});

		const { POST } = await import("@/app/api/waitlist/route");
		const req = new NextRequest("http://localhost:3000/api/waitlist", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				facilityId: "507f1f77bcf86cd799439011",
				childName: "도토리",
				childBirthDate: "2021-05-03",
			}),
		});

		const res = await POST(req);
		expect(res.status).toBe(201);
		expect(applyWaitlistMock).toHaveBeenCalledWith({
			userId: "user-1",
			facilityId: "507f1f77bcf86cd799439011",
			childName: "도토리",
			childBirthDate: "2021-05-03",
			hasMultipleChildren: false,
			isDualIncome: false,
			isSingleParent: false,
			hasDisability: false,
		});

		const json = await res.json();
		expect(json).toMatchObject({
			data: expect.any(Object),
			position: 3,
		});
	});
});

describe("GET /api/waitlist", () => {
	it("returns 401 when unauthenticated", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce(null);

		const { GET } = await import("@/app/api/waitlist/route");
		const req = new NextRequest("http://localhost:3000/api/waitlist");
		const res = await GET(req);

		expect(res.status).toBe(401);
		const json = await res.json();
		expect(json).toMatchObject({
			error: "인증이 필요합니다",
			code: "UNAUTHORIZED",
		});
	});
});

