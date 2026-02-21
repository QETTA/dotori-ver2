import { NextResponse } from "next/server";
import { z } from "zod";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";

const subscriptionCreateSchema = z.object({
	plan: z.enum(["premium", "partner"]),
});

function buildNextMonth(date: Date): Date {
	const expiresAt = new Date(date);
	expiresAt.setMonth(expiresAt.getMonth() + 1);
	return expiresAt;
}

export const GET = withApiHandler(async (_req, { userId }) => {
	const activeSubscription = await Subscription.findOne({
		userId,
		status: "active",
	}).sort({ startedAt: -1 }).lean();

	if (activeSubscription) {
		return NextResponse.json({ data: activeSubscription });
	}

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
	// TODO: 결제 연동 시 관리자 체크를 결제 검증 로직으로 교체
	const currentUser = await User.findById(userId).select("role").lean<{ role?: string }>();
	if (currentUser?.role !== "admin") {
		return NextResponse.json(
			{ error: "관리자만 구독을 생성할 수 있습니다" },
			{ status: 403 },
		);
	}

	await Subscription.updateMany(
		{ userId, status: "active" },
		{ $set: { status: "expired" } },
	);

	const startedAt = new Date();
	const subscription = await Subscription.create({
		userId,
		plan: body.plan,
		status: "active",
		startedAt,
		expiresAt: buildNextMonth(startedAt),
		amount: 0,
	});

	await User.findByIdAndUpdate(
		userId,
		{ $set: { plan: body.plan as "free" | "premium" | "partner" } },
		{
			new: true,
			runValidators: false,
		},
	).lean();

	return NextResponse.json({ data: subscription }, { status: 201 });
}, { schema: subscriptionCreateSchema, rateLimiter: standardLimiter });
