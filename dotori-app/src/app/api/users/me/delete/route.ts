import { NextResponse } from "next/server";
import { withApiHandler, NotFoundError } from "@/lib/api-handler";
import { strictLimiter } from "@/lib/rate-limit";
import User from "@/models/User";
import Waitlist from "@/models/Waitlist";
import Alert from "@/models/Alert";
import Review from "@/models/Review";
import Visit from "@/models/Visit";
import ChatHistory from "@/models/ChatHistory";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import { log } from "@/lib/logger";

/**
 * DELETE /api/users/me/delete
 *
 * GDPR 계정 삭제 — 사용자의 모든 개인정보를 영구 삭제
 * - 커뮤니티 게시글/댓글은 익명화 처리 (authorId 제거)
 * - 나머지 데이터는 완전 삭제
 */
export const DELETE = withApiHandler(async (_req, { userId }) => {
	const user = await User.findById(userId).lean();
	if (!user) {
		throw new NotFoundError("사용자를 찾을 수 없습니다");
	}

	// Delete user-specific data
	const [waitlistResult, alertResult, reviewResult, visitResult, chatResult] =
		await Promise.all([
			Waitlist.deleteMany({ userId }),
			Alert.deleteMany({ userId }),
			Review.deleteMany({ userId }),
			Visit.deleteMany({ userId }),
			ChatHistory.deleteMany({ userId }),
		]);

	// Anonymize community posts and comments (preserve content, remove identity)
	const [postResult, commentResult] = await Promise.all([
		Post.updateMany(
			{ authorId: userId },
			{ $set: { authorId: null, authorName: "탈퇴한 사용자" } },
		),
		Comment.updateMany(
			{ authorId: userId },
			{ $set: { authorId: null, authorName: "탈퇴한 사용자" } },
		),
	]);

	// Delete user account last
	await User.findByIdAndDelete(userId);

	log.info("GDPR account deletion completed", {
		userId,
		deleted: {
			waitlists: waitlistResult.deletedCount,
			alerts: alertResult.deletedCount,
			reviews: reviewResult.deletedCount,
			visits: visitResult.deletedCount,
			chatHistories: chatResult.deletedCount,
		},
		anonymized: {
			posts: postResult.modifiedCount,
			comments: commentResult.modifiedCount,
		},
	});

	return NextResponse.json({
		data: { message: "계정이 성공적으로 삭제되었습니다" },
	});
}, { rateLimiter: strictLimiter });
