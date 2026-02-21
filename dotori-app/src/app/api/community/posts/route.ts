import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter, standardLimiter } from "@/lib/rate-limit";
import { postService } from "@/lib/services/post.service";

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
	const result = await postService.list({
		page: searchParams.get("page") || undefined,
		limit: searchParams.get("limit") || undefined,
		category: (searchParams.get("category") || undefined) as "review" | "question" | "info" | "feedback" | undefined,
		sort: searchParams.get("sort") || undefined,
		facilityId: searchParams.get("facilityId") || undefined,
	});

	return NextResponse.json(result, {
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
}, { schema: communityPostCreateSchema, rateLimiter: standardLimiter });
