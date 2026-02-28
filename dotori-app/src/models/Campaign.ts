import mongoose, { type Document, type Model, Schema } from "mongoose";

const TRIGGER_TYPES = [
	"graduation",
	"relocation",
	"vacancy",
	"evaluation_change",
	"policy_change",
	"seasonal_admission",
	"sibling_priority",
] as const;

const CAMPAIGN_STATUSES = ["draft", "active", "paused", "completed", "archived"] as const;

export type CampaignTriggerType = (typeof TRIGGER_TYPES)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export interface ICampaign extends Document {
	name: string;
	triggerId: CampaignTriggerType;
	audience: {
		regions?: string[];
		childAgeRange?: { min: number; max: number };
		facilityTypes?: string[];
	};
	schedule: {
		startDate: Date;
		endDate?: Date;
		cronExpression?: string;
	};
	status: CampaignStatus;
	messageTemplate: string;
	kpi: {
		reach: number;
		clicks: number;
		conversions: number;
	};
	createdAt: Date;
	updatedAt: Date;
}

const AudienceSchema = new Schema(
	{
		regions: { type: [String], default: [] },
		childAgeRange: {
			type: {
				min: { type: Number, min: 0 },
				max: { type: Number, min: 0 },
			},
			default: undefined,
		},
		facilityTypes: { type: [String], default: [] },
	},
	{ _id: false },
);

const ScheduleSchema = new Schema(
	{
		startDate: { type: Date, required: true },
		endDate: Date,
		cronExpression: String,
	},
	{ _id: false },
);

const KPISchema = new Schema(
	{
		reach: { type: Number, default: 0, min: 0 },
		clicks: { type: Number, default: 0, min: 0 },
		conversions: { type: Number, default: 0, min: 0 },
	},
	{ _id: false },
);

const CampaignSchema = new Schema<ICampaign>(
	{
		name: { type: String, required: true, trim: true },
		triggerId: { type: String, enum: TRIGGER_TYPES, required: true },
		audience: { type: AudienceSchema, default: () => ({}) },
		schedule: { type: ScheduleSchema, required: true },
		status: { type: String, enum: CAMPAIGN_STATUSES, default: "draft", required: true },
		messageTemplate: { type: String, required: true },
		kpi: { type: KPISchema, default: () => ({ reach: 0, clicks: 0, conversions: 0 }) },
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

CampaignSchema.index({ triggerId: 1, status: 1 });
CampaignSchema.index({ status: 1, "schedule.startDate": 1 });

const Campaign: Model<ICampaign> =
	mongoose.models.Campaign || mongoose.model<ICampaign>("Campaign", CampaignSchema);
export default Campaign;
