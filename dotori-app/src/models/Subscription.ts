import mongoose, { type Document, type Model, Schema } from "mongoose";

export type SubscriptionPlan = "free" | "premium" | "partner";
export type SubscriptionStatus = "active" | "cancelled" | "expired";

export interface ISubscription extends Document {
	userId: mongoose.Types.ObjectId;
	plan: SubscriptionPlan;
	status: SubscriptionStatus;
	startedAt: Date;
	expiresAt: Date;
	paymentMethod?: string;
	amount: number;
	createdAt: Date;
	updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		plan: {
			type: String,
			enum: ["free", "premium", "partner"],
			required: true,
		},
		status: {
			type: String,
			enum: ["active", "cancelled", "expired"],
			default: "active",
			required: true,
		},
		startedAt: { type: Date, required: true },
		expiresAt: { type: Date, required: true },
		paymentMethod: String,
		amount: { type: Number, required: true, default: 0, min: 0 },
	},
	{ timestamps: true },
);

SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ userId: 1, startedAt: -1 });

const Subscription: Model<ISubscription> =
	mongoose.models.Subscription || mongoose.model<ISubscription>(
		"Subscription",
		SubscriptionSchema,
	);
export default Subscription;
