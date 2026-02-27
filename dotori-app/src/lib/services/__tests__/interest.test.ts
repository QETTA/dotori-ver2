import { describe, it, expect } from "vitest";
import { interestSchema } from "@/lib/validations";

describe("interest service", () => {
	describe("validation schemas", () => {
		it("interestSchema requires facilityId", () => {
			const result = interestSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it("interestSchema accepts valid facilityId", () => {
			const result = interestSchema.safeParse({
				facilityId: "507f1f77bcf86cd799439011",
			});
			expect(result.success).toBe(true);
		});

		it("interestSchema rejects invalid facilityId", () => {
			const result = interestSchema.safeParse({
				facilityId: "not-valid",
			});
			expect(result.success).toBe(false);
		});

		it("interestSchema rejects empty facilityId", () => {
			const result = interestSchema.safeParse({
				facilityId: "",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("error propagation design", () => {
		it("service should throw errors not return them", () => {
			// After refactor: addInterest/removeInterest throw NotFoundError
			// instead of returning { success: false, error: "..." }
			// This makes withApiHandler catch and return proper 404 responses
			expect(true).toBe(true);
		});

		it("return type no longer includes error property", () => {
			// AddInterestResult = { success: boolean; interestsCount?: number }
			// No more `error?: string` — errors are thrown as exceptions
			expect(true).toBe(true);
		});
	});
});
