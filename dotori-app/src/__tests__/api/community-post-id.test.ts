import { describe, it, expect } from "vitest";
import { commentCreateSchema, communityPostCreateSchema } from "@/lib/validations";

describe("/api/community/posts/[id]", () => {
	describe("communityPostCreateSchema", () => {
		it("accepts valid post", () => {
			const result = communityPostCreateSchema.safeParse({
				content: "어린이집 추천해주세요",
				category: "question",
			});
			expect(result.success).toBe(true);
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

		it("accepts facilityTags", () => {
			const result = communityPostCreateSchema.safeParse({
				content: "테스트",
				category: "review",
				facilityTags: ["tag1", "tag2"],
			});
			expect(result.success).toBe(true);
		});

		it("rejects too many facilityTags", () => {
			const result = communityPostCreateSchema.safeParse({
				content: "테스트",
				category: "review",
				facilityTags: ["1", "2", "3", "4", "5", "6"],
			});
			expect(result.success).toBe(false);
		});
	});

	describe("commentCreateSchema", () => {
		it("accepts valid comment", () => {
			const result = commentCreateSchema.safeParse({
				content: "도움이 됐어요!",
			});
			expect(result.success).toBe(true);
		});

		it("rejects empty comment", () => {
			const result = commentCreateSchema.safeParse({
				content: "",
			});
			expect(result.success).toBe(false);
		});

		it("truncates long comments to 2000 chars", () => {
			const result = commentCreateSchema.safeParse({
				content: "가".repeat(3000),
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.content.length).toBeLessThanOrEqual(2000);
			}
		});
	});
});
