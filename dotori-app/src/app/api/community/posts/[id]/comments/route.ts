import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { withApiHandler, BadRequestError, NotFoundError } from "@/lib/api-handler";
import { relaxedLimiter, standardLimiter } from "@/lib/rate-limit";
import { commentCreateSchema } from "@/lib/validations";
import Comment from "@/models/Comment";
import Post from "@/models/Post";

export const GET = withApiHandler(async (req, { params }) => {
	const { id } = params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new BadRequestError("유효하지 않은 게시물 ID입니다");
	}

	const rawPage = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
	const rawLimit = parseInt(req.nextUrl.searchParams.get("limit") || "30", 10);
	const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
	const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 30;

	const [comments, total] = await Promise.all([
		Comment.find({ postId: id })
			.sort({ createdAt: 1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.lean(),
		Comment.countDocuments({ postId: id }),
	]);

	return NextResponse.json({
		data: comments.map((c) => ({
			id: String(c._id),
			postId: String(c.postId),
			authorId: String(c.authorId),
			author: c.author,
			content: c.content,
			likes: c.likes,
			createdAt:
				c.createdAt instanceof Date
					? c.createdAt.toISOString()
					: String(c.createdAt),
		})),
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	});
}, { auth: false, rateLimiter: relaxedLimiter });

export const POST = withApiHandler(async (_req, { userId, body, params }) => {
	const { id } = params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new BadRequestError("유효하지 않은 게시물 ID입니다");
	}

	// Retrieve session for author metadata (name, avatar)
	const session = await auth();

	// Atomic: create comment + increment count (verify post exists via update result)
	const [comment, updatedPost] = await Promise.all([
		Comment.create({
			postId: id,
			authorId: userId,
			author: {
				nickname: session?.user?.name || "익명",
				avatar: session?.user?.image,
				verified: false,
			},
			content: body.content,
		}),
		Post.findByIdAndUpdate(id, { $inc: { commentCount: 1 } }, { new: true }).select("_id").lean(),
	]);

	if (!updatedPost) {
		// Rollback: delete orphan comment if post doesn't exist
		await Comment.findByIdAndDelete(comment._id);
		throw new NotFoundError("게시물을 찾을 수 없습니다");
	}

	return NextResponse.json(
		{
			data: {
				id: String(comment._id),
				postId: String(comment.postId),
				authorId: String(comment.authorId),
				author: comment.author,
				content: comment.content,
				likes: comment.likes,
				createdAt: comment.createdAt.toISOString(),
			},
		},
		{ status: 201 },
	);
}, { auth: true, schema: commentCreateSchema, rateLimiter: standardLimiter });
