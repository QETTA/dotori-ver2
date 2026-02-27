import { NextResponse } from "next/server";
import { z } from "zod";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { subscriptionService } from "@/lib/services/subscription.service";

const subscriptionCreateSchema = z.object({
	plan: z.enum(["premium", "partner"]),
});

export const GET = withApiHandler(async (_req, { userId }) => {
	const activeSub = await subscriptionService.getActive(userId);

	if (activeSub) {
		return NextResponse.json({ data: activeSub });
	}

	// 최신 구독 이력 (만료/해지 포함)
	const latestSubscription = await Subscription.findOne({ userId }).sort({
		startedAt: -1,
	}).lean();
	if (latestSubscription) {
		return NextResponse.json({ data: latestSubscription });
	}

	const user = await User.findById(userId).select("plan").lean();
	const fallbackPlan = ((user?.plan as "free" | "premium" | "partner") ?? "free");

	return NextResponse.json({
		data: {
			userId,
			plan: fallbackPlan,
			status: "active",
			startedAt: null,
			expiresAt: null,
		},
	});
}, { rateLimiter: standardLimiter });

export const POST = withApiHandler(async (_req, { userId, body }) => {
	// TODO: Toss Payments 결제 검증으로 교체 예정
	const currentUser = await User.findById(userId).select("role").lean<{ role?: string }>();
	if (currentUser?.role !== "admin") {
		throw new ApiError("관리자만 구독을 생성할 수 있습니다", 403);
	}

	const subscription = await subscriptionService.create({
		userId,
		plan: body.plan,
	});

	return NextResponse.json({ data: subscription }, { status: 201 });
}, { schema: subscriptionCreateSchema, rateLimiter: standardLimiter });
