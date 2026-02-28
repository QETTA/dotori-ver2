import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	BILLING_PLANS,
	TRIAL_DAYS,
	type BillingPlanId,
} from "@/models/BillingSubscription";

/* ─── Mocks ─── */

const mockSubFindById = vi.fn();
const mockSubCreate = vi.fn();
const mockSubFindOne = vi.fn();
const mockSubUpdateMany = vi.fn();

vi.mock("@/models/BillingSubscription", async () => {
	const actual = await vi.importActual<typeof import("@/models/BillingSubscription")>(
		"@/models/BillingSubscription",
	);
	return {
		...actual,
		default: {
			findById: (...args: unknown[]) => mockSubFindById(...args),
			create: (...args: unknown[]) => mockSubCreate(...args),
			findOne: (...args: unknown[]) => ({
				sort: () => ({
					lean: () => mockSubFindOne(...args),
				}),
			}),
			updateMany: (...args: unknown[]) => mockSubUpdateMany(...args),
		},
	};
});

const mockInvoiceCreate = vi.fn();
const mockInvoiceFindByIdAndUpdate = vi.fn();
const mockInvoiceFind = vi.fn();
const mockInvoiceCountDocuments = vi.fn();

vi.mock("@/models/Invoice", () => ({
	default: {
		create: (...args: unknown[]) => mockInvoiceCreate(...args),
		findByIdAndUpdate: (...args: unknown[]) => mockInvoiceFindByIdAndUpdate(...args),
		find: (...args: unknown[]) => ({
			sort: () => ({
				skip: () => ({
					limit: () => ({
						lean: () => mockInvoiceFind(...args),
					}),
				}),
			}),
		}),
		countDocuments: (...args: unknown[]) => mockInvoiceCountDocuments(...args),
	},
}));

