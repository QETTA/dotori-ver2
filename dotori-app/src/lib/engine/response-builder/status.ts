import type { ChatBlock } from "@/types/dotori";
import User from "@/models/User";
import Waitlist from "@/models/Waitlist";
import { generateChatResponse } from "@/lib/ai/claude";
import type { ConversationContext, UserContext } from "./types";

type ChatResponse = { content: string; blocks: ChatBlock[] };

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	return value as Record<string, unknown>;
}

export async function buildStatusResponse(
	message: string,
	userId?: string,
	userProfile?: UserContext,
	conversationContext?: ConversationContext,
): Promise<ChatResponse> {
	if (!userId) {
		const content =
			"대기 상태를 확인하려면 로그인이 필요해요. 로그인하면 관심시설 현황과 대기 순번을 바로 알려드릴게요!";
		return {
			content,
			blocks: [
				{ type: "text", content },
				{
					type: "actions",
					buttons: [
						{
							id: "login",
							label: "로그인",
							action: "register_interest",
							variant: "solid",
						},
					],
				},
			],
		};
	}

	return buildWaitlistStatusResponse(
		message,
		userId,
		userProfile,
		conversationContext,
	);
}

export async function buildWaitlistStatusResponse(
	message: string,
	userId: string,
	userProfile?: UserContext,
	conversationContext?: ConversationContext,
): Promise<ChatResponse> {
	try {
		const waitlists = await Waitlist.find({
			userId,
			status: { $ne: "cancelled" },
		})
			.populate("facilityId")
			.lean();

		const user = await User.findById(userId).lean();
		const interests = user?.interests || [];

		let statusInfo = "";
		if (waitlists.length > 0) {
			statusInfo += `\n[대기 현황]\n`;
			for (const w of waitlists) {
				const facilityRecord = asRecord(w.facilityId);
				const facilityName =
					facilityRecord && typeof facilityRecord.name === "string"
						? facilityRecord.name
						: "시설";
				statusInfo += `- ${facilityName}: ${w.status === "pending" ? "대기 중" : w.status}${w.position ? ` (${w.position}번째)` : ""}\n`;
			}
		}
		statusInfo += `\n관심시설 ${interests.length}곳 등록됨`;

		const aiResponse = await generateChatResponse(message, {
			userProfile,
			intent: "status",
			statusInfo,
			previousMessages: conversationContext?.previousMessages,
		});

		const fallbackContent =
			waitlists.length > 0
				? `현재 ${waitlists.length}곳의 대기 신청이 있어요.`
				: "아직 대기 신청한 시설이 없어요. 관심 시설에서 대기 신청을 해보세요!";

		const content =
			aiResponse.success && aiResponse.content
				? aiResponse.content
				: fallbackContent;

		return {
			content,
			blocks: [
				{ type: "text", content },
				{
					type: "actions",
					buttons: [
						{
							id: "waitlist",
							label: "대기 현황 보기",
							action: "register_interest",
							variant: "solid",
						},
						{
							id: "explore",
							label: "시설 탐색",
							action: "compare",
							variant: "outline",
						},
					],
				},
			],
		};
	} catch {
		return fallbackResponse(
			"대기 현황을 불러오는 중 오류가 발생했어요. 다시 시도해주세요.",
		);
	}
}

function fallbackResponse(content: string): ChatResponse {
	return {
		content,
		blocks: [{ type: "text", content }],
	};
}

