import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IActionExecution extends Document {
	intentId: mongoose.Types.ObjectId;
	userId: mongoose.Types.ObjectId;
	actionType: string;
	result: {
		success: boolean;
		data?: unknown;
		error?: string;
	};
	idempotencyKey: string;
	executedAt: Date;
	createdAt: Date;
}

const ActionExecutionSchema = new Schema<IActionExecution>(
	{
		intentId: {
			type: Schema.Types.ObjectId,
			ref: "ActionIntent",
			required: true,
		},
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		actionType: { type: String, required: true },
		result: {
			success: { type: Boolean, required: true },
			data: Schema.Types.Mixed,
			error: String,
		},
		idempotencyKey: { type: String, required: true, unique: true },
		executedAt: { type: Date, default: Date.now },
	},
	{ timestamps: true },
);

ActionExecutionSchema.index({ intentId: 1 });
ActionExecutionSchema.index({ userId: 1, executedAt: -1 });

const ActionExecution: Model<IActionExecution> =
	mongoose.models.ActionExecution ||
	mongoose.model<IActionExecution>(
		"ActionExecution",
		ActionExecutionSchema,
	);
export default ActionExecution;
