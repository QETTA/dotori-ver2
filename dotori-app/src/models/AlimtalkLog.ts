import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IAlimtalkLog extends Document {
	userId: mongoose.Types.ObjectId;
	templateId: string;
	phone: string;
	status: "sent" | "delivered" | "failed" | "pending";
	solapiMsgId?: string;
	errorMsg?: string;
	variables: Record<string, string>;
	createdAt: Date;
}

const AlimtalkLogSchema = new Schema<IAlimtalkLog>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		templateId: { type: String, required: true },
		phone: { type: String, required: true },
		status: {
			type: String,
			enum: ["sent", "delivered", "failed", "pending"],
			default: "pending",
		},
		solapiMsgId: String,
		errorMsg: String,
		variables: { type: Schema.Types.Mixed, default: {} },
	},
	{
		timestamps: { createdAt: true, updatedAt: false },
		toJSON: {
			virtuals: true,
			transform(_doc, ret: { id?: string; _id?: unknown; __v?: unknown }) {
				ret.id = String(ret._id);
				delete ret._id;
				delete ret.__v;
			},
		},
	},
);

AlimtalkLogSchema.index({ userId: 1, createdAt: -1 });
AlimtalkLogSchema.index({ status: 1 });
AlimtalkLogSchema.index({ templateId: 1 });

const AlimtalkLog: Model<IAlimtalkLog> =
	mongoose.models.AlimtalkLog ||
	mongoose.model<IAlimtalkLog>("AlimtalkLog", AlimtalkLogSchema);
export default AlimtalkLog;
