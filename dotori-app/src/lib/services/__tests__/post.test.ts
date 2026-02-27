import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: vi.fn() }));
vi.mock("@/lib/logger", () => ({
	log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { communityPostCreateSchema, commentCreateSchema } from "@/lib/validations";
import { toPostDTO } from "@/lib/dto";

describe("post.service", () => {
	describe("communityPostCreateSchema", () => {
		it("accepts valid post", () => {
			const result = communityPostCreateSchema.safeParse({
				content: "테스트 게시글입니다",
				category: "question",
			});
			expect(result.success).toBe(true);
		});

		it("accepts all 4 categories", () => {
			for (const category of ["question", "review", "info", "feedback"]) {
				const result = communityPostCreateSchema.safeParse({
					content: "테스트",
					category,
				});
				expect(result.success).toBe(true);
			}
		});

		it("rejects empty content", () => {
			const result = communityPostCreateSchema.safeParse({
				content: "",
				category: "question",
			});
			expect(result.success).toBe(false);
		});

		it("rejects content over 5000 chars", () => {
			const result = communityPostCreateSchema.safeParse({
				content: "가".repeat(5001),
				category: "question",
			});
			expect(result.success).toBe(false);
		});

		it("rejects invalid category", () => {
			const result = communityPostCreateSchema.safeParse({
				content: "테스트",
				category: "invalid",
			});
			expect(result.success).toBe(false);
		});

		it("accepts optional facilityTags", () => {
			const result = communityPostCreateSchema.safeParse({
				content: "테스트",
				category: "review",
				facilityTags: ["507f1f77bcf86cd799439011"],
			});
			expect(result.success).toBe(true);
		});

		it("rejects more than 5 facilityTags", () => {
			const result = communityPostCreateSchema.safeParse({
				content: "테스트",
				category: "review",
				facilityTags: Array(6).fill("tag"),
			});
			expect(result.success).toBe(false);
		});
	});

	describe("commentCreateSchema", () => {
		it("accepts valid comment", () => {
			const result = commentCreateSchema.safeParse({ content: "좋은 글이에요" });
			expect(result.success).toBe(true);
		});

		it("rejects empty comment", () => {
			const result = commentCreateSchema.safeParse({ content: "" });
			expect(result.success).toBe(false);
		});

		it("truncates content over 2000 chars", () => {
			const result = commentCreateSchema.safeParse({
				content: "가".repeat(3000),
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.content.length).toBe(2000);
			}
		});
	});

	describe("toPostDTO", () => {
		it("transforms post document to DTO", () => {
			const doc = {
				_id: "507f1f77bcf86cd799439011",
				author: { nickname: "도토리맘", verified: true },
				content: "테스트 게시글",
				category: "question",
				likes: 5,
				likedBy: ["user1", "user2"],
				commentCount: 3,
				createdAt: new Date("2026-01-15T10:00:00Z"),
			};
			const dto = toPostDTO(doc);

			expect(dto.id).toBe("507f1f77bcf86cd799439011");
			expect(dto.author.nickname).toBe("도토리맘");
			expect(dto.author.verified).toBe(true);
			expect(dto.content).toBe("테스트 게시글");
			expect(dto.likes).toBe(5);
			expect(dto.commentCount).toBe(3);
			expect(dto.createdAt).toBe("2026-01-15T10:00:00.000Z");
		});

		it("defaults author to anonymous when missing", () => {
			const doc = {
				_id: "507f1f77bcf86cd799439011",
				content: "테스트",
				category: "info",
				createdAt: "2026-01-15",
			};
			const dto = toPostDTO(doc);
			expect(dto.author.nickname).toBe("익명");
			expect(dto.author.verified).toBe(false);
		});

		it("defaults likes and commentCount to 0", () => {
			const doc = {
				_id: "507f1f77bcf86cd799439011",
				content: "테스트",
				category: "info",
				createdAt: "2026-01-15",
			};
			const dto = toPostDTO(doc);
			expect(dto.likes).toBe(0);
			expect(dto.commentCount).toBe(0);
		});
	});
});
