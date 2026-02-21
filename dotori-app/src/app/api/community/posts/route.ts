import { type NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter, standardLimiter } from "@/lib/rate-limit";
import { sanitizeContent, sanitizeString } from "@/lib/sanitize";
import { toPostDTO } from "@/lib/dto";
import Post from "@/models/Post";

const communityPostCreateSchema = z.object({
	content: z
		.string({ error: "내용을 입력해주세요" })
		.min(10, "내용은 10자 이상이어야 합니다")
		.max(5000, "내용은 5000자 이내여야 합니다"),
	category: z.enum(["question", "review", "info", "feedback"], {
		error: "유효하지 않은 카테고리입니다",
	}),
	title: z.string().max(120, "제목은 120자 이내여야 합니다").optional(),
	facilityTags: z.array(z.string()).max(5).optional(),
});

export const GET = withApiHandler(async (req) => {
	const { searchParams } = req.nextUrl;
	const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
	const limit = Math.min(
		100,
		Math.max(1, parseInt(searchParams.get("limit") || "20") || 20),
	);
	const category = searchParams.get("category") || "";
	const sort = searchParams.get("sort") || "createdAt";
	const facilityId = searchParams.get("facilityId") || "";

	const filter: Record<string, unknown> = {};
	if (category) filter.category = category;
	if (facilityId && mongoose.Types.ObjectId.isValid(facilityId)) filter.facilityTags = { $in: [facilityId] };

	const sortObj: Record<string, -1 | 1> =
		sort === "likes" ? { likes: -1 } : { createdAt: -1 };

	const [posts, total] = await Promise.all([
		Post.find(filter)
			.select("content category likes likedBy commentCount createdAt authorId facilityTags aiSummary")
			.skip((page - 1) * limit)
			.limit(limit)
			.sort(sortObj)
			.lean(),
		Post.countDocuments(filter),
	]);

	return NextResponse.json(
		{
			data: posts.map((p) => toPostDTO(p)),
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		},
		{
			headers: {
				"Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
			},
		},
	);
}, { auth: false, rateLimiter: relaxedLimiter });

export const POST = withApiHandler(async (req: NextRequest, { userId, body }) => {
	const session = await (await import("@/auth")).auth();
	const sanitizedContent = sanitizeContent(body.content);
	const sanitizedTitle = body.title ? sanitizeString(body.title) : undefined;
	const sanitizedTags = body.facilityTags?.map(sanitizeString);
	const post = await Post.create({
		authorId: userId,
		author: {
			nickname: session?.user?.name || "익명",
			avatar: session?.user?.image,
			verified: false,
		},
		...(sanitizedTitle ? { title: sanitizedTitle } : {}),
		content: sanitizedContent,
		category: body.category,
		facilityTags: sanitizedTags,
	});

	return NextResponse.json({ data: toPostDTO(post) }, { status: 201 });
}, { schema: communityPostCreateSchema, rateLimiter: standardLimiter });
