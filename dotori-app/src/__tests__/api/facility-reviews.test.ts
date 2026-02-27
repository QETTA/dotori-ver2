import { describe, it, expect } from "vitest";
import { reviewCreateSchema, reviewUpdateSchema } from "@/lib/validations";

describe("/api/facilities/[id]/reviews", () => {
	describe("reviewCreateSchema", () => {
		it("accepts valid review", () => {
			const result = reviewCreateSchema.safeParse({
				rating: 4,
				content: "좋은 어린이집이에요!",
			});
			expect(result.success).toBe(true);
		});

		it("rejects rating below 1", () => {
			const result = reviewCreateSchema.safeParse({
				rating: 0,
				content: "좋은 어린이집이에요!",
			});
			expect(result.success).toBe(false);
		});

		it("rejects rating above 5", () => {
			const result = reviewCreateSchema.safeParse({
				rating: 6,
				content: "좋은 어린이집이에요!",
			});
			expect(result.success).toBe(false);
		});

		it("rejects non-integer rating", () => {
			const result = reviewCreateSchema.safeParse({
				rating: 3.5,
				content: "좋은 어린이집이에요!",
			});
			expect(result.success).toBe(false);
		});

		it("rejects empty content", () => {
			const result = reviewCreateSchema.safeParse({
				rating: 4,
				content: "",
			});
			expect(result.success).toBe(false);
		});

		it("rejects content over 2000 chars", () => {
			const result = reviewCreateSchema.safeParse({
				rating: 4,
				content: "가".repeat(2001),
			});
			expect(result.success).toBe(false);
		});

		it("accepts optional images", () => {
			const result = reviewCreateSchema.safeParse({
				rating: 5,
				content: "최고!",
				images: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
			});
			expect(result.success).toBe(true);
		});

		it("rejects more than 5 images", () => {
			const result = reviewCreateSchema.safeParse({
				rating: 5,
				content: "최고!",
				images: Array.from({ length: 6 }, (_, i) => `https://example.com/img${i}.jpg`),
			});
			expect(result.success).toBe(false);
		});

		it("rejects missing rating", () => {
			const result = reviewCreateSchema.safeParse({
				content: "리뷰 내용",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("reviewUpdateSchema", () => {
		it("accepts partial update with rating only", () => {
			const result = reviewUpdateSchema.safeParse({ rating: 3 });
			expect(result.success).toBe(true);
		});

		it("accepts partial update with content only", () => {
			const result = reviewUpdateSchema.safeParse({ content: "수정된 리뷰" });
			expect(result.success).toBe(true);
		});

		it("accepts full update", () => {
			const result = reviewUpdateSchema.safeParse({
				rating: 5,
				content: "수정된 리뷰",
				images: ["https://example.com/new.jpg"],
			});
			expect(result.success).toBe(true);
		});

		it("accepts empty object (no changes)", () => {
			const result = reviewUpdateSchema.safeParse({});
			expect(result.success).toBe(true);
		});
	});
});
