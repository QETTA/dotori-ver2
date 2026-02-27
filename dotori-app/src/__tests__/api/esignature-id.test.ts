import { describe, it, expect } from "vitest";
import { eSignatureStatusUpdateSchema, eSignatureTransitionSchema } from "@/lib/validations";

describe("/api/esignature/[id]", () => {
	// State transition rules tested as pure logic
	const VALID_TRANSITIONS: Record<string, string[]> = {
		draft: ["pending", "expired"],
		pending: ["signed", "expired"],
		signed: ["submitted", "expired"],
		submitted: ["expired"],
		expired: [],
	};

	function isValidTransition(from: string, to: string): boolean {
		return VALID_TRANSITIONS[from]?.includes(to) ?? false;
	}

	describe("state transitions", () => {
		it("allows draft → pending", () => {
			expect(isValidTransition("draft", "pending")).toBe(true);
		});

		it("allows pending → signed", () => {
			expect(isValidTransition("pending", "signed")).toBe(true);
		});

		it("allows signed → submitted", () => {
			expect(isValidTransition("signed", "submitted")).toBe(true);
		});

		it("does not allow draft → signed directly", () => {
			expect(isValidTransition("draft", "signed")).toBe(false);
		});

		it("does not allow expired → anything", () => {
			expect(isValidTransition("expired", "draft")).toBe(false);
			expect(isValidTransition("expired", "pending")).toBe(false);
			expect(isValidTransition("expired", "signed")).toBe(false);
		});

		it("allows any active state → expired", () => {
			expect(isValidTransition("draft", "expired")).toBe(true);
			expect(isValidTransition("pending", "expired")).toBe(true);
			expect(isValidTransition("signed", "expired")).toBe(true);
		});
	});

	describe("status update schema", () => {
		it("accepts valid status", () => {
			expect(eSignatureStatusUpdateSchema.safeParse({ status: "signed" }).success).toBe(true);
			expect(eSignatureStatusUpdateSchema.safeParse({ status: "pending" }).success).toBe(true);
		});

		it("rejects invalid status", () => {
			expect(eSignatureStatusUpdateSchema.safeParse({ status: "unknown" }).success).toBe(false);
		});
	});

	describe("transition schema", () => {
		it("validates from/to pair", () => {
			const result = eSignatureTransitionSchema.safeParse({
				from: "draft",
				to: "pending",
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid from", () => {
			const result = eSignatureTransitionSchema.safeParse({
				from: "invalid",
				to: "pending",
			});
			expect(result.success).toBe(false);
		});
	});
});
