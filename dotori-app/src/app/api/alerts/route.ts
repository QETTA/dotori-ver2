import { NextResponse } from "next/server";
import { ApiError, withApiHandler } from "@/lib/api-handler";
import { createRateLimiter, standardLimiter } from "@/lib/rate-limit";
import { alertCreateSchema } from "@/lib/validations";
import { alertService } from "@/lib/services/alert.service";
import { isAlimtalkConfigured } from "@/lib/kakao-alimtalk";
import User from "@/models/User";

/** 20 req/min — alert write operations */
const alertWriteLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

/** 사용 가능한 알림 채널 목록 */
const AVAILABLE_CHANNELS = ["push", "kakao", "email"] as const;

export const GET = withApiHandler(async (_req, { userId }) => {
	const alerts = await alertService.listActive(userId);
	const sortedData = [...alerts.data].sort((a, b) => {
		if (a.type === "vacancy" && b.type !== "vacancy") {
			return -1;
		}
		if (a.type !== "vacancy" && b.type === "vacancy") {
			return 1;
		}
		return b.createdAt.getTime() - a.createdAt.getTime();
	});

	const channels = AVAILABLE_CHANNELS.map((ch) => ({
		id: ch,
		enabled: ch === "kakao" ? isAlimtalkConfigured() : true,
	}));

	return NextResponse.json({ ...alerts, data: sortedData, channels });
}, { rateLimiter: standardLimiter });

export const POST = withApiHandler(async (_req, { userId, body }) => {
	const userDoc = await User.findById(userId)
		.select("plan")
		.lean<{ plan?: "free" | "premium" }>();
	if (!userDoc) {
		throw new ApiError("사용자 정보를 찾을 수 없습니다", 404);
	}

	const alertType = body.type || "vacancy";
	const isPremiumUser = userDoc.plan === "premium";
	if (!isPremiumUser && alertType === "vacancy") {
		return NextResponse.json({
			data: null,
			message: "빈자리 알림은 프리미엄 기능입니다",
			requiresPremium: true,
		});
	}

	const alert = await alertService.create({
		userId,
		facilityId: body.facilityId,
		type: alertType,
		condition: body.condition,
		channels: body.channels,
	});

	return NextResponse.json({ data: alert }, { status: 201 });
}, { schema: alertCreateSchema, rateLimiter: alertWriteLimiter });
