import { describe, it, expect } from "vitest";
import {
	eSignatureCreateSchema,
	eSignatureStatusUpdateSchema,
} from "@/lib/validations";

const validId = "507f1f77bcf86cd799439011";

describe("E-Signature API schemas", () => {
	describe("eSignatureCreateSchema", () => {
		it("accepts valid create input", () => {
			const result = eSignatureCreateSchema.safeParse({
				facilityId: validId,
				documentType: "입소신청서",
				title: "2026년 입소신청서",
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid documentType", () => {
			const result = eSignatureCreateSchema.safeParse({
				facilityId: validId,
				documentType: "없는서류",
				title: "테스트",
			});
			expect(result.success).toBe(false);
		});

		it("rejects missing title", () => {
			const result = eSignatureCreateSchema.safeParse({
				facilityId: validId,
				documentType: "입소신청서",
			});
			expect(result.success).toBe(false);
		});

		it("rejects empty title", () => {
			const result = eSignatureCreateSchema.safeParse({
				facilityId: validId,
				documentType: "입소신청서",
				title: "",
			});
			expect(result.success).toBe(false);
		});

		it("rejects title over 200 chars", () => {
			const result = eSignatureCreateSchema.safeParse({
				facilityId: validId,
				documentType: "입소신청서",
				title: "가".repeat(201),
			});
			expect(result.success).toBe(false);
		});

		it("rejects invalid facilityId", () => {
			const result = eSignatureCreateSchema.safeParse({
				facilityId: "invalid",
				documentType: "입소신청서",
				title: "테스트",
			});
			expect(result.success).toBe(false);
		});

		it("accepts all 7 document types", () => {
			const types = [
				"입소신청서",
				"건강검진확인서",
				"예방접종증명서",
				"영유아건강검진결과통보서",
				"주민등록등본",
				"재직증명서",
				"소득증빙서류",
			];
			for (const documentType of types) {
				const result = eSignatureCreateSchema.safeParse({
					facilityId: validId,
					documentType,
					title: "테스트",
				});
				expect(result.success).toBe(true);
			}
		});
	});

	describe("eSignatureStatusUpdateSchema", () => {
		it("accepts valid status", () => {
			for (const status of ["draft", "pending", "signed", "submitted", "expired"]) {
				const result = eSignatureStatusUpdateSchema.safeParse({ status });
				expect(result.success).toBe(true);
			}
		});

		it("rejects invalid status", () => {
			const result = eSignatureStatusUpdateSchema.safeParse({
				status: "unknown",
			});
			expect(result.success).toBe(false);
		});
	});
});
