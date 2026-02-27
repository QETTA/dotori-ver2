import { describe, it, expect } from "vitest";
import { reviewCreateSchema, reviewUpdateSchema } from "@/lib/validations";

describe("review service", () => {
	describe("reviewCreateSchema", () => {
		const validReview = {
			rating: 4,
			content: "좋은 어린이집입니다",
		};

		it("accepts valid review data", () => {
			expect(reviewCreateSchema.safeParse(validReview).success).toBe(true);
		});

		it("enforces rating range 1-5", () => {
			expect(reviewCreateSchema.safeParse({ ...validReview, rating: 0 }).success).toBe(false);
			expect(reviewCreateSchema.safeParse({ ...validReview, rating: 1 }).success).toBe(true);
			expect(reviewCreateSchema.safeParse({ ...validReview, rating: 5 }).success).toBe(true);
			expect(reviewCreateSchema.safeParse({ ...validReview, rating: 6 }).success).toBe(false);
		});

		it("enforces integer rating", () => {
			expect(reviewCreateSchema.safeParse({ ...validReview, rating: 3.5 }).success).toBe(false);
			expect(reviewCreateSchema.safeParse({ ...validReview, rating: 3 }).success).toBe(true);
		});

		it("enforces content length", () => {
			expect(reviewCreateSchema.safeParse({ ...validReview, content: "" }).success).toBe(false);
			expect(reviewCreateSchema.safeParse({ ...validReview, content: "가".repeat(2001) }).success).toBe(false);
			expect(reviewCreateSchema.safeParse({ ...validReview, content: "가".repeat(2000) }).success).toBe(true);
		});

		it("validates image URLs", () => {
			expect(reviewCreateSchema.safeParse({
				...validReview,
				images: ["https://example.com/img.jpg"],
			}).success).toBe(true);

			expect(reviewCreateSchema.safeParse({
				...validReview,
				images: ["not-a-url"],
			}).success).toBe(false);
		});

		it("limits images to 5", () => {
			const tooMany = Array.from({ length: 6 }, (_, i) => `https://example.com/${i}.jpg`);
			expect(reviewCreateSchema.safeParse({ ...validReview, images: tooMany }).success).toBe(false);

			const ok = Array.from({ length: 5 }, (_, i) => `https://example.com/${i}.jpg`);
			expect(reviewCreateSchema.safeParse({ ...validReview, images: ok }).success).toBe(true);
		});
	});

	describe("reviewUpdateSchema", () => {
		it("allows partial updates", () => {
			expect(reviewUpdateSchema.safeParse({ rating: 5 }).success).toBe(true);
			expect(reviewUpdateSchema.safeParse({ content: "수정" }).success).toBe(true);
			expect(reviewUpdateSchema.safeParse({}).success).toBe(true);
		});

		it("still validates field constraints", () => {
			expect(reviewUpdateSchema.safeParse({ rating: 0 }).success).toBe(false);
			expect(reviewUpdateSchema.safeParse({ rating: 6 }).success).toBe(false);
			expect(reviewUpdateSchema.safeParse({ content: "" }).success).toBe(false);
		});
	});
});
