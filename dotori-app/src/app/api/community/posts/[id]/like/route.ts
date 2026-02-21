import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { withApiHandler, BadRequestError, NotFoundError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import Post from "@/models/Post";

export const POST = withApiHandler(async (_req, { userId, params }) => {
	const { id } = params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new BadRequestError("유효하지 않은 게시물 ID입니다");
	}

	// Only increment likes if user not already in likedBy (atomic guard)
	const post = await Post.findOneAndUpdate(
		{ _id: id, likedBy: { $ne: userId } },
		{
			$addToSet: { likedBy: userId },
			$inc: { likes: 1 },
		},
		{ new: true },
	);

	if (!post) {
		// Either post not found or user already liked
		const exists = await Post.findById(id).lean();
		if (!exists) {
			throw new NotFoundError("게시물을 찾을 수 없습니다");
		}
		return NextResponse.json({ data: { likes: exists.likes } });
	}

	return NextResponse.json({ data: { likes: post.likes } });
}, { auth: true, rateLimiter: standardLimiter });

export const DELETE = withApiHandler(async (_req, { userId, params }) => {
	const { id } = params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new BadRequestError("유효하지 않은 게시물 ID입니다");
	}

	// Only decrement likes if user is in likedBy (atomic guard)
	const post = await Post.findOneAndUpdate(
		{ _id: id, likedBy: userId },
		{
			$pull: { likedBy: userId },
			$inc: { likes: -1 },
		},
		{ new: true },
	);

	if (!post) {
		const exists = await Post.findById(id).lean();
		if (!exists) {
			throw new NotFoundError("게시물을 찾을 수 없습니다");
		}
		return NextResponse.json({ data: { likes: exists.likes } });
	}

	return NextResponse.json({
		data: { likes: Math.max(0, post.likes) },
	});
}, { auth: true, rateLimiter: standardLimiter });
