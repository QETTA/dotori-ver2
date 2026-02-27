import { describe, it, expect } from "vitest";
import { visitCreateSchema, visitUpdateSchema } from "@/lib/validations";

// Pure state transition rules (matching visit.service.ts)
const VALID_TRANSITIONS: Record<string, string[]> = {
	requested: ["confirmed", "cancelled"],
	confirmed: ["completed", "cancelled"],
	completed: [],
	cancelled: [],
};

function isValidTransition(from: string, to: string): boolean {
	return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

describe("/api/visits", () => {
	describe("visitCreateSchema", () => {
		it("accepts valid visit creation", () => {
			const result = visitCreateSchema.safeParse({
				facilityId: "507f1f77bcf86cd799439011",
				scheduledAt: "2026-03-15T10:00:00Z",
			});
			expect(result.success).toBe(true);
		});

		it("rejects missing facilityId", () => {
			const result = visitCreateSchema.safeParse({
				scheduledAt: "2026-03-15T10:00:00Z",
			});
			expect(result.success).toBe(false);
		});

		it("rejects invalid facilityId", () => {
			const result = visitCreateSchema.safeParse({
				facilityId: "invalid",
				scheduledAt: "2026-03-15T10:00:00Z",
			});
			expect(result.success).toBe(false);
		});

		it("accepts optional notes", () => {
			const result = visitCreateSchema.safeParse({
				facilityId: "507f1f77bcf86cd799439011",
				scheduledAt: "2026-03-15T10:00:00Z",
				notes: "오전 10시 견학 희망",
			});
			expect(result.success).toBe(true);
		});

		it("rejects notes over 500 chars", () => {
			const result = visitCreateSchema.safeParse({
				facilityId: "507f1f77bcf86cd799439011",
				scheduledAt: "2026-03-15T10:00:00Z",
				notes: "가".repeat(501),
			});
			expect(result.success).toBe(false);
		});

		it("accepts optional childId", () => {
			const result = visitCreateSchema.safeParse({
				facilityId: "507f1f77bcf86cd799439011",
				scheduledAt: "2026-03-15T10:00:00Z",
				childId: "507f1f77bcf86cd799439022",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("visitUpdateSchema", () => {
		it("accepts confirmed status", () => {
			expect(visitUpdateSchema.safeParse({ status: "confirmed" }).success).toBe(true);
		});

		it("accepts completed status", () => {
			expect(visitUpdateSchema.safeParse({ status: "completed" }).success).toBe(true);
		});

		it("accepts cancelled status", () => {
			expect(visitUpdateSchema.safeParse({ status: "cancelled" }).success).toBe(true);
		});

		it("rejects requested status (cannot reset)", () => {
			expect(visitUpdateSchema.safeParse({ status: "requested" }).success).toBe(false);
		});

		it("rejects invalid status", () => {
			expect(visitUpdateSchema.safeParse({ status: "invalid" }).success).toBe(false);
		});
	});

	describe("state transitions", () => {
		it("requested → confirmed is valid", () => {
			expect(isValidTransition("requested", "confirmed")).toBe(true);
		});

		it("requested → cancelled is valid", () => {
			expect(isValidTransition("requested", "cancelled")).toBe(true);
		});

		it("confirmed → completed is valid", () => {
			expect(isValidTransition("confirmed", "completed")).toBe(true);
		});

		it("confirmed → cancelled is valid", () => {
			expect(isValidTransition("confirmed", "cancelled")).toBe(true);
		});

		it("completed → anything is invalid", () => {
			expect(isValidTransition("completed", "confirmed")).toBe(false);
			expect(isValidTransition("completed", "cancelled")).toBe(false);
			expect(isValidTransition("completed", "requested")).toBe(false);
		});

		it("cancelled → anything is invalid", () => {
			expect(isValidTransition("cancelled", "confirmed")).toBe(false);
			expect(isValidTransition("cancelled", "requested")).toBe(false);
		});

		it("requested → completed is invalid (must confirm first)", () => {
			expect(isValidTransition("requested", "completed")).toBe(false);
		});
	});
});
