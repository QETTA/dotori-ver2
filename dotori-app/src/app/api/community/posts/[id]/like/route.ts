import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { postService } from "@/lib/services/post.service";

export const POST = withApiHandler(async (_req, { userId, params }) => {
	const { id } = params;
	const result = await postService.likePost(id, userId);
	return NextResponse.json({ data: result });
}, { auth: true, rateLimiter: standardLimiter });

export const DELETE = withApiHandler(async (_req, { userId, params }) => {
	const { id } = params;
	const result = await postService.unlikePost(id, userId);
	return NextResponse.json({ data: result });
}, { auth: true, rateLimiter: standardLimiter });
