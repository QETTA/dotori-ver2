import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/* ─── Hoisted Mocks ─── */
const { authMock, dbConnectMock, likePostMock, unlikePostMock } = vi.hoisted(() => ({
	authMock: vi.fn(),
	dbConnectMock: vi.fn(),
	likePostMock: vi.fn(),
	unlikePostMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db", () => ({ default: dbConnectMock }));

vi.mock("@/lib/services/post.service", () => ({
	postService: {
		likePost: likePostMock,
		unlikePost: unlikePostMock,
	},
}));

vi.mock("@/lib/rate-limit", () => ({
	standardLimiter: { check: () => null },
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

const VALID_POST_ID = "507f1f77bcf86cd799439011";

beforeEach(() => {
	vi.clearAllMocks();
	authMock.mockResolvedValue({ user: { id: "user1" } });
	dbConnectMock.mockResolvedValue(undefined);
});

describe("/api/community/posts/[id]/like", () => {
	describe("POST (likePost)", () => {
		it("calls likePost and returns likes count", async () => {
			ensureCryptoRandomUUID();
			likePostMock.mockResolvedValueOnce({ likes: 5 });

			const { POST } = await import("@/app/api/community/posts/[id]/like/route");
			const req = new NextRequest(`http://localhost/api/community/posts/${VALID_POST_ID}/like`, { method: "POST" });
			const res = await POST(req, { params: Promise.resolve({ id: VALID_POST_ID }) });
			const json = await res.json();

			expect(res.status).toBe(200);
			expect(json.data.likes).toBe(5);
			expect(likePostMock).toHaveBeenCalledWith(VALID_POST_ID, "user1");
		});

		it("returns error when post not found", async () => {
			ensureCryptoRandomUUID();
			const { NotFoundError } = await import("@/lib/api-handler");
			likePostMock.mockRejectedValueOnce(new NotFoundError("게시물을 찾을 수 없습니다"));

			const { POST } = await import("@/app/api/community/posts/[id]/like/route");
			const req = new NextRequest(`http://localhost/api/community/posts/${VALID_POST_ID}/like`, { method: "POST" });
			const res = await POST(req, { params: Promise.resolve({ id: VALID_POST_ID }) });

			expect(res.status).toBe(404);
		});

		it("returns error for invalid ObjectId", async () => {
			ensureCryptoRandomUUID();
			const { ApiError } = await import("@/lib/api-handler");
			likePostMock.mockRejectedValueOnce(new ApiError("유효하지 않은 게시물 ID입니다", 400));

			const { POST } = await import("@/app/api/community/posts/[id]/like/route");
			const req = new NextRequest("http://localhost/api/community/posts/invalid/like", { method: "POST" });
			const res = await POST(req, { params: Promise.resolve({ id: "invalid" }) });

			expect(res.status).toBe(400);
		});
	});

	describe("DELETE (unlikePost)", () => {
		it("calls unlikePost and returns likes count", async () => {
			ensureCryptoRandomUUID();
			unlikePostMock.mockResolvedValueOnce({ likes: 3 });

			const { DELETE } = await import("@/app/api/community/posts/[id]/like/route");
			const req = new NextRequest(`http://localhost/api/community/posts/${VALID_POST_ID}/like`, { method: "DELETE" });
			const res = await DELETE(req, { params: Promise.resolve({ id: VALID_POST_ID }) });
			const json = await res.json();

			expect(res.status).toBe(200);
			expect(json.data.likes).toBe(3);
			expect(unlikePostMock).toHaveBeenCalledWith(VALID_POST_ID, "user1");
		});

		it("returns error when post not found on unlike", async () => {
			ensureCryptoRandomUUID();
			const { NotFoundError } = await import("@/lib/api-handler");
			unlikePostMock.mockRejectedValueOnce(new NotFoundError("게시물을 찾을 수 없습니다"));

			const { DELETE } = await import("@/app/api/community/posts/[id]/like/route");
			const req = new NextRequest(`http://localhost/api/community/posts/${VALID_POST_ID}/like`, { method: "DELETE" });
			const res = await DELETE(req, { params: Promise.resolve({ id: VALID_POST_ID }) });

			expect(res.status).toBe(404);
		});
	});

	it("returns 401 for unauthenticated POST", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce(null);

		const { POST } = await import("@/app/api/community/posts/[id]/like/route");
		const req = new NextRequest(`http://localhost/api/community/posts/${VALID_POST_ID}/like`, { method: "POST" });
		const res = await POST(req, { params: Promise.resolve({ id: VALID_POST_ID }) });

		expect(res.status).toBe(401);
	});

	it("returns 401 for unauthenticated DELETE", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce(null);

		const { DELETE } = await import("@/app/api/community/posts/[id]/like/route");
		const req = new NextRequest(`http://localhost/api/community/posts/${VALID_POST_ID}/like`, { method: "DELETE" });
		const res = await DELETE(req, { params: Promise.resolve({ id: VALID_POST_ID }) });

		expect(res.status).toBe(401);
	});
});
