import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { withApiHandler, BadRequestError, NotFoundError, ApiError } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { sanitizeContent, sanitizeString } from "@/lib/sanitize";
import { toPostDTO } from "@/lib/dto";
import Post from "@/models/Post";

const postUpdateSchema = z.object({
	content: z.string().min(1).max(5000).optional(),
	category: z.enum(["question", "review", "info", "feedback"]).optional(),
	facilityTags: z.array(z.string().max(100)).optional(),
});

export const GET = withApiHandler(async (_req, { params }) => {
	const { id } = params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new BadRequestError("유효하지 않은 게시물 ID입니다");
	}

	const post = await Post.findById(id).lean();

	if (!post) {
		throw new NotFoundError("게시물을 찾을 수 없습니다");
	}

	return NextResponse.json({ data: toPostDTO(post) });
}, { auth: false, rateLimiter: relaxedLimiter });

export const PATCH = withApiHandler(async (_req, { userId, body, params }) => {
	const { id } = params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new BadRequestError("유효하지 않은 게시물 ID입니다");
	}

	const post = await Post.findById(id);
	if (!post) {
		throw new NotFoundError("게시물을 찾을 수 없습니다");
	}

	if (String(post.authorId) !== userId) {
		throw new ApiError("권한이 없습니다", 403);
	}

	if (body.content) {
		post.content = sanitizeContent(body.content);
	}
	if (body.category) {
		post.category = body.category;
	}
	if (body.facilityTags) {
		post.facilityTags = body.facilityTags.map(sanitizeString);
	}
	await post.save();

	return NextResponse.json({ data: toPostDTO(post) });
}, { auth: true, schema: postUpdateSchema });

export const DELETE = withApiHandler(async (_req, { userId, params }) => {
	const { id } = params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new BadRequestError("유효하지 않은 게시물 ID입니다");
	}

	const post = await Post.findById(id).select("authorId").lean();
	if (!post) {
		throw new NotFoundError("게시물을 찾을 수 없습니다");
	}

	if (String(post.authorId) !== userId) {
		throw new ApiError("권한이 없습니다", 403);
	}

	await Post.findByIdAndDelete(id);
	return NextResponse.json({ data: { deleted: true } });
}, { auth: true });
