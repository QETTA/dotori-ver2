import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, dbConnectMock, alertListActiveMock, alertCreateMock, userFindByIdMock } =
	vi.hoisted(() => ({
		authMock: vi.fn(),
		dbConnectMock: vi.fn(),
		alertListActiveMock: vi.fn(),
		alertCreateMock: vi.fn(),
		userFindByIdMock: vi.fn(),
	}));

vi.mock("@/auth", () => ({
	auth: authMock,
}));

vi.mock("@/lib/db", () => ({
	default: dbConnectMock,
}));

vi.mock("@/lib/services/alert.service", () => ({
	alertService: {
		listActive: alertListActiveMock,
		create: alertCreateMock,
	},
}));

vi.mock("@/models/User", () => ({
	default: {
		findById: userFindByIdMock,
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

function getCanonicalError(body: unknown): Record<string, unknown> {
	if (!body || typeof body !== "object") {
		return {};
	}

	const record = body as Record<string, unknown>;
	if (record.error && typeof record.error === "object") {
		return record.error as Record<string, unknown>;
	}
	return record;
}

function getErrorMessage(body: unknown): string {
	if (!body || typeof body !== "object") {
		return "";
	}

	const record = body as Record<string, unknown>;
	if (typeof record.error === "string") {
		return record.error;
	}
	if (typeof record.message === "string") {
		return record.message;
	}

	const canonical = getCanonicalError(body);
	return typeof canonical.message === "string" ? canonical.message : "";
}

describe("GET /api/alerts", () => {
	it("returns 401 when unauthenticated", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce(null);

		const { GET } = await import("@/app/api/alerts/route");
		const req = new NextRequest("http://localhost:3000/api/alerts");
		const res = await GET(req);

		expect(res.status).toBe(401);
		const json = await res.json();
		const canonical = getCanonicalError(json);
		const code = typeof json.code === "string" ? json.code : "";
		const canonicalCode = typeof canonical.code === "string" ? canonical.code : "";
		expect(["UNAUTHORIZED", "UNAUTHENTICATED"]).toContain(code);
		expect(["UNAUTHORIZED", "UNAUTHENTICATED"]).toContain(canonicalCode);
		expect(getErrorMessage(json)).toContain("인증");
	});

	it("returns a list of active alerts for authenticated user", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce({ user: { id: "507f1f77bcf86cd799439011" } });

		const now = new Date("2026-02-20T00:00:00.000Z");
		alertListActiveMock.mockResolvedValueOnce({
			data: [
				{
					_id: "alert-1",
					userId: "507f1f77bcf86cd799439011",
					facilityId: "507f1f77bcf86cd799439022",
					type: "vacancy",
					condition: {},
					channels: ["push"],
					active: true,
					createdAt: now,
					updatedAt: now,
				},
			],
			pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
		});

		const { GET } = await import("@/app/api/alerts/route");
		const req = new NextRequest("http://localhost:3000/api/alerts");
		const res = await GET(req);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.data).toHaveLength(1);
		expect(json.data[0]).toMatchObject({
			type: "vacancy",
			channels: ["push"],
			active: true,
		});
	});

	it("sorts vacancy alerts before other types", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce({ user: { id: "507f1f77bcf86cd799439011" } });

		const now = new Date("2026-02-20T00:00:00.000Z");
		alertListActiveMock.mockResolvedValueOnce({
			data: [
				{
					_id: "alert-review",
					userId: "507f1f77bcf86cd799439011",
					facilityId: "507f1f77bcf86cd799439022",
					type: "review",
					condition: {},
					channels: ["push"],
					active: true,
					createdAt: new Date("2026-02-21T00:00:00.000Z"),
					updatedAt: now,
				},
				{
					_id: "alert-vacancy",
					userId: "507f1f77bcf86cd799439011",
					facilityId: "507f1f77bcf86cd799439033",
					type: "vacancy",
					condition: {},
					channels: ["push"],
					active: true,
					createdAt: new Date("2026-02-19T00:00:00.000Z"),
					updatedAt: now,
				},
			],
			pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
		});

		const { GET } = await import("@/app/api/alerts/route");
		const req = new NextRequest("http://localhost:3000/api/alerts");
		const res = await GET(req);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.data).toHaveLength(2);
		expect(json.data[0].type).toBe("vacancy");
		expect(json.data[1].type).toBe("review");
	});

	it("returns an empty list when no active alerts exist", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce({ user: { id: "507f1f77bcf86cd799439011" } });
		alertListActiveMock.mockResolvedValueOnce({
			data: [],
			pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
		});

		const { GET } = await import("@/app/api/alerts/route");
		const req = new NextRequest("http://localhost:3000/api/alerts");
		const res = await GET(req);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.data).toHaveLength(0);
		expect(json.pagination.total).toBe(0);
	});

	it("returns 500 when the service throws an unexpected error", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce({ user: { id: "507f1f77bcf86cd799439011" } });
		alertListActiveMock.mockRejectedValueOnce(new Error("DB failure"));

		const { GET } = await import("@/app/api/alerts/route");
		const req = new NextRequest("http://localhost:3000/api/alerts");
		const res = await GET(req);

		expect(res.status).toBe(500);
		const json = await res.json();
		expect(json).toMatchObject({ code: "INTERNAL_ERROR" });
		expect(json.message).not.toContain("DB failure");
	});
});

