import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { createRateLimiter, relaxedLimiter } from "@/lib/rate-limit";
import { postService } from "@/lib/services/post.service";

/** 10 req/min — community post creation */
const postCreateLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

const postListQuerySchema = z.object({
	page: z.string().regex(/^\d+$/).optional(),
	limit: z.string().regex(/^\d+$/).optional(),
	category: z.enum(["question", "review", "info", "feedback"]).optional(),
	sort: z.enum(["recent", "popular"]).optional(),
	facilityId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});

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
	const raw = Object.fromEntries(
		Array.from(searchParams.entries()).filter(([, v]) => v !== ""),
	);
	const parsed = postListQuerySchema.safeParse(raw);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "잘못된 검색 파라미터입니다" },
			{ status: 400 },
		);
	}
	const q = parsed.data;
	const result = await postService.list({
		page: q.page,
		limit: q.limit,
		category: q.category,
		sort: q.sort,
		facilityId: q.facilityId,
	});
	const anonymized = result.data.map((post) => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { authorId, ...withoutAuthor } = post;
		return withoutAuthor;
	});
	const response = { ...result, data: anonymized };

	return NextResponse.json(response, {
		headers: {
			"Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
		},
	});
}, { auth: false, rateLimiter: relaxedLimiter });

export const POST = withApiHandler(async (req: NextRequest, { userId, body }) => {
	const session = await (await import("@/auth")).auth();
	const post = await postService.create({
		userId,
		title: body.title,
		content: body.content,
		category: body.category,
		facilityTags: body.facilityTags,
		authorName: session?.user?.name ?? undefined,
		authorImage: session?.user?.image ?? undefined,
	});

	return NextResponse.json({ data: post }, { status: 201 });
}, { schema: communityPostCreateSchema, rateLimiter: postCreateLimiter });
