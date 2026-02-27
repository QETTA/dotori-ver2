import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: vi.fn() }));
vi.mock("@/lib/logger", () => ({
	log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { waitlistCreateSchema, waitlistUpdateSchema } from "@/lib/validations";

const validId = "507f1f77bcf86cd799439011";

describe("waitlist.service schemas", () => {
	describe("waitlistCreateSchema", () => {
		it("accepts valid waitlist entry", () => {
			const result = waitlistCreateSchema.safeParse({
				facilityId: validId,
				childName: "김도토리",
				childBirthDate: "2023-05-15",
			});
			expect(result.success).toBe(true);
		});

		it("rejects missing childName", () => {
			const result = waitlistCreateSchema.safeParse({
				facilityId: validId,
				childBirthDate: "2023-05-15",
			});
			expect(result.success).toBe(false);
		});

		it("rejects empty childName", () => {
			const result = waitlistCreateSchema.safeParse({
				facilityId: validId,
				childName: "",
				childBirthDate: "2023-05-15",
			});
			expect(result.success).toBe(false);
		});

		it("rejects invalid date format", () => {
			const result = waitlistCreateSchema.safeParse({
				facilityId: validId,
				childName: "김도토리",
				childBirthDate: "2023/05/15",
			});
			expect(result.success).toBe(false);
		});

		it("rejects childName over 50 chars", () => {
			const result = waitlistCreateSchema.safeParse({
				facilityId: validId,
				childName: "가".repeat(51),
				childBirthDate: "2023-05-15",
			});
			expect(result.success).toBe(false);
		});

		it("rejects invalid facilityId", () => {
			const result = waitlistCreateSchema.safeParse({
				facilityId: "bad",
				childName: "김도토리",
				childBirthDate: "2023-05-15",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("waitlistUpdateSchema", () => {
		it("accepts status change to cancelled", () => {
			const result = waitlistUpdateSchema.safeParse({ status: "cancelled" });
			expect(result.success).toBe(true);
		});

		it("accepts checklist update", () => {
			const result = waitlistUpdateSchema.safeParse({
				checklist: [{ docName: "주민등록등본", checked: true }],
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid status", () => {
			const result = waitlistUpdateSchema.safeParse({ status: "approved" });
			expect(result.success).toBe(false);
		});
	});
});
