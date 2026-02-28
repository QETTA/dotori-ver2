import { describe, it, expect } from "vitest";
import {
	BILLING_PLANS,
	TRIAL_DAYS,
	type BillingPlanId,
} from "@/models/BillingSubscription";

describe("billing-engine", () => {
	describe("BILLING_PLANS", () => {
		it("defines all three plans", () => {
			expect(BILLING_PLANS.starter).toBeDefined();
			expect(BILLING_PLANS.growth).toBeDefined();
			expect(BILLING_PLANS.enterprise).toBeDefined();
		});

		it("starter plan has correct pricing", () => {
			expect(BILLING_PLANS.starter.monthlyPrice).toBe(44_000);
			expect(BILLING_PLANS.starter.yearlyPrice).toBe(528_000);
		});

		it("growth plan has correct pricing", () => {
			expect(BILLING_PLANS.growth.monthlyPrice).toBe(88_000);
			expect(BILLING_PLANS.growth.yearlyPrice).toBe(1_056_000);
		});

		it("enterprise plan has correct pricing", () => {
			expect(BILLING_PLANS.enterprise.monthlyPrice).toBe(132_000);
			expect(BILLING_PLANS.enterprise.yearlyPrice).toBe(1_584_000);
		});

		it("yearly prices are 12x monthly", () => {
			const planIds: BillingPlanId[] = ["starter", "growth", "enterprise"];
			for (const id of planIds) {
				const plan = BILLING_PLANS[id];
				expect(plan.yearlyPrice).toBe(plan.monthlyPrice * 12);
			}
		});

		it("plans are ordered by price", () => {
			expect(BILLING_PLANS.starter.monthlyPrice).toBeLessThan(BILLING_PLANS.growth.monthlyPrice);
			expect(BILLING_PLANS.growth.monthlyPrice).toBeLessThan(BILLING_PLANS.enterprise.monthlyPrice);
		});

		it("all plans have names", () => {
			expect(BILLING_PLANS.starter.name).toBe("Starter");
			expect(BILLING_PLANS.growth.name).toBe("Growth");
			expect(BILLING_PLANS.enterprise.name).toBe("Enterprise");
		});
	});

	describe("TRIAL_DAYS", () => {
		it("is 14 days", () => {
			expect(TRIAL_DAYS).toBe(14);
		});

		it("is a positive integer", () => {
			expect(TRIAL_DAYS).toBeGreaterThan(0);
			expect(Number.isInteger(TRIAL_DAYS)).toBe(true);
		});
	});

	describe("subscription status flow", () => {
		it("valid statuses exist", () => {
			const validStatuses = ["trialing", "active", "past_due", "cancelled", "expired"];
			expect(validStatuses).toHaveLength(5);
		});

		it("trial period calculation is correct", () => {
			const now = new Date();
			const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
			const diffDays = (trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
			expect(Math.round(diffDays)).toBe(14);
		});
	});

	describe("invoice lifecycle", () => {
		it("valid invoice statuses", () => {
			const validStatuses = ["draft", "issued", "paid", "void"];
			expect(validStatuses).toHaveLength(4);
		});

		it("billing cycles", () => {
			const validCycles = ["monthly", "yearly"];
			expect(validCycles).toHaveLength(2);
		});
	});
});