describe("POST /api/alerts", () => {
	it("returns 401 when unauthenticated", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce(null);

		const { POST } = await import("@/app/api/alerts/route");
		const req = new NextRequest("http://localhost:3000/api/alerts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				facilityId: "507f1f77bcf86cd799439022",
				type: "vacancy",
			}),
		});
		const res = await POST(req);

		expect(res.status).toBe(401);
		const json = await res.json();
		const canonical = getCanonicalError(json);
		const code = typeof json.code === "string" ? json.code : "";
		const canonicalCode = typeof canonical.code === "string" ? canonical.code : "";
		expect(["UNAUTHORIZED", "UNAUTHENTICATED"]).toContain(code);
		expect(["UNAUTHORIZED", "UNAUTHENTICATED"]).toContain(canonicalCode);
	});

	it("returns 400 when facilityId is missing", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce({ user: { id: "507f1f77bcf86cd799439011" } });

		const { POST } = await import("@/app/api/alerts/route");
		const req = new NextRequest("http://localhost:3000/api/alerts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				type: "vacancy",
			}),
		});
		const res = await POST(req);

		expect(res.status).toBe(400);
		const json = await res.json();
		const code = typeof json.code === "string" ? json.code : "";
		expect(["BAD_REQUEST", "VALIDATION_ERROR"]).toContain(code);
	});

	it("returns 400 when type is invalid", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce({ user: { id: "507f1f77bcf86cd799439011" } });

		const { POST } = await import("@/app/api/alerts/route");
		const req = new NextRequest("http://localhost:3000/api/alerts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				facilityId: "507f1f77bcf86cd799439022",
				type: "invalid_type",
			}),
		});
		const res = await POST(req);

		expect(res.status).toBe(400);
		const json = await res.json();
		const code = typeof json.code === "string" ? json.code : "";
		expect(["BAD_REQUEST", "VALIDATION_ERROR"]).toContain(code);
	});

	it("returns 400 when facilityId has invalid ObjectId format", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce({ user: { id: "507f1f77bcf86cd799439011" } });

		const { POST } = await import("@/app/api/alerts/route");
		const req = new NextRequest("http://localhost:3000/api/alerts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				facilityId: "not-valid-id",
				type: "vacancy",
			}),
		});
		const res = await POST(req);

		expect(res.status).toBe(400);
		const json = await res.json();
		const code = typeof json.code === "string" ? json.code : "";
		expect(["BAD_REQUEST", "VALIDATION_ERROR"]).toContain(code);
	});

	it("returns 400 for invalid JSON body", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce({ user: { id: "507f1f77bcf86cd799439011" } });

		const { POST } = await import("@/app/api/alerts/route");
		const req = new NextRequest("http://localhost:3000/api/alerts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: "not-json",
		});
		const res = await POST(req);

		expect(res.status).toBe(400);
		const json = await res.json();
		const code = typeof json.code === "string" ? json.code : "";
		expect(["BAD_REQUEST", "VALIDATION_ERROR"]).toContain(code);
	});

	it("returns requiresPremium flag for free users requesting vacancy alerts", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce({ user: { id: "507f1f77bcf86cd799439011" } });
		userFindByIdMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockResolvedValue({ plan: "free" }),
			}),
		});

		const { POST } = await import("@/app/api/alerts/route");
		const req = new NextRequest("http://localhost:3000/api/alerts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				facilityId: "507f1f77bcf86cd799439022",
				type: "vacancy",
			}),
		});
		const res = await POST(req);

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.requiresPremium).toBe(true);
		expect(json.data).toBeNull();
		expect(alertCreateMock).not.toHaveBeenCalled();
	});

	it("creates a vacancy alert for premium users", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce({ user: { id: "507f1f77bcf86cd799439011" } });
		userFindByIdMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockResolvedValue({ plan: "premium" }),
			}),
		});

		const createdAlert = {
			_id: "alert-new",
			userId: "507f1f77bcf86cd799439011",
			facilityId: "507f1f77bcf86cd799439022",
			type: "vacancy",
			condition: {},
			channels: ["push"],
			active: true,
			createdAt: new Date("2026-02-20T00:00:00.000Z"),
		};
		alertCreateMock.mockResolvedValueOnce(createdAlert);

		const { POST } = await import("@/app/api/alerts/route");
		const req = new NextRequest("http://localhost:3000/api/alerts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				facilityId: "507f1f77bcf86cd799439022",
				type: "vacancy",
				channels: ["push"],
			}),
		});
		const res = await POST(req);

		expect(res.status).toBe(201);
		const json = await res.json();
		expect(json.data).toMatchObject({
			type: "vacancy",
			channels: ["push"],
		});
		expect(alertCreateMock).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "507f1f77bcf86cd799439011",
				facilityId: "507f1f77bcf86cd799439022",
				type: "vacancy",
				channels: ["push"],
			}),
		);
	});

	it("creates a non-vacancy alert for free users", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce({ user: { id: "507f1f77bcf86cd799439011" } });
		userFindByIdMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockResolvedValue({ plan: "free" }),
			}),
		});

		const createdAlert = {
			_id: "alert-review",
			userId: "507f1f77bcf86cd799439011",
			facilityId: "507f1f77bcf86cd799439022",
			type: "review",
			condition: {},
			channels: ["push"],
			active: true,
			createdAt: new Date("2026-02-20T00:00:00.000Z"),
		};
		alertCreateMock.mockResolvedValueOnce(createdAlert);

		const { POST } = await import("@/app/api/alerts/route");
		const req = new NextRequest("http://localhost:3000/api/alerts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				facilityId: "507f1f77bcf86cd799439022",
				type: "review",
			}),
		});
		const res = await POST(req);

		expect(res.status).toBe(201);
		const json = await res.json();
		expect(json.data).toMatchObject({ type: "review" });
	});

	it("returns 404 when user document is not found", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce({ user: { id: "507f1f77bcf86cd799439011" } });
		userFindByIdMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockResolvedValue(null),
			}),
		});

		const { POST } = await import("@/app/api/alerts/route");
		const req = new NextRequest("http://localhost:3000/api/alerts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				facilityId: "507f1f77bcf86cd799439022",
				type: "review",
			}),
		});
		const res = await POST(req);

		expect(res.status).toBe(404);
		const json = await res.json();
		expect(json).toMatchObject({ code: "NOT_FOUND" });
	});

	it("returns 500 when the service throws an unexpected error during create", async () => {
		ensureCryptoRandomUUID();

		authMock.mockResolvedValueOnce({ user: { id: "507f1f77bcf86cd799439011" } });
		userFindByIdMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockResolvedValue({ plan: "premium" }),
			}),
		});
		alertCreateMock.mockRejectedValueOnce(new Error("Unexpected error"));

		const { POST } = await import("@/app/api/alerts/route");
		const req = new NextRequest("http://localhost:3000/api/alerts", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				facilityId: "507f1f77bcf86cd799439022",
				type: "vacancy",
			}),
		});
		const res = await POST(req);

		expect(res.status).toBe(500);
		const json = await res.json();
		expect(json).toMatchObject({ code: "INTERNAL_ERROR" });
		expect(json.message).not.toContain("Unexpected error");
	});
});
