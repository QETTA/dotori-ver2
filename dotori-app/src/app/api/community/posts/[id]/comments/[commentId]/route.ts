import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { withApiHandler, BadRequestError, ForbiddenError, NotFoundError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { sanitizeContent } from "@/lib/sanitize";
import Comment from "@/models/Comment";
import Post from "@/models/Post";

const commentUpdateSchema = z.object({
	content: z
		.string({ error: "댓글 내용은 필수입니다" })
		.min(1, "댓글 내용은 필수입니다")
		.transform((v) => sanitizeContent(v.slice(0, 2000))),
});

/** PATCH /api/community/posts/[id]/comments/[commentId] — Edit own comment */
export const PATCH = withApiHandler(async (_req, { userId, body, params }) => {
	const { id, commentId } = params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new BadRequestError("유효하지 않은 게시물 ID입니다");
	}
	if (!mongoose.Types.ObjectId.isValid(commentId)) {
		throw new BadRequestError("유효하지 않은 댓글 ID입니다");
	}

	const comment = await Comment.findOne({ _id: commentId, postId: id });
	if (!comment) throw new NotFoundError("댓글을 찾을 수 없습니다");
	if (String(comment.authorId) !== userId) {
		throw new ForbiddenError("본인의 댓글만 수정할 수 있습니다");
	}

	comment.content = body.content;
	await comment.save();

	return NextResponse.json({
		data: {
			id: String(comment._id),
			postId: String(comment.postId),
			authorId: String(comment.authorId),
			author: comment.author,
			content: comment.content,
			likes: comment.likes,
			createdAt: comment.createdAt.toISOString(),
			updatedAt: comment.updatedAt.toISOString(),
		},
	});
}, { schema: commentUpdateSchema, rateLimiter: standardLimiter });

/** DELETE /api/community/posts/[id]/comments/[commentId] — Delete own comment */
export const DELETE = withApiHandler(async (_req, { userId, params }) => {
	const { id, commentId } = params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new BadRequestError("유효하지 않은 게시물 ID입니다");
	}
	if (!mongoose.Types.ObjectId.isValid(commentId)) {
		throw new BadRequestError("유효하지 않은 댓글 ID입니다");
	}

	const comment = await Comment.findOne({ _id: commentId, postId: id });
	if (!comment) throw new NotFoundError("댓글을 찾을 수 없습니다");
	if (String(comment.authorId) !== userId) {
		throw new ForbiddenError("본인의 댓글만 삭제할 수 있습니다");
	}

	await Promise.all([
		Comment.deleteOne({ _id: commentId }),
		Post.findByIdAndUpdate(id, { $inc: { commentCount: -1 } }),
	]);

	return NextResponse.json({ data: { deleted: true } });
}, { rateLimiter: standardLimiter });
