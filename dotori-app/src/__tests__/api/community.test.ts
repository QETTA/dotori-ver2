import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";

const authMock = vi.fn();
const dbConnectMock = vi.fn();

const postServiceListMock = vi.fn();
const postServiceCreateMock = vi.fn();

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

vi.mock("@/lib/services/post.service", () => ({
	postService: {
		list: postServiceListMock,
		create: postServiceCreateMock,
	},
}));

beforeEach(() => {
	authMock.mockReset();
	dbConnectMock.mockReset();
	postServiceListMock.mockReset();
	postServiceCreateMock.mockReset();

	dbConnectMock.mockResolvedValue(undefined);
});

describe("GET /api/community/posts", () => {
	it("validates list response schema", async () => {
		authMock.mockResolvedValue(null);
		postServiceListMock.mockResolvedValue({
			data: [
				{
					id: "post-1",
					authorId: "user-1",
					author: { nickname: "익명", verified: false },
					title: "제목",
					content: "내용이 충분히 깁니다",
					category: "question",
					facilityTags: [],
					aiSummary: "요약",
					likes: 0,
					likedBy: [],
					commentCount: 0,
					createdAt: "2026-02-22T00:00:00.000Z",
				},
			],
			pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
		});

		const { GET } = await import("@/app/api/community/posts/route");
		const req = new NextRequest("http://localhost/api/community/posts?page=1&limit=20", {
			method: "GET",
		});

		const res = await GET(req);
		expect(res.status).toBe(200);
		expect(res.headers.get("Cache-Control")).toBe("public, s-maxage=15, stale-while-revalidate=30");

		const json = await res.json();

		const postSchema = z
			.object({
				id: z.string(),
				author: z
					.object({
						nickname: z.string(),
						verified: z.boolean(),
						avatar: z.string().optional(),
					})
					.passthrough(),
				title: z.string().optional(),
				content: z.string(),
				category: z.enum(["question", "review", "info", "feedback"]),
				facilityTags: z.array(z.string()),
				aiSummary: z.string().optional(),
				likes: z.number(),
				likedBy: z.array(z.string()),
				commentCount: z.number(),
				createdAt: z.string(),
			})
			.passthrough()
			.superRefine((value, ctx) => {
				if ("authorId" in value) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "authorId must be removed from list response",
					});
				}
			});

		const listSchema = z
			.object({
				data: z.array(postSchema),
				pagination: z.object({
					page: z.number(),
					limit: z.number(),
					total: z.number(),
					totalPages: z.number(),
				}),
			})
			.passthrough();

		expect(() => listSchema.parse(json)).not.toThrow();
	});
});

describe("POST /api/community/posts", () => {
	it("returns 401 when unauthenticated", async () => {
		authMock.mockResolvedValue(null);

		const { POST } = await import("@/app/api/community/posts/route");
		const req = new NextRequest("http://localhost/api/community/posts", {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				title: "제목",
				content: "내용이 충분히 깁니다",
				category: "question",
			}),
		});

		const res = await POST(req);
		expect(res.status).toBe(401);

		const json = await res.json();
		expect(json).toMatchObject({
			error: "인증이 필요합니다",
			code: "UNAUTHORIZED",
		});
		expect(postServiceCreateMock).not.toHaveBeenCalled();
	});

	it("creates a post with valid data", async () => {
		authMock.mockResolvedValue({
			user: { id: "user-1", name: "홍길동", image: "https://example.com/avatar.png" },
		});
		postServiceCreateMock.mockResolvedValue({
			id: "post-1",
			authorId: "user-1",
			author: { nickname: "홍길동", verified: false, avatar: "https://example.com/avatar.png" },
			title: "제목",
			content: "내용이 충분히 깁니다",
			category: "question",
			facilityTags: [],
			likes: 0,
			likedBy: [],
			commentCount: 0,
			createdAt: "2026-02-22T00:00:00.000Z",
		});

		const { POST } = await import("@/app/api/community/posts/route");
		const req = new NextRequest("http://localhost/api/community/posts", {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				title: "제목",
				content: "내용이 충분히 깁니다",
				category: "question",
				facilityTags: [],
			}),
		});

		const res = await POST(req);
		expect(res.status).toBe(201);

		const json = await res.json();
		expect(json).toMatchObject({
			data: {
				id: "post-1",
				category: "question",
			},
		});

		expect(postServiceCreateMock).toHaveBeenCalledWith({
			userId: "user-1",
			title: "제목",
			content: "내용이 충분히 깁니다",
			category: "question",
			facilityTags: [],
			authorName: "홍길동",
			authorImage: "https://example.com/avatar.png",
		});
	});
});

