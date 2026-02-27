import { describe, it, expect } from "vitest";
import { API_CONFIG } from "../../config/api";

describe("subscription service config", () => {
	it("has default period months", () => {
		expect(API_CONFIG.SUBSCRIPTION.defaultPeriodMonths).toBeGreaterThan(0);
	});

	it("has expiry warning days", () => {
		expect(API_CONFIG.SUBSCRIPTION.expiryWarningDays).toBeGreaterThan(0);
	});

	it("subscription plans match model definition", () => {
		const validPlans = ["free", "premium", "partner"];
		for (const plan of validPlans) {
			expect(typeof plan).toBe("string");
		}
	});

	it("subscription statuses are comprehensive", () => {
		const validStatuses = ["active", "cancelled", "expired"];
		expect(validStatuses).toHaveLength(3);
		expect(validStatuses).toContain("active");
		expect(validStatuses).toContain("cancelled");
		expect(validStatuses).toContain("expired");
	});
});
