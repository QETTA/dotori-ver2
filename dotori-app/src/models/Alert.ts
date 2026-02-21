import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IAlert extends Document {
	userId: mongoose.Types.ObjectId;
	facilityId: mongoose.Types.ObjectId;
	type: "vacancy" | "waitlist_change" | "review";
	condition: Record<string, unknown>;
	channels: ("push" | "kakao" | "email")[];
	active: boolean;
	lastTriggeredAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		facilityId: {
			type: Schema.Types.ObjectId,
			ref: "Facility",
			required: true,
		},
		type: {
			type: String,
			enum: ["vacancy", "waitlist_change", "review"],
			required: true,
		},
		condition: { type: Schema.Types.Mixed, default: {} },
		channels: {
			type: [{ type: String, enum: ["push", "kakao", "email"] }],
			default: ["push"],
		},
		active: { type: Boolean, default: true },
		lastTriggeredAt: Date,
	},
	{ timestamps: true },
);

AlertSchema.index({ userId: 1, facilityId: 1, type: 1 }, { unique: true });
AlertSchema.index({ active: 1, type: 1 });
AlertSchema.index({ facilityId: 1, active: 1 });
AlertSchema.index({ userId: 1, active: 1 });
AlertSchema.index({ userId: 1, active: 1, lastTriggeredAt: -1 });

const Alert: Model<IAlert> =
	mongoose.models.Alert || mongoose.model<IAlert>("Alert", AlertSchema);
export default Alert;
