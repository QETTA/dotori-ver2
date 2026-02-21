import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IChatHistory extends Document {
	userId: mongoose.Types.ObjectId;
	messages: {
		role: "user" | "assistant";
		content: string;
		timestamp: Date;
		metadata?: Record<string, unknown>;
		blocks?: unknown[];
	}[];
	summary?: string;
	createdAt: Date;
	updatedAt: Date;
}

const MessageSchema = new Schema(
	{
		role: { type: String, enum: ["user", "assistant"], required: true },
		content: { type: String, required: true },
		timestamp: { type: Date, default: Date.now },
		metadata: Schema.Types.Mixed,
		blocks: { type: [Schema.Types.Mixed], default: undefined },
	},
	{ _id: true },
);

const ChatHistorySchema = new Schema<IChatHistory>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		messages: { type: [MessageSchema], default: [] },
		summary: String,
	},
	{ timestamps: true },
);

ChatHistorySchema.index({ userId: 1, createdAt: -1 });
ChatHistorySchema.index({ userId: 1, updatedAt: -1 });

const ChatHistory: Model<IChatHistory> =
	mongoose.models.ChatHistory ||
	mongoose.model<IChatHistory>("ChatHistory", ChatHistorySchema);
export default ChatHistory;
