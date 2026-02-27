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

describe("visit service", () => {
	describe("isValidTransition", () => {
		it("follows correct state machine", () => {
			expect(isValidTransition("requested", "confirmed")).toBe(true);
			expect(isValidTransition("requested", "cancelled")).toBe(true);
			expect(isValidTransition("confirmed", "completed")).toBe(true);
			expect(isValidTransition("confirmed", "cancelled")).toBe(true);
		});

		it("blocks invalid transitions", () => {
			expect(isValidTransition("completed", "requested")).toBe(false);
			expect(isValidTransition("cancelled", "requested")).toBe(false);
			expect(isValidTransition("requested", "completed")).toBe(false);
		});

		it("completed is terminal state", () => {
			expect(isValidTransition("completed", "confirmed")).toBe(false);
			expect(isValidTransition("completed", "cancelled")).toBe(false);
			expect(isValidTransition("completed", "requested")).toBe(false);
		});

		it("cancelled is terminal state", () => {
			expect(isValidTransition("cancelled", "confirmed")).toBe(false);
			expect(isValidTransition("cancelled", "completed")).toBe(false);
			expect(isValidTransition("cancelled", "requested")).toBe(false);
		});
	});

	describe("visitCreateSchema", () => {
		it("validates scheduledAt is required", () => {
			const result = visitCreateSchema.safeParse({
				facilityId: "507f1f77bcf86cd799439011",
			});
			expect(result.success).toBe(false);
		});

		it("validates facilityId format", () => {
			const result = visitCreateSchema.safeParse({
				facilityId: "invalid",
				scheduledAt: "2026-03-15T10:00:00Z",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("visitUpdateSchema", () => {
		it("requires status field", () => {
			const result = visitUpdateSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it("allows cancelReason with cancelled status", () => {
			const result = visitUpdateSchema.safeParse({
				status: "cancelled",
				cancelReason: "일정 변경",
			});
			expect(result.success).toBe(true);
		});
	});
});
