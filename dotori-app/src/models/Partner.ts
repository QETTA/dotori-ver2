import mongoose, { type Document, type Model, Schema } from "mongoose";

const PARTNER_TIERS = ["free", "basic", "pro", "enterprise"] as const;
export type PartnerTier = (typeof PARTNER_TIERS)[number];

/** Requests per day by tier */
export const TIER_RATE_LIMITS: Record<PartnerTier, number> = {
	free: 100,
	basic: 1_000,
	pro: 10_000,
	enterprise: 1_000_000, // effectively unlimited
};

export interface IPartner extends Document {
	name: string;
	contactEmail: string;
	contactPhone?: string;
	tier: PartnerTier;
	apiKeyHash: string;
	apiKeyPrefix: string;
	rateLimit: number;
	cpaConfig: {
		enabled: boolean;
		rate: number;
		events: string[];
	};
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const CPAConfigSchema = new Schema(
	{
		enabled: { type: Boolean, default: false },
		rate: { type: Number, default: 0, min: 0 },
		events: { type: [String], default: [] },
	},
	{ _id: false },
);

const PartnerSchema = new Schema<IPartner>(
	{
		name: { type: String, required: true, trim: true },
		contactEmail: { type: String, required: true, trim: true, lowercase: true },
		contactPhone: { type: String, trim: true },
		tier: { type: String, enum: PARTNER_TIERS, default: "free", required: true },
		apiKeyHash: { type: String, required: true },
		apiKeyPrefix: { type: String, required: true },
		rateLimit: { type: Number, required: true, default: TIER_RATE_LIMITS.free },
		cpaConfig: { type: CPAConfigSchema, default: () => ({ enabled: false, rate: 0, events: [] }) },
		isActive: { type: Boolean, default: true },
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform(_doc, ret: Record<string, unknown>) {
				ret.id = String(ret._id);
				delete ret._id;
				delete ret.__v;
				delete ret.apiKeyHash;
			},
		},
	},
);

PartnerSchema.index({ apiKeyHash: 1 }, { unique: true });
PartnerSchema.index({ contactEmail: 1 }, { unique: true });
PartnerSchema.index({ tier: 1, isActive: 1 });

const Partner: Model<IPartner> =
	mongoose.models.Partner || mongoose.model<IPartner>("Partner", PartnerSchema);
export default Partner;
