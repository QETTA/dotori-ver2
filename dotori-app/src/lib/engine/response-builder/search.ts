import type { ChatBlock } from "@/types/dotori";
import Facility from "@/models/Facility";
import { toFacilityDTO } from "@/lib/dto";
import { generateChatResponse } from "@/lib/ai/claude";
import {
	extractFacilityType,
	extractRegion,
	sanitizeSearchQuery,
} from "./context";
import type { ConversationContext, UserContext } from "./types";

type ChatResponse = { content: string; blocks: ChatBlock[] };

export type FacilityDTO = ReturnType<typeof toFacilityDTO>;
export type SearchMode = "recommend" | "compare";

export async function buildSearchResponse(
	message: string,
	mode: SearchMode,
	userProfile?: UserContext,
	conversationContext?: ConversationContext,
): Promise<{ facilities: FacilityDTO[]; regionLabel: string }> {
	const region = extractRegion(message);
	const type =
		extractFacilityType(message) ??
		conversationContext?.establishedFacilityType;
	const filter: Record<string, unknown> = {};

	if (mode === "recommend") {
		if (region.sido) filter["region.sido"] = region.sido;
		if (region.sigungu) filter["region.sigungu"] = region.sigungu;
		if (type) filter.type = type;

		if (!region.sido && conversationContext?.establishedRegion?.sido) {
			filter["region.sido"] = conversationContext.establishedRegion.sido;
			if (conversationContext.establishedRegion.sigungu) {
				filter["region.sigungu"] =
					conversationContext.establishedRegion.sigungu;
			}
		} else if (!region.sido && userProfile?.region?.sido) {
			filter["region.sido"] = userProfile.region.sido;
			filter["region.sigungu"] = userProfile.region.sigungu;
		}

		const hasDeictic = [
			"이 중",
			"여기서",
			"이들",
			"그 중",
			"거기",
			"이것들",
		].some((w) => message.includes(w));
		if (hasDeictic && conversationContext?.mentionedFacilityIds?.length) {
			filter["_id"] = { $in: conversationContext.mentionedFacilityIds };
		}
	} else {
		if (region.sigungu) {
			filter["region.sido"] = region.sido;
			filter["region.sigungu"] = region.sigungu;
		}
		if (type) filter.type = type;

		const hasDeictic = ["이 중", "여기서", "이들", "그 중", "거기"].some((w) =>
			message.includes(w),
		);
		if (hasDeictic && conversationContext?.mentionedFacilityIds?.length) {
			filter["_id"] = { $in: conversationContext.mentionedFacilityIds };
		}
	}

	const limit = mode === "recommend" ? 5 : 3;
	const facilities = await Facility.find(filter)
		.sort({ reviewCount: -1, updatedAt: -1 })
		.limit(limit)
		.lean();

	const regionLabel =
		region.sigungu ||
		conversationContext?.establishedRegion?.sigungu ||
		userProfile?.region?.sigungu ||
		"주변";

	return {
		facilities: facilities.map((f) => toFacilityDTO(f)),
		regionLabel,
	};
}

export async function buildFacilityDetailResponse(
	message: string,
	userProfile?: UserContext,
	conversationContext?: ConversationContext,
): Promise<ChatResponse> {
	// Try to find a specific facility by name
	const facilities = await Facility.find({
		$text: { $search: sanitizeSearchQuery(message) },
	})
		.limit(1)
		.lean()
		.catch(() => []);

	const facilityNameHint =
		/["“”'][^"“”']+["“”']/.test(message) ||
		/[가-힣]+\s*(어린이집|유치원|보육원|보육센터)/.test(message) ||
		/[A-Za-z]+\s*(daycare|kindergarten|center|facility)/i.test(message);

	if (facilities.length === 0 && !facilityNameHint) {
		return buildKnowledgeFallbackResponse(message, userProfile, conversationContext);
	}

	const aiResponse = await generateChatResponse(message, {
		facilities:
			facilities.length > 0
				? facilities.map((f) => {
						const dto = toFacilityDTO(f);
						return {
							name: dto.name,
							type: dto.type,
							status: dto.status,
							capacity: dto.capacity,
							rating: dto.rating,
							address: dto.address,
							features: dto.features,
						};
					})
				: undefined,
		userProfile,
		intent: "explain",
		previousMessages: conversationContext?.previousMessages,
	});

	const content =
		aiResponse.success && aiResponse.content
			? aiResponse.content
			: "궁금한 점이 있으시군요! 구체적인 시설명이나 주제를 알려주시면 더 자세히 알려드릴게요.";

	const blocks: ChatBlock[] = [{ type: "text", content }];

	if (facilities.length > 0) {
		const dtos = facilities.map((f) => toFacilityDTO(f));
		blocks.push({ type: "facility_list", facilities: dtos });
	}

	blocks.push({
		type: "actions",
		buttons: [
			{
				id: "explore",
				label: "탐색하기",
				action: "compare",
				variant: "solid",
			},
		],
	});

	return { content, blocks };
}

async function buildKnowledgeFallbackResponse(
	message: string,
	userProfile?: UserContext,
	conversationContext?: ConversationContext,
): Promise<ChatResponse> {
	const aiResponse = await generateChatResponse(message, {
		userProfile,
		intent: "knowledge",
		previousMessages: conversationContext?.previousMessages,
	});

	const content =
		aiResponse.success && aiResponse.content
			? aiResponse.content
			: "보육 정책에 대해 궁금한 점이 있으시군요! 아이사랑포털(childcare.go.kr)에서도 확인하실 수 있어요.";

	return {
		content,
		blocks: [
			{ type: "text", content },
			{
				type: "actions",
				buttons: [
					{
						id: "explore",
						label: "시설 탐색하기",
						action: "compare",
						variant: "outline",
					},
					{
						id: "checklist",
						label: "입소 체크리스트",
						action: "generate_checklist",
						variant: "outline",
					},
				],
			},
		],
	};
}

