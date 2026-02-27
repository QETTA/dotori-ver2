import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IPost extends Document {
	authorId: mongoose.Types.ObjectId;
	author: {
		nickname: string;
		avatar?: string;
		verified: boolean;
	};
	title?: string;
	content: string;
	category: "question" | "review" | "info" | "feedback";
	facilityTags: string[];
	aiSummary?: string;
	likes: number;
	likedBy: mongoose.Types.ObjectId[];
	commentCount: number;
	createdAt: Date;
	updatedAt: Date;
}

const AuthorSubSchema = new Schema(
	{
		nickname: { type: String, required: true },
		avatar: String,
		verified: { type: Boolean, default: false },
	},
	{ _id: false },
);

const PostSchema = new Schema<IPost>(
	{
		authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		author: { type: AuthorSubSchema, required: true },
		title: { type: String, maxlength: 120 },
		content: { type: String, required: true },
		category: {
			type: String,
			enum: ["question", "review", "info", "feedback"],
			required: true,
		},
		facilityTags: { type: [String], default: [] },
		aiSummary: String,
		likes: { type: Number, default: 0 },
		likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
		commentCount: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

PostSchema.index({ category: 1, createdAt: -1 });
PostSchema.index({ likes: -1, createdAt: -1 });
PostSchema.index({ facilityTags: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ authorId: 1, createdAt: -1 });

const Post: Model<IPost> =
	mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);
export default Post;
