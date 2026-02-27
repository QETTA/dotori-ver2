import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: vi.fn() }));
vi.mock("@/lib/logger", () => ({
	log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { AUDIT_ACTIONS, type AuditAction } from "@/models/AuditLog";

describe("audit.service", () => {
	describe("AUDIT_ACTIONS", () => {
		it("includes all esignature actions", () => {
			const esigActions = AUDIT_ACTIONS.filter((a) => a.startsWith("esign."));
			expect(esigActions).toContain("esign.create");
			expect(esigActions).toContain("esign.status_change");
			expect(esigActions).toContain("esign.sign");
			expect(esigActions).toContain("esign.submit");
			expect(esigActions).toContain("esign.delete");
			expect(esigActions).toContain("esign.expire");
			expect(esigActions).toContain("esign.view");
			expect(esigActions.length).toBe(7);
		});

		it("includes subscription actions", () => {
			const subActions = AUDIT_ACTIONS.filter((a) => a.startsWith("subscription."));
			expect(subActions).toContain("subscription.create");
			expect(subActions).toContain("subscription.cancel");
			expect(subActions).toContain("subscription.expire");
			expect(subActions.length).toBe(3);
		});

		it("includes alert actions", () => {
			const alertActions = AUDIT_ACTIONS.filter((a) => a.startsWith("alert."));
			expect(alertActions.length).toBe(3);
		});

		it("all actions are unique", () => {
			const unique = new Set(AUDIT_ACTIONS);
			expect(unique.size).toBe(AUDIT_ACTIONS.length);
		});

		it("all actions follow dot notation pattern", () => {
			for (const action of AUDIT_ACTIONS) {
				expect(action).toMatch(/^[a-z]+\.[a-z_]+$/);
			}
		});
	});

	describe("AuditAction type", () => {
		it("is a union of all action strings", () => {
			const testAction: AuditAction = "esign.create";
			expect(AUDIT_ACTIONS).toContain(testAction);
		});
	});
});
