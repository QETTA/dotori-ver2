import { NextResponse } from "next/server";
import { withApiHandler, NotFoundError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import User from "@/models/User";
import Waitlist from "@/models/Waitlist";
import Alert from "@/models/Alert";
import Review from "@/models/Review";
import Visit from "@/models/Visit";
import ChatHistory from "@/models/ChatHistory";
import Post from "@/models/Post";

/**
 * GET /api/users/me/export
 *
 * GDPR 데이터 내보내기 — 사용자의 모든 개인정보를 JSON으로 반환
 */
export const GET = withApiHandler(async (_req, { userId }) => {
	const user = await User.findById(userId)
		.select("-__v")
		.lean();

	if (!user) {
		throw new NotFoundError("사용자를 찾을 수 없습니다");
	}

	const [waitlists, alerts, reviews, visits, chatHistories, posts] =
		await Promise.all([
			Waitlist.find({ userId }).select("-__v").lean(),
			Alert.find({ userId }).select("-__v").lean(),
			Review.find({ userId }).select("-__v").lean(),
			Visit.find({ userId }).select("-__v").lean(),
			ChatHistory.find({ userId }).select("-__v").lean(),
			Post.find({ authorId: userId }).select("-__v").lean(),
		]);

	const exportData = {
		exportedAt: new Date().toISOString(),
		user,
		waitlists,
		alerts,
		reviews,
		visits,
		chatHistories,
		posts,
	};

	return NextResponse.json({ data: exportData }, {
		headers: {
			"Content-Disposition": `attachment; filename="dotori-export-${userId}.json"`,
		},
	});
}, { rateLimiter: standardLimiter });
