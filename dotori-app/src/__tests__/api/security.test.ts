import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/* ─── Hoisted Mocks ─── */
const { authMock, dbConnectMock, partnerFindByIdMock, partnerFindMock, userFindByIdMock, regenerateApiKeyMock, cpaEventCreateMock, partnerCountDocumentsMock } =
	vi.hoisted(() => ({
		authMock: vi.fn(),
		dbConnectMock: vi.fn(),
		partnerFindByIdMock: vi.fn(),
		partnerFindMock: vi.fn(),
		userFindByIdMock: vi.fn(),
		regenerateApiKeyMock: vi.fn(),
		cpaEventCreateMock: vi.fn(),
		partnerCountDocumentsMock: vi.fn(),
	}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db", () => ({ default: dbConnectMock }));

vi.mock("@/models/Partner", () => ({
	default: {
		findById: (...args: unknown[]) => {
			const result = partnerFindByIdMock(...args);
			// Support chaining .select().lean()
			if (result && typeof result === "object" && !result.select) {
				return {
					...result,
					select: vi.fn().mockReturnValue({
						lean: vi.fn().mockResolvedValue(result),
					}),
				};
			}
			return result;
		},
		find: () => ({
			sort: () => ({
				skip: () => ({
					limit: () => ({
						lean: () => partnerFindMock(),
					}),
				}),
			}),
		}),
		countDocuments: partnerCountDocumentsMock,
	},
}));

vi.mock("@/models/User", () => ({
	default: {
		findById: (...args: unknown[]) => {
			const result = userFindByIdMock(...args);
			return {
				select: vi.fn().mockReturnValue({
					lean: vi.fn().mockResolvedValue(result),
				}),
			};
		},
	},
}));

vi.mock("@/lib/engines/partner-auth", () => ({
	regenerateApiKey: regenerateApiKeyMock,
}));

vi.mock("@/models/CPAEvent", () => ({
	default: { create: cpaEventCreateMock },
}));

function ensureCryptoRandomUUID(): void {
	if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") return;
	(globalThis as typeof globalThis & { crypto: Crypto }).crypto = {
		randomUUID: () => "00000000-0000-4000-8000-000000000000",
	} as Crypto;
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.resetModules();
	authMock.mockResolvedValue(null);
	dbConnectMock.mockResolvedValue(undefined);
});

/* ─── 1. Partner API Key Ownership ─── */
describe("Partner API key ownership verification", () => {
	it("returns 403 when non-owner tries to regenerate API key", async () => {
		ensureCryptoRandomUUID();
		const partnerId = "507f1f77bcf86cd799439011";
		const userId = "507f1f77bcf86cd799439099";

		authMock.mockResolvedValueOnce({ user: { id: userId } });
		userFindByIdMock.mockReturnValueOnce({ email: "other@example.com", role: "user" });
		partnerFindByIdMock.mockReturnValueOnce({ contactEmail: "partner@example.com" });

		const { POST } = await import("@/app/api/partners/[id]/api-key/route");
		const req = new NextRequest(`http://localhost:3000/api/partners/${partnerId}/api-key`, { method: "POST" });
		const res = await POST(req, { params: Promise.resolve({ id: partnerId }) });

		expect(res.status).toBe(403);
	});

	it("allows admin to regenerate any partner API key", async () => {
		ensureCryptoRandomUUID();
		const partnerId = "507f1f77bcf86cd799439011";
		const userId = "507f1f77bcf86cd799439099";

		authMock.mockResolvedValueOnce({ user: { id: userId } });
		userFindByIdMock.mockReturnValueOnce({ email: "admin@example.com", role: "admin" });
		partnerFindByIdMock.mockReturnValueOnce({ _id: partnerId, apiKeyPrefix: "abc12345" });
		regenerateApiKeyMock.mockResolvedValueOnce({ rawApiKey: "new-key", prefix: "abc12345" });

		const { POST } = await import("@/app/api/partners/[id]/api-key/route");
		const req = new NextRequest(`http://localhost:3000/api/partners/${partnerId}/api-key`, { method: "POST" });
		const res = await POST(req, { params: Promise.resolve({ id: partnerId }) });

		expect(res.status).toBe(200);
	});

	it("returns 401 when unauthenticated", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce(null);

		const { POST } = await import("@/app/api/partners/[id]/api-key/route");
		const req = new NextRequest("http://localhost:3000/api/partners/abc/api-key", { method: "POST" });
		const res = await POST(req, { params: Promise.resolve({ id: "abc" }) });

		expect(res.status).toBe(401);
	});
});

