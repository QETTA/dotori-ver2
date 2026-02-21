import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IActionIntent extends Document {
	userId: mongoose.Types.ObjectId;
	actionType:
		| "register_interest"
		| "apply_waiting"
		| "set_alert"
		| "generate_report"
		| "generate_checklist";
	params: {
		facilityId: string;
		childName?: string;
		childBirthDate?: string;
	};
	preview: Record<string, string>;
	status: "pending" | "confirmed" | "expired";
	expiresAt: Date;
	createdAt: Date;
}

const ActionIntentSchema = new Schema<IActionIntent>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		actionType: {
			type: String,
			enum: [
				"register_interest",
				"apply_waiting",
				"set_alert",
				"generate_report",
				"generate_checklist",
			],
			required: true,
		},
		params: {
			facilityId: { type: String, required: true },
			childName: String,
			childBirthDate: String,
		},
		preview: { type: Schema.Types.Mixed, default: {} },
		status: {
			type: String,
			enum: ["pending", "confirmed", "expired"],
			default: "pending",
		},
		expiresAt: {
			type: Date,
			default: () => new Date(Date.now() + 10 * 60 * 1000),
		},
	},
	{ timestamps: true },
);

ActionIntentSchema.index({ userId: 1, status: 1 });
ActionIntentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ActionIntent: Model<IActionIntent> =
	mongoose.models.ActionIntent ||
	mongoose.model<IActionIntent>("ActionIntent", ActionIntentSchema);
export default ActionIntent;
