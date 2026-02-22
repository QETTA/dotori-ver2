import type { ChatBlock } from "@/types/dotori";
import { generateChatResponse } from "@/lib/ai/claude";
import { buildSearchResponse } from "./search";
import type { ConversationContext, UserContext } from "./types";

type ChatResponse = { content: string; blocks: ChatBlock[] };

export async function buildRecommendationResponse(
	message: string,
	userProfile?: UserContext,
	conversationContext?: ConversationContext,
): Promise<ChatResponse> {
	try {
		const { facilities, regionLabel } = await buildSearchResponse(
			message,
			"recommend",
			userProfile,
			conversationContext,
		);

		if (facilities.length === 0) {
			const aiResponse = await generateChatResponse(message, {
				userProfile,
				intent: "recommend",
				previousMessages: conversationContext?.previousMessages,
			});
			const content =
				aiResponse.success && aiResponse.content
					? aiResponse.content
					: "조건에 맞는 어린이집을 찾지 못했어요. 검색 조건을 넓혀볼까요?";
			return {
				content,
				blocks: [
					{ type: "text", content },
					{
						type: "actions",
						buttons: [
							{
								id: "broaden",
								label: "전체 검색",
								action: "compare",
								variant: "outline",
							},
						],
					},
				],
			};
		}

		const aiResponse = await generateChatResponse(message, {
			facilities: facilities.map((f) => ({
				name: f.name,
				type: f.type,
				status: f.status,
				capacity: f.capacity,
				rating: f.rating,
				address: f.address,
				features: f.features,
				evaluationGrade: f.evaluationGrade,
			})),
			userProfile,
			intent: "recommend",
			previousMessages: conversationContext?.previousMessages,
		});

		const fallbackContent = `${regionLabel} 어린이집 ${facilities.length}곳을 찾았어요!`;
		const content =
			aiResponse.success && aiResponse.content
				? aiResponse.content
				: fallbackContent;

		return {
			content,
			blocks: [
				{ type: "text", content },
				{ type: "facility_list", facilities },
				{
					type: "map",
					center: { lat: facilities[0].lat, lng: facilities[0].lng },
					markers: facilities.map((f) => ({
						id: f.id,
						name: f.name,
						lat: f.lat,
						lng: f.lng,
						status: f.status,
					})),
				},
			],
		};
	} catch {
		return fallbackResponse(
			"어린이집 검색 중 오류가 발생했어요. 다시 시도해주세요.",
		);
	}
}

export async function buildComparisonResponse(
	message: string,
	userProfile?: UserContext,
	conversationContext?: ConversationContext,
): Promise<ChatResponse> {
	try {
		const { facilities } = await buildSearchResponse(
			message,
			"compare",
			userProfile,
			conversationContext,
		);

		if (facilities.length < 2) {
			return fallbackResponse("비교할 어린이집이 충분하지 않아요.");
		}

		const aiResponse = await generateChatResponse(message, {
			facilities: facilities.map((f) => ({
				name: f.name,
				type: f.type,
				status: f.status,
				capacity: f.capacity,
				rating: f.rating,
				address: f.address,
				features: f.features,
				evaluationGrade: f.evaluationGrade,
			})),
			userProfile,
			intent: "compare",
			previousMessages: conversationContext?.previousMessages,
		});

		const fallbackContent = `${facilities.map((f) => f.name).join(", ")}을(를) 비교해드릴게요.`;
		const content =
			aiResponse.success && aiResponse.content
				? aiResponse.content
				: fallbackContent;

		return {
			content,
			blocks: [
				{ type: "text", content },
				{
					type: "compare",
					facilities,
					criteria: ["정원", "입소 상태", "대기", "평점", "유형"],
				},
			],
		};
	} catch {
		return fallbackResponse(
			"비교 중 오류가 발생했어요. 다시 시도해주세요.",
		);
	}
}

function fallbackResponse(content: string): ChatResponse {
	return {
		content,
		blocks: [{ type: "text", content }],
	};
}

