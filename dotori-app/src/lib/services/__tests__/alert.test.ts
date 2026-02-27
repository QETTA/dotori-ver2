import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: vi.fn() }));
vi.mock("@/lib/logger", () => ({
	log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { alertCreateSchema } from "@/lib/validations";

const validId = "507f1f77bcf86cd799439011";

describe("alert.service schemas", () => {
	describe("alertCreateSchema", () => {
		it("accepts valid vacancy alert", () => {
			const result = alertCreateSchema.safeParse({
				facilityId: validId,
				type: "vacancy",
			});
			expect(result.success).toBe(true);
		});

		it("accepts all 6 alert types", () => {
			const types = [
				"vacancy",
				"waitlist_change",
				"review",
				"transfer_vacancy",
				"class_assignment",
				"teacher_change",
			];
			for (const type of types) {
				const result = alertCreateSchema.safeParse({
					facilityId: validId,
					type,
				});
				expect(result.success).toBe(true);
			}
		});

		it("rejects invalid alert type", () => {
			const result = alertCreateSchema.safeParse({
				facilityId: validId,
				type: "invalid_type",
			});
			expect(result.success).toBe(false);
		});

		it("rejects invalid facilityId", () => {
			const result = alertCreateSchema.safeParse({
				facilityId: "not-valid",
				type: "vacancy",
			});
			expect(result.success).toBe(false);
		});

		it("accepts optional channels", () => {
			const result = alertCreateSchema.safeParse({
				facilityId: validId,
				type: "vacancy",
				channels: ["push", "kakao"],
			});
			expect(result.success).toBe(true);
		});

		it("validates channel values", () => {
			const result = alertCreateSchema.safeParse({
				facilityId: validId,
				type: "vacancy",
				channels: ["push", "sms"], // sms is not valid
			});
			expect(result.success).toBe(false);
		});

		it("requires at least 1 channel when provided", () => {
			const result = alertCreateSchema.safeParse({
				facilityId: validId,
				type: "vacancy",
				channels: [],
			});
			expect(result.success).toBe(false);
		});

		it("accepts optional condition object", () => {
			const result = alertCreateSchema.safeParse({
				facilityId: validId,
				type: "vacancy",
				condition: { minVacancy: 1, facilityTypes: ["국공립"] },
			});
			expect(result.success).toBe(true);
		});
	});
});
