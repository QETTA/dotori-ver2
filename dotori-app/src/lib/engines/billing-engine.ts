/**
 * Billing/Subscription Engine
 *
 * B2B SaaS subscription lifecycle + invoice generation.
 * Toss Payments integration is stubbed — logic only.
 */
import BillingSubscription, {
	BILLING_PLANS,
	TRIAL_DAYS,
	type IBillingSubscription,
	type BillingPlanId,
	type BillingCycle,
} from "@/models/BillingSubscription";
import Invoice, { type IInvoice } from "@/models/Invoice";
import { API_CONFIG } from "@/lib/config/api";

/* ─── Subscription Lifecycle ─── */

export async function createSubscription(params: {
	partnerId: string;
	planId: BillingPlanId;
	billingCycle: BillingCycle;
	withTrial?: boolean;
}): Promise<{ subscription: IBillingSubscription; invoice?: IInvoice }> {
	const { partnerId, planId, billingCycle, withTrial = true } = params;
	const plan = BILLING_PLANS[planId];
	const amount = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

	const now = new Date();
	const periodEnd = new Date(now);
	if (billingCycle === "yearly") {
		periodEnd.setFullYear(periodEnd.getFullYear() + 1);
	} else {
		periodEnd.setMonth(periodEnd.getMonth() + 1);
	}

	const trialEnd = withTrial
		? new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
		: undefined;

	const subscription = await BillingSubscription.create({
		partnerId,
		planId,
		status: withTrial ? "trialing" : "active",
		billingCycle,
		amount,
		trialEnd,
		currentPeriodStart: now,
		currentPeriodEnd: periodEnd,
	});

	// Create initial invoice (draft during trial, issued if no trial)
	let invoice: IInvoice | undefined;
	if (!withTrial) {
		invoice = await createInvoiceForSubscription(subscription);
	}

	return { subscription, invoice };
}

export async function activateSubscription(
	subscriptionId: string,
): Promise<IBillingSubscription | null> {
	const sub = await BillingSubscription.findById(subscriptionId);
	if (!sub || sub.status !== "trialing") return null;

	sub.status = "active";
	sub.trialEnd = undefined;
	await sub.save();

	// Issue the first invoice
	await createInvoiceForSubscription(sub);

	return sub;
}

export async function cancelSubscription(
	subscriptionId: string,
): Promise<IBillingSubscription | null> {
	const sub = await BillingSubscription.findById(subscriptionId);
	if (!sub || sub.status === "cancelled" || sub.status === "expired") return null;

	sub.status = "cancelled";
	sub.cancelledAt = new Date();
	await sub.save();

	return sub;
}

export async function changePlan(
	subscriptionId: string,
	newPlanId: BillingPlanId,
	newCycle?: BillingCycle,
): Promise<IBillingSubscription | null> {
	const sub = await BillingSubscription.findById(subscriptionId);
	if (!sub || sub.status === "cancelled" || sub.status === "expired") return null;

	const cycle = newCycle ?? sub.billingCycle;
	const plan = BILLING_PLANS[newPlanId];
	const newAmount = cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

	sub.planId = newPlanId;
	sub.billingCycle = cycle;
	sub.amount = newAmount;
	await sub.save();

	return sub;
}

export async function renewSubscription(
	subscriptionId: string,
): Promise<{ subscription: IBillingSubscription; invoice: IInvoice } | null> {
	const sub = await BillingSubscription.findById(subscriptionId);
	if (!sub || sub.status !== "active") return null;

	const now = new Date();
	const periodEnd = new Date(now);
	if (sub.billingCycle === "yearly") {
		periodEnd.setFullYear(periodEnd.getFullYear() + 1);
	} else {
		periodEnd.setMonth(periodEnd.getMonth() + 1);
	}

	sub.currentPeriodStart = now;
	sub.currentPeriodEnd = periodEnd;
	await sub.save();

	const invoice = await createInvoiceForSubscription(sub);
	return { subscription: sub, invoice };
}

/* ─── Invoice Management ─── */

async function createInvoiceForSubscription(
	subscription: IBillingSubscription,
): Promise<IInvoice> {
	const plan = BILLING_PLANS[subscription.planId];
	const dueDate = new Date();
	dueDate.setDate(dueDate.getDate() + API_CONFIG.BILLING.invoiceDueDays);

	return Invoice.create({
		subscriptionId: subscription._id,
		partnerId: subscription.partnerId,
		amount: subscription.amount,
		currency: API_CONFIG.BILLING.defaultCurrency,
		status: "issued",
		items: [
			{
				description: `${plan.name} Plan (${subscription.billingCycle})`,
				amount: subscription.amount,
				quantity: 1,
			},
		],
		issuedAt: new Date(),
		dueDate,
	});
}

export async function markInvoicePaid(
	invoiceId: string,
): Promise<IInvoice | null> {
	return Invoice.findByIdAndUpdate(
		invoiceId,
		{ $set: { status: "paid", paidAt: new Date() } },
		{ new: true },
	);
}

export async function voidInvoice(
	invoiceId: string,
): Promise<IInvoice | null> {
	return Invoice.findByIdAndUpdate(
		invoiceId,
		{ $set: { status: "void" } },
		{ new: true },
	);
}

export async function getPartnerInvoices(
	partnerId: string,
	options: { page?: number; limit?: number } = {},
): Promise<{ data: IInvoice[]; total: number }> {
	const page = options.page ?? 1;
	const limit = options.limit ?? 20;
	const skip = (page - 1) * limit;

	const [data, total] = await Promise.all([
		Invoice.find({ partnerId })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean<IInvoice[]>(),
		Invoice.countDocuments({ partnerId }),
	]);

	return { data, total };
}

/* ─── Trial Expiration Check ─── */

export async function expireTrials(): Promise<number> {
	const now = new Date();
	const result = await BillingSubscription.updateMany(
		{ status: "trialing", trialEnd: { $lte: now } },
		{ $set: { status: "expired" } },
	);
	return result.modifiedCount;
}

/* ─── Subscription Queries ─── */

export async function getActiveSubscription(
	partnerId: string,
): Promise<IBillingSubscription | null> {
	return BillingSubscription.findOne({
		partnerId,
		status: { $in: ["trialing", "active"] },
	})
		.sort({ createdAt: -1 })
		.lean<IBillingSubscription>();
}
