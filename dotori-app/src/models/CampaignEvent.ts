import mongoose, { type Document, type Model, Schema } from "mongoose";

const EVENT_ACTIONS = ["sent", "delivered", "clicked", "converted", "failed"] as const;
export type CampaignEventAction = (typeof EVENT_ACTIONS)[number];

export interface ICampaignEvent extends Document {
	campaignId: mongoose.Types.ObjectId;
	userId: mongoose.Types.ObjectId;
	action: CampaignEventAction;
	metadata?: Record<string, unknown>;
	timestamp: Date;
}

const CampaignEventSchema = new Schema<ICampaignEvent>(
	{
		campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		action: { type: String, enum: EVENT_ACTIONS, required: true },
		metadata: { type: Schema.Types.Mixed },
		timestamp: { type: Date, default: Date.now, required: true },
	},
	{ timestamps: false },
);

// Campaign performance aggregation
CampaignEventSchema.index({ campaignId: 1, action: 1, timestamp: -1 });
// User event history
CampaignEventSchema.index({ userId: 1, timestamp: -1 });
// TTL: 1 year retention
CampaignEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const CampaignEvent: Model<ICampaignEvent> =
	mongoose.models.CampaignEvent ||
	mongoose.model<ICampaignEvent>("CampaignEvent", CampaignEventSchema);
export default CampaignEvent;
