import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IComment extends Document {
	postId: mongoose.Types.ObjectId;
	authorId: mongoose.Types.ObjectId;
	author: {
		nickname: string;
		avatar?: string;
		verified: boolean;
	};
	content: string;
	likes: number;
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

const CommentSchema = new Schema<IComment>(
	{
		postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
		authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		author: { type: AuthorSubSchema, required: true },
		content: { type: String, required: true, maxlength: 2000 },
		likes: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

CommentSchema.index({ postId: 1, createdAt: 1 });

const Comment: Model<IComment> =
	mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);
export default Comment;