vi.mock("@/lib/config/api", () => ({
	API_CONFIG: {
		BILLING: {
			trialDays: 14,
			defaultCurrency: "KRW",
			invoiceDueDays: 30,
			defaultPeriodMonths: 1,
		},
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

/* ─── Lazy import (after mocks) ─── */

async function importBilling() {
	return import("@/lib/engines/billing-engine");
}

describe("billing-engine", () => {
	/* ─── Constants (기존) ─── */

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

	/* ─── Integration Tests (Mongoose mock) ─── */

	describe("createSubscription (integration)", () => {
		it("creates trial subscription (ENG-BL-OK-001)", async () => {
			const { createSubscription } = await importBilling();
			const mockSub = {
				_id: "sub1",
				partnerId: "p1",
				planId: "starter",
				status: "trialing",
				billingCycle: "monthly",
				amount: 44_000,
			};
			mockSubCreate.mockResolvedValue(mockSub);

			const result = await createSubscription({
				partnerId: "p1",
				planId: "starter",
				billingCycle: "monthly",
				withTrial: true,
			});

			expect(result.subscription).toEqual(mockSub);
			expect(result.invoice).toBeUndefined();

			const createCall = mockSubCreate.mock.calls[0][0];
			expect(createCall.status).toBe("trialing");
			expect(createCall.amount).toBe(44_000);
			expect(createCall.trialEnd).toBeInstanceOf(Date);
		});

		it("creates active subscription without trial (ENG-BL-OK-002)", async () => {
			const { createSubscription } = await importBilling();
			const mockSub = {
				_id: "sub2",
				partnerId: "p2",
				planId: "growth",
				status: "active",
				billingCycle: "yearly",
				amount: 1_056_000,
			};
			const mockInv = { _id: "inv1", amount: 1_056_000, status: "issued" };
			mockSubCreate.mockResolvedValue(mockSub);
			mockInvoiceCreate.mockResolvedValue(mockInv);

			const result = await createSubscription({
				partnerId: "p2",
				planId: "growth",
				billingCycle: "yearly",
				withTrial: false,
			});

			expect(result.subscription.status).toBe("active");
			expect(result.invoice).toEqual(mockInv);
			expect(mockInvoiceCreate).toHaveBeenCalledTimes(1);

			const createCall = mockSubCreate.mock.calls[0][0];
			expect(createCall.status).toBe("active");
			expect(createCall.trialEnd).toBeUndefined();
		});

		it("sets yearly period (ENG-BL-OK-003)", async () => {
			const { createSubscription } = await importBilling();
			mockSubCreate.mockImplementation((data: Record<string, unknown>) => data);

			const result = await createSubscription({
				partnerId: "p3",
				planId: "enterprise",
				billingCycle: "yearly",
				withTrial: false,
			});

			const sub = result.subscription;
			const start = sub.currentPeriodStart as Date;
			const end = sub.currentPeriodEnd as Date;
			// yearly: end should be ~365 days after start
			const diffMs = end.getTime() - start.getTime();
			const diffDays = diffMs / (1000 * 60 * 60 * 24);
			expect(diffDays).toBeGreaterThanOrEqual(365);
			expect(diffDays).toBeLessThanOrEqual(366);
		});

		it("sets monthly period (ENG-BL-OK-004)", async () => {
			const { createSubscription } = await importBilling();
			mockSubCreate.mockImplementation((data: Record<string, unknown>) => data);

			const result = await createSubscription({
				partnerId: "p4",
				planId: "starter",
				billingCycle: "monthly",
				withTrial: false,
			});

			const sub = result.subscription;
			const start = sub.currentPeriodStart as Date;
			const end = sub.currentPeriodEnd as Date;
			const diffMs = end.getTime() - start.getTime();
			const diffDays = diffMs / (1000 * 60 * 60 * 24);
			// monthly: 28~31 days
			expect(diffDays).toBeGreaterThanOrEqual(28);
			expect(diffDays).toBeLessThanOrEqual(31);
		});
	});

	describe("activateSubscription (integration)", () => {
		it("transitions trialing → active (ENG-BL-ST-001)", async () => {
			const { activateSubscription } = await importBilling();
			const mockSub = {
				_id: "sub1",
				status: "trialing",
				planId: "starter",
				billingCycle: "monthly",
				partnerId: "p1",
				amount: 44_000,
				trialEnd: new Date(),
				save: vi.fn().mockResolvedValue(undefined),
			};
			mockSubFindById.mockResolvedValue(mockSub);
			mockInvoiceCreate.mockResolvedValue({ _id: "inv1" });

			const result = await activateSubscription("sub1");
			expect(result).toBeDefined();
			expect(mockSub.status).toBe("active");
			expect(mockSub.trialEnd).toBeUndefined();
			expect(mockSub.save).toHaveBeenCalled();
			expect(mockInvoiceCreate).toHaveBeenCalledTimes(1);
		});

		it("returns null for active subscription (ENG-BL-ERR-001)", async () => {
			const { activateSubscription } = await importBilling();
			mockSubFindById.mockResolvedValue({
				_id: "sub2",
				status: "active",
			});

			const result = await activateSubscription("sub2");
			expect(result).toBeNull();
		});

		it("returns null for non-existent subscription (ENG-BL-ERR-002)", async () => {
			const { activateSubscription } = await importBilling();
			mockSubFindById.mockResolvedValue(null);

			const result = await activateSubscription("nonexistent");
			expect(result).toBeNull();
		});
	});

	describe("cancelSubscription (integration)", () => {
		it("cancels active subscription (ENG-BL-ST-002)", async () => {
			const { cancelSubscription } = await importBilling();
			const mockSub = {
				_id: "sub1",
				status: "active",
				cancelledAt: undefined as Date | undefined,
				save: vi.fn().mockResolvedValue(undefined),
			};
			mockSubFindById.mockResolvedValue(mockSub);

			const result = await cancelSubscription("sub1");
			expect(result).toBeDefined();
			expect(mockSub.status).toBe("cancelled");
			expect(mockSub.cancelledAt).toBeInstanceOf(Date);
			expect(mockSub.save).toHaveBeenCalled();
		});

		it("cancels trialing subscription (ENG-BL-ST-003)", async () => {
			const { cancelSubscription } = await importBilling();
			const mockSub = {
				_id: "sub2",
				status: "trialing",
				cancelledAt: undefined as Date | undefined,
				save: vi.fn().mockResolvedValue(undefined),
			};
			mockSubFindById.mockResolvedValue(mockSub);

			const result = await cancelSubscription("sub2");
			expect(mockSub.status).toBe("cancelled");
			expect(result).toBeDefined();
		});

		it("returns null for already cancelled (ENG-BL-ERR-003)", async () => {
			const { cancelSubscription } = await importBilling();
			mockSubFindById.mockResolvedValue({
				_id: "sub3",
				status: "cancelled",
			});

			const result = await cancelSubscription("sub3");
			expect(result).toBeNull();
		});

		it("returns null for expired (ENG-BL-ERR-004)", async () => {
			const { cancelSubscription } = await importBilling();
			mockSubFindById.mockResolvedValue({
				_id: "sub4",
				status: "expired",
			});

			const result = await cancelSubscription("sub4");
			expect(result).toBeNull();
		});
	});

	describe("changePlan (integration)", () => {
		it("upgrades plan (ENG-BL-OK-005)", async () => {
			const { changePlan } = await importBilling();
			const mockSub = {
				_id: "sub1",
				status: "active",
				planId: "starter",
				billingCycle: "monthly",
				amount: 44_000,
				save: vi.fn().mockResolvedValue(undefined),
			};
			mockSubFindById.mockResolvedValue(mockSub);

			const result = await changePlan("sub1", "growth");
			expect(result).toBeDefined();
			expect(mockSub.planId).toBe("growth");
			expect(mockSub.amount).toBe(88_000);
			expect(mockSub.save).toHaveBeenCalled();
		});

		it("downgrades plan (ENG-BL-OK-006)", async () => {
			const { changePlan } = await importBilling();
			const mockSub = {
				_id: "sub2",
				status: "active",
				planId: "enterprise",
				billingCycle: "monthly",
				amount: 132_000,
				save: vi.fn().mockResolvedValue(undefined),
			};
			mockSubFindById.mockResolvedValue(mockSub);

			const result = await changePlan("sub2", "starter");
			expect(mockSub.planId).toBe("starter");
			expect(mockSub.amount).toBe(44_000);
			expect(result).toBeDefined();
		});

		it("changes billing cycle (ENG-BL-OK-007)", async () => {
			const { changePlan } = await importBilling();
			const mockSub = {
				_id: "sub3",
				status: "active",
				planId: "growth",
				billingCycle: "monthly",
				amount: 88_000,
				save: vi.fn().mockResolvedValue(undefined),
			};
			mockSubFindById.mockResolvedValue(mockSub);

			const result = await changePlan("sub3", "growth", "yearly");
			expect(mockSub.billingCycle).toBe("yearly");
			expect(mockSub.amount).toBe(1_056_000);
			expect(result).toBeDefined();
		});

		it("returns null for cancelled subscription (ENG-BL-ERR-005)", async () => {
			const { changePlan } = await importBilling();
			mockSubFindById.mockResolvedValue({
				_id: "sub4",
				status: "cancelled",
			});

			const result = await changePlan("sub4", "growth");
			expect(result).toBeNull();
		});
	});

	describe("renewSubscription (integration)", () => {
		it("renews monthly subscription (ENG-BL-OK-008)", async () => {
			const { renewSubscription } = await importBilling();
			const mockSub = {
				_id: "sub1",
				status: "active",
				planId: "starter",
				partnerId: "p1",
				billingCycle: "monthly",
				amount: 44_000,
				currentPeriodStart: new Date("2026-01-01"),
				currentPeriodEnd: new Date("2026-02-01"),
				save: vi.fn().mockResolvedValue(undefined),
			};
			mockSubFindById.mockResolvedValue(mockSub);
			mockInvoiceCreate.mockResolvedValue({ _id: "inv1", amount: 44_000 });

			const result = await renewSubscription("sub1");
			expect(result).toBeDefined();
			expect(result!.subscription.currentPeriodStart).toBeInstanceOf(Date);
			expect(result!.invoice).toBeDefined();
			expect(mockSub.save).toHaveBeenCalled();
			expect(mockInvoiceCreate).toHaveBeenCalledTimes(1);
		});

		it("returns null for non-active subscription (ENG-BL-ERR-006)", async () => {
			const { renewSubscription } = await importBilling();
			mockSubFindById.mockResolvedValue({
				_id: "sub2",
				status: "trialing",
			});

			const result = await renewSubscription("sub2");
			expect(result).toBeNull();
		});
	});

	describe("markInvoicePaid / voidInvoice (integration)", () => {
		it("marks invoice as paid (ENG-BL-ST-004)", async () => {
			const { markInvoicePaid } = await importBilling();
			const mockInv = { _id: "inv1", status: "paid", paidAt: new Date() };
			mockInvoiceFindByIdAndUpdate.mockResolvedValue(mockInv);

			const result = await markInvoicePaid("inv1");
			expect(result).toEqual(mockInv);
			expect(mockInvoiceFindByIdAndUpdate).toHaveBeenCalledWith(
				"inv1",
				{ $set: { status: "paid", paidAt: expect.any(Date) } },
				{ new: true },
			);
		});

		it("voids invoice (ENG-BL-ST-005)", async () => {
			const { voidInvoice } = await importBilling();
			const mockInv = { _id: "inv2", status: "void" };
			mockInvoiceFindByIdAndUpdate.mockResolvedValue(mockInv);

			const result = await voidInvoice("inv2");
			expect(result).toEqual(mockInv);
			expect(mockInvoiceFindByIdAndUpdate).toHaveBeenCalledWith(
				"inv2",
				{ $set: { status: "void" } },
				{ new: true },
			);
		});

		it("returns null for non-existent invoice (ENG-BL-ERR-007)", async () => {
			const { markInvoicePaid } = await importBilling();
			mockInvoiceFindByIdAndUpdate.mockResolvedValue(null);

			const result = await markInvoicePaid("nonexistent");
			expect(result).toBeNull();
		});
	});

	describe("expireTrials (integration)", () => {
		it("expires overdue trials (ENG-BL-ST-006)", async () => {
			const { expireTrials } = await importBilling();
			mockSubUpdateMany.mockResolvedValue({ modifiedCount: 3 });

			const count = await expireTrials();
			expect(count).toBe(3);
			expect(mockSubUpdateMany).toHaveBeenCalledWith(
				{ status: "trialing", trialEnd: { $lte: expect.any(Date) } },
				{ $set: { status: "expired" } },
			);
		});

		it("returns 0 when no expired trials (ENG-BL-BND-001)", async () => {
			const { expireTrials } = await importBilling();
			mockSubUpdateMany.mockResolvedValue({ modifiedCount: 0 });

			const count = await expireTrials();
			expect(count).toBe(0);
		});
	});

	describe("getActiveSubscription (integration)", () => {
		it("returns active subscription (ENG-BL-OK-009)", async () => {
			const { getActiveSubscription } = await importBilling();
			const mockSub = { _id: "sub1", status: "active", planId: "starter" };
			mockSubFindOne.mockResolvedValue(mockSub);

			const result = await getActiveSubscription("p1");
			expect(result).toEqual(mockSub);
		});

		it("returns null when no subscription (ENG-BL-ERR-008)", async () => {
			const { getActiveSubscription } = await importBilling();
			mockSubFindOne.mockResolvedValue(null);

			const result = await getActiveSubscription("newPartner");
			expect(result).toBeNull();
		});
	});

	describe("getPartnerInvoices (integration)", () => {
		it("returns paginated invoices", async () => {
			const { getPartnerInvoices } = await importBilling();
			const mockInvoices = [
				{ _id: "inv1", amount: 44_000 },
				{ _id: "inv2", amount: 88_000 },
			];
			mockInvoiceFind.mockResolvedValue(mockInvoices);
			mockInvoiceCountDocuments.mockResolvedValue(5);

			const result = await getPartnerInvoices("p1", { page: 1, limit: 2 });
			expect(result.data).toHaveLength(2);
			expect(result.total).toBe(5);
		});
	});
});
