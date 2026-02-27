import { describe, it, expect } from "vitest";
import { eSignatureCreateSchema, eSignatureStatusUpdateSchema } from "@/lib/validations";

describe("/api/esignature", () => {
	describe("schema validation", () => {
		it("accepts valid esignature create payload", () => {
			const result = eSignatureCreateSchema.safeParse({
				facilityId: "507f1f77bcf86cd799439011",
				documentType: "입소신청서",
				title: "입소 신청서 - 해피어린이집",
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid document type", () => {
			const result = eSignatureCreateSchema.safeParse({
				facilityId: "507f1f77bcf86cd799439011",
				documentType: "없는서류",
				title: "테스트",
			});
			expect(result.success).toBe(false);
		});

		it("rejects missing title", () => {
			const result = eSignatureCreateSchema.safeParse({
				facilityId: "507f1f77bcf86cd799439011",
				documentType: "입소신청서",
			});
			expect(result.success).toBe(false);
		});

		it("rejects empty title", () => {
			const result = eSignatureCreateSchema.safeParse({
				facilityId: "507f1f77bcf86cd799439011",
				documentType: "입소신청서",
				title: "",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("status update schema", () => {
		it("accepts valid status", () => {
			const result = eSignatureStatusUpdateSchema.safeParse({
				status: "signed",
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid status", () => {
			const result = eSignatureStatusUpdateSchema.safeParse({
				status: "unknown",
			});
			expect(result.success).toBe(false);
		});
	});
});