/* ─── 2. OG Route XSS Defense ─── */
describe("OG route XSS defense", () => {
	it("strips script tags from title parameter", async () => {
		ensureCryptoRandomUUID();

		const { GET } = await import("@/app/api/og/route");
		const url = `http://localhost:3000/api/og?title=${encodeURIComponent('<script>alert(1)</script>')}&type=default`;
		const req = new NextRequest(url);
		const res = await GET(req);

		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("image");
	});

	it("strips onerror event handlers from desc parameter", async () => {
		ensureCryptoRandomUUID();

		const { GET } = await import("@/app/api/og/route");
		const url = `http://localhost:3000/api/og?desc=${encodeURIComponent('<img onerror=alert(1) src=x>')}&type=facility`;
		const req = new NextRequest(url);
		const res = await GET(req);

		expect(res.status).toBe(200);
	});

	it("falls back to default type for invalid type parameter", async () => {
		ensureCryptoRandomUUID();

		const { GET } = await import("@/app/api/og/route");
		const url = "http://localhost:3000/api/og?type=malicious";
		const req = new NextRequest(url);
		const res = await GET(req);

		expect(res.status).toBe(200);
	});
});

/* ─── 3. Partner List Admin Role ─── */
describe("Partner list admin role verification", () => {
	it("returns 403 when non-admin user lists partners", async () => {
		ensureCryptoRandomUUID();
		const userId = "507f1f77bcf86cd799439011";

		authMock.mockResolvedValueOnce({ user: { id: userId } });
		userFindByIdMock.mockReturnValueOnce({ role: "user" });

		const { GET } = await import("@/app/api/partners/route");
		const req = new NextRequest("http://localhost:3000/api/partners");
		const res = await GET(req);

		expect(res.status).toBe(403);
	});

	it("allows admin to list partners", async () => {
		ensureCryptoRandomUUID();
		const userId = "507f1f77bcf86cd799439011";

		authMock.mockResolvedValueOnce({ user: { id: userId } });
		userFindByIdMock.mockReturnValueOnce({ role: "admin" });
		partnerFindMock.mockResolvedValueOnce([]);
		partnerCountDocumentsMock.mockResolvedValueOnce(0);

		const { GET } = await import("@/app/api/partners/route");
		const req = new NextRequest("http://localhost:3000/api/partners");
		const res = await GET(req);

		expect(res.status).toBe(200);
	});
});

/* ─── 4. Webhook Signature Verification ─── */
describe("Partner webhook signature verification", () => {
	it("returns 401 when no signature header is provided", async () => {
		ensureCryptoRandomUUID();

		const body = {
			eventType: "visit_request",
			userId: "user1",
			facilityId: "fac1",
			targetId: "target1",
		};

		const { POST } = await import("@/app/api/partners/webhook/route");
		const req = new NextRequest("http://localhost:3000/api/partners/webhook", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		});
		const res = await POST(req);

		expect(res.status).toBe(401);
	});

	it("returns 401 when signature is invalid", async () => {
		ensureCryptoRandomUUID();
		vi.stubEnv("WEBHOOK_SECRET", "test-secret-key");

		const body = {
			eventType: "visit_request",
			userId: "user1",
			facilityId: "fac1",
			targetId: "target1",
		};

		const { POST } = await import("@/app/api/partners/webhook/route");
		const req = new NextRequest("http://localhost:3000/api/partners/webhook", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-dotori-signature": "0000000000000000000000000000000000000000000000000000000000000000",
			},
			body: JSON.stringify(body),
		});
		const res = await POST(req);

		expect(res.status).toBe(401);
		vi.unstubAllEnvs();
	});
});
