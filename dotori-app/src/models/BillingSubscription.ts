import mongoose, { type Document, type Model, Schema } from "mongoose";

const BILLING_PLAN_IDS = ["starter", "growth", "enterprise"] as const;
const BILLING_CYCLES = ["monthly", "yearly"] as const;
const BILLING_STATUSES = ["trialing", "active", "past_due", "cancelled", "expired"] as const;

export type BillingPlanId = (typeof BILLING_PLAN_IDS)[number];
export type BillingCycle = (typeof BILLING_CYCLES)[number];
export type BillingSubscriptionStatus = (typeof BILLING_STATUSES)[number];

/** Plan pricing in KRW (monthly base) */
export const BILLING_PLANS: Record<BillingPlanId, { name: string; monthlyPrice: number; yearlyPrice: number }> = {
	starter: { name: "Starter", monthlyPrice: 44_000, yearlyPrice: 528_000 },
	growth: { name: "Growth", monthlyPrice: 88_000, yearlyPrice: 1_056_000 },
	enterprise: { name: "Enterprise", monthlyPrice: 132_000, yearlyPrice: 1_584_000 },
};

export const TRIAL_DAYS = 14;

export interface IBillingSubscription extends Document {
	partnerId: mongoose.Types.ObjectId;
	planId: BillingPlanId;
	status: BillingSubscriptionStatus;
	billingCycle: BillingCycle;
	amount: number;
	trialEnd?: Date;
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	cancelledAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const BillingSubscriptionSchema = new Schema<IBillingSubscription>(
	{
		partnerId: { type: Schema.Types.ObjectId, ref: "Partner", required: true },
		planId: { type: String, enum: BILLING_PLAN_IDS, required: true },
		status: { type: String, enum: BILLING_STATUSES, default: "trialing", required: true },
		billingCycle: { type: String, enum: BILLING_CYCLES, default: "monthly", required: true },
		amount: { type: Number, required: true, min: 0 },
		trialEnd: Date,
		currentPeriodStart: { type: Date, required: true },
		currentPeriodEnd: { type: Date, required: true },
		cancelledAt: Date,
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform(_doc, ret: Record<string, unknown>) {
				ret.id = String(ret._id);
				delete ret._id;
				delete ret.__v;
			},
		},
	},
);

BillingSubscriptionSchema.index({ partnerId: 1, status: 1 });
BillingSubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

const BillingSubscription: Model<IBillingSubscription> =
	mongoose.models.BillingSubscription ||
	mongoose.model<IBillingSubscription>("BillingSubscription", BillingSubscriptionSchema);
export default BillingSubscription;
