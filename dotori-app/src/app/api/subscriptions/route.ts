import { NextResponse } from "next/server";
import { z } from "zod";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { NotFoundError, withApiHandler } from "@/lib/api-handler";
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

export const POST = withApiHandler(async (req, { userId }) => {
	const body = await req.json();
	const parsed = subscriptionCreateSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다." },
			{ status: 400 },
		);
	}

	await User.findById(userId).orFail(new NotFoundError("사용자를 찾을 수 없습니다"));

	await Subscription.updateMany(
		{ userId, status: "active" },
		{ $set: { status: "expired" } },
	);

	const startedAt = new Date();
	const subscription = await Subscription.create({
		userId,
		plan: parsed.data.plan,
		status: "active",
		startedAt,
		expiresAt: buildNextMonth(startedAt),
		amount: 0,
	});

	await User.findByIdAndUpdate(
		userId,
		{ $set: { plan: parsed.data.plan as "free" | "premium" | "partner" } },
		{
			new: true,
			runValidators: false,
		},
	).lean();

	return NextResponse.json({ data: subscription }, { status: 201 });
}, { rateLimiter: standardLimiter });
