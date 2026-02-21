import mongoose, { type Document, type Model, Schema } from "mongoose";

export type UsageType = "chat" | "alert" | "export";

export interface IUsageLog extends Document {
	userId: mongoose.Types.ObjectId;
	type: UsageType;
	count: number;
	month: string;
	createdAt: Date;
	updatedAt: Date;
}

const UsageLogSchema = new Schema<IUsageLog>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		type: {
			type: String,
			enum: ["chat", "alert", "export"],
			required: true,
		},
		count: { type: Number, required: true, default: 0, min: 0 },
		month: {
			type: String,
			required: true,
			match: /^\d{4}-(0[1-9]|1[0-2])$/,
			trim: true,
		},
	},
	{ timestamps: true },
);

UsageLogSchema.index({ userId: 1, type: 1, month: 1 }, { unique: true });
UsageLogSchema.index({ month: 1, type: 1 });

const UsageLog: Model<IUsageLog> =
	mongoose.models.UsageLog ||
	mongoose.model<IUsageLog>("UsageLog", UsageLogSchema);

export default UsageLog;
