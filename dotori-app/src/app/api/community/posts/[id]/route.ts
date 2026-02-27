import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { postService } from "@/lib/services/post.service";

const postUpdateSchema = z.object({
	content: z.string().min(1).max(5000).optional(),
	category: z.enum(["question", "review", "info", "feedback"]).optional(),
	facilityTags: z.array(z.string().max(100)).optional(),
});

export const GET = withApiHandler(async (_req, { params }) => {
	const { id } = params;
	const post = await postService.findById(id);
	return NextResponse.json({ data: post });
}, { auth: false, rateLimiter: relaxedLimiter });

export const PATCH = withApiHandler(async (_req, { userId, body, params }) => {
	const { id } = params;
	const post = await postService.update({
		id,
		userId,
		content: body.content,
		category: body.category,
		facilityTags: body.facilityTags,
	});

	return NextResponse.json({ data: post });
}, { auth: true, schema: postUpdateSchema });

export const DELETE = withApiHandler(async (_req, { userId, params }) => {
	const { id } = params;
	await postService.remove(id, userId);
	return NextResponse.json({ data: { deleted: true } });
}, { auth: true });
