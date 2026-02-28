import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/* ─── Hoisted Mocks ─── */
const {
	authMock,
	dbConnectMock,
	alertServiceFindByIdMock,
	alertServiceDeleteByIdMock,
	commentFindOneMock,
	commentDeleteOneMock,
	postFindByIdAndUpdateMock,
} = vi.hoisted(() => ({
	authMock: vi.fn(),
	dbConnectMock: vi.fn(),
	alertServiceFindByIdMock: vi.fn(),
	alertServiceDeleteByIdMock: vi.fn(),
	commentFindOneMock: vi.fn(),
	commentDeleteOneMock: vi.fn(),
	postFindByIdAndUpdateMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db", () => ({ default: dbConnectMock }));

vi.mock("@/lib/services/alert.service", () => ({
	alertService: {
		findById: alertServiceFindByIdMock,
		deleteById: alertServiceDeleteByIdMock,
	},
}));

vi.mock("@/models/Comment", () => ({
	default: {
		findOne: commentFindOneMock,
		deleteOne: commentDeleteOneMock,
	},
}));

vi.mock("@/models/Post", () => ({
	default: {
		findByIdAndUpdate: postFindByIdAndUpdateMock,
	},
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

/* ─── Alert DELETE ─── */
describe("DELETE /api/alerts/[id]", () => {
	const alertId = "507f1f77bcf86cd799439022";
	const userId = "507f1f77bcf86cd799439011";

	it("returns 401 when unauthenticated", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce(null);

		const { DELETE } = await import("@/app/api/alerts/[id]/route");
		const req = new NextRequest(`http://localhost:3000/api/alerts/${alertId}`, { method: "DELETE" });
		const res = await DELETE(req, { params: Promise.resolve({ id: alertId }) });

		expect(res.status).toBe(401);
	});

	it("deletes own alert successfully", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce({ user: { id: userId } });
		alertServiceDeleteByIdMock.mockResolvedValueOnce(true);

		const { DELETE } = await import("@/app/api/alerts/[id]/route");
		const req = new NextRequest(`http://localhost:3000/api/alerts/${alertId}`, { method: "DELETE" });
		const res = await DELETE(req, { params: Promise.resolve({ id: alertId }) });

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.data.deleted).toBe(true);
		expect(alertServiceDeleteByIdMock).toHaveBeenCalledWith(userId, alertId);
	});

	it("returns 404 when alert belongs to another user", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce({ user: { id: userId } });

		// alertService.deleteById throws NotFoundError when userId doesn't match
		const { NotFoundError } = await import("@/lib/api-handler");
		alertServiceDeleteByIdMock.mockRejectedValueOnce(new NotFoundError("알림을 찾을 수 없습니다"));

		const { DELETE } = await import("@/app/api/alerts/[id]/route");
		const req = new NextRequest(`http://localhost:3000/api/alerts/${alertId}`, { method: "DELETE" });
		const res = await DELETE(req, { params: Promise.resolve({ id: alertId }) });

		expect(res.status).toBe(404);
	});
});

/* ─── Alert GET ─── */
describe("GET /api/alerts/[id]", () => {
	const alertId = "507f1f77bcf86cd799439022";
	const userId = "507f1f77bcf86cd799439011";

	it("returns alert for owner", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce({ user: { id: userId } });
		alertServiceFindByIdMock.mockResolvedValueOnce({
			_id: alertId,
			userId,
			type: "vacancy",
			active: true,
		});

		const { GET } = await import("@/app/api/alerts/[id]/route");
		const req = new NextRequest(`http://localhost:3000/api/alerts/${alertId}`);
		const res = await GET(req, { params: Promise.resolve({ id: alertId }) });

		expect(res.status).toBe(200);
	});

	it("returns 404 for non-owner", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce({ user: { id: userId } });
		alertServiceFindByIdMock.mockResolvedValueOnce({
			_id: alertId,
			userId: "507f1f77bcf86cd799439099", // different user
			type: "vacancy",
		});

		const { GET } = await import("@/app/api/alerts/[id]/route");
		const req = new NextRequest(`http://localhost:3000/api/alerts/${alertId}`);
		const res = await GET(req, { params: Promise.resolve({ id: alertId }) });

		expect(res.status).toBe(404);
	});
});

/* ─── Comment PATCH ─── */
describe("PATCH /api/community/posts/[id]/comments/[commentId]", () => {
	const postId = "507f1f77bcf86cd799439022";
	const commentId = "507f1f77bcf86cd799439033";
	const userId = "507f1f77bcf86cd799439011";

	it("returns 403 when non-author tries to edit comment", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce({ user: { id: userId } });
		commentFindOneMock.mockResolvedValueOnce({
			_id: commentId,
			postId,
			authorId: "507f1f77bcf86cd799439099", // different user
			content: "original",
			author: { nickname: "other" },
		});

		const { PATCH } = await import("@/app/api/community/posts/[id]/comments/[commentId]/route");
		const req = new NextRequest(`http://localhost:3000/api/community/posts/${postId}/comments/${commentId}`, {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ content: "updated" }),
		});
		const res = await PATCH(req, { params: Promise.resolve({ id: postId, commentId }) });

		expect(res.status).toBe(403);
	});

	it("allows author to edit their comment", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce({ user: { id: userId } });

		const mockComment = {
			_id: commentId,
			postId,
			authorId: userId,
			content: "original",
			author: { nickname: "me", verified: false },
			likes: 0,
			createdAt: new Date("2026-02-20T00:00:00.000Z"),
			updatedAt: new Date("2026-02-20T00:00:00.000Z"),
			save: vi.fn().mockResolvedValue(undefined),
		};
		commentFindOneMock.mockResolvedValueOnce(mockComment);

		const { PATCH } = await import("@/app/api/community/posts/[id]/comments/[commentId]/route");
		const req = new NextRequest(`http://localhost:3000/api/community/posts/${postId}/comments/${commentId}`, {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ content: "updated content" }),
		});
		const res = await PATCH(req, { params: Promise.resolve({ id: postId, commentId }) });

		expect(res.status).toBe(200);
		expect(mockComment.save).toHaveBeenCalled();
	});
});

/* ─── Comment DELETE ─── */
describe("DELETE /api/community/posts/[id]/comments/[commentId]", () => {
	const postId = "507f1f77bcf86cd799439022";
	const commentId = "507f1f77bcf86cd799439033";
	const userId = "507f1f77bcf86cd799439011";

	it("returns 403 when non-author tries to delete comment", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce({ user: { id: userId } });
		commentFindOneMock.mockResolvedValueOnce({
			_id: commentId,
			postId,
			authorId: "507f1f77bcf86cd799439099", // different user
		});

		const { DELETE } = await import("@/app/api/community/posts/[id]/comments/[commentId]/route");
		const req = new NextRequest(`http://localhost:3000/api/community/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
		const res = await DELETE(req, { params: Promise.resolve({ id: postId, commentId }) });

		expect(res.status).toBe(403);
	});

	it("allows author to delete their comment", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce({ user: { id: userId } });
		commentFindOneMock.mockResolvedValueOnce({
			_id: commentId,
			postId,
			authorId: userId,
		});
		commentDeleteOneMock.mockResolvedValueOnce({ deletedCount: 1 });
		postFindByIdAndUpdateMock.mockResolvedValueOnce({});

		const { DELETE } = await import("@/app/api/community/posts/[id]/comments/[commentId]/route");
		const req = new NextRequest(`http://localhost:3000/api/community/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
		const res = await DELETE(req, { params: Promise.resolve({ id: postId, commentId }) });

		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.data.deleted).toBe(true);
	});
});
