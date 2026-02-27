import { describe, it, expect } from "vitest";
import { waitlistCreateSchema, waitlistUpdateSchema } from "@/lib/validations";

describe("/api/waitlist", () => {
	describe("waitlistCreateSchema", () => {
		it("accepts valid waitlist creation", () => {
			const result = waitlistCreateSchema.safeParse({
				facilityId: "507f1f77bcf86cd799439011",
				childName: "김도토리",
				childBirthDate: "2023-05-15",
			});
			expect(result.success).toBe(true);
		});

		it("rejects missing facilityId", () => {
			const result = waitlistCreateSchema.safeParse({
				childName: "김도토리",
				childBirthDate: "2023-05-15",
			});
			expect(result.success).toBe(false);
		});

		it("rejects invalid facilityId", () => {
			const result = waitlistCreateSchema.safeParse({
				facilityId: "not-valid",
				childName: "김도토리",
				childBirthDate: "2023-05-15",
			});
			expect(result.success).toBe(false);
		});

		it("rejects missing child name", () => {
			const result = waitlistCreateSchema.safeParse({
				facilityId: "507f1f77bcf86cd799439011",
				childBirthDate: "2023-05-15",
			});
			expect(result.success).toBe(false);
		});

		it("rejects invalid date format", () => {
			const result = waitlistCreateSchema.safeParse({
				facilityId: "507f1f77bcf86cd799439011",
				childName: "김도토리",
				childBirthDate: "2023/05/15",
			});
			expect(result.success).toBe(false);
		});

		it("accepts long child name up to 50 chars", () => {
			const result = waitlistCreateSchema.safeParse({
				facilityId: "507f1f77bcf86cd799439011",
				childName: "가".repeat(50),
				childBirthDate: "2023-05-15",
			});
			expect(result.success).toBe(true);
		});

		it("rejects child name over 50 chars", () => {
			const result = waitlistCreateSchema.safeParse({
				facilityId: "507f1f77bcf86cd799439011",
				childName: "가".repeat(51),
				childBirthDate: "2023-05-15",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("waitlistUpdateSchema", () => {
		it("accepts valid status update", () => {
			const result = waitlistUpdateSchema.safeParse({
				status: "confirmed",
			});
			expect(result.success).toBe(true);
		});

		it("accepts cancelled status", () => {
			const result = waitlistUpdateSchema.safeParse({
				status: "cancelled",
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid status", () => {
			const result = waitlistUpdateSchema.safeParse({
				status: "invalid",
			});
			expect(result.success).toBe(false);
		});
	});
});
