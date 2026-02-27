import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IChatMessageMetadata {
	intent?: string;
	quickReplies?: string[];
}

export interface IChatHistory extends Document {
	userId: mongoose.Types.ObjectId;
	messages: {
		role: "user" | "assistant";
		content: string;
		timestamp: Date;
		metadata?: IChatMessageMetadata;
		blocks?: unknown[];
	}[];
	summary?: string;
	createdAt: Date;
	updatedAt: Date;
}

const MessageMetadataSchema = new Schema(
	{
		intent: String,
		quickReplies: { type: [String], default: undefined },
	},
	{ _id: false, strict: false },
);

const MessageSchema = new Schema(
	{
		role: { type: String, enum: ["user", "assistant"], required: true },
		content: { type: String, required: true },
		timestamp: { type: Date, default: Date.now },
		metadata: { type: MessageMetadataSchema, default: undefined },
		blocks: { type: [Schema.Types.Mixed], default: undefined }, // ChatBlock[] — polymorphic by design
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
ChatHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });

const ChatHistory: Model<IChatHistory> =
	mongoose.models.ChatHistory ||
	mongoose.model<IChatHistory>("ChatHistory", ChatHistorySchema);
export default ChatHistory;
