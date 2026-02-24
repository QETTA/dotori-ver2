import type { ChatBlock, ChildProfile } from "@/types/dotori";
import { type ChatIntent } from "../intent-classifier";
import Facility from "@/models/Facility";
import User from "@/models/User";
import { toFacilityDTO, toChildProfile } from "@/lib/dto";
import dbConnect from "@/lib/db";
import { generateChatResponse } from "@/lib/ai/claude";
import { generateChecklist } from "../report-engine";
import {
	detectTransferScenario,
	sanitizeSearchQuery,
	transferScenarioEmpathy,
} from "./context";
import type { ConversationContext, UserContext } from "./types";
import { buildFacilityDetailResponse } from "./search";
import { buildStatusResponse } from "./status";
import {
	buildComparisonResponse,
	buildRecommendationResponse,
} from "./recommendation";

/** Claude AI 텍스트 + DB 데이터 블록 하이브리드 응답 생성 */
export async function buildResponse(
	intent: ChatIntent,
	message: string,
	userId?: string,
	conversationContext?: ConversationContext,
): Promise<{ content: string; blocks: ChatBlock[] }> {
	try {
		await dbConnect();
	} catch {
		return fallbackResponse(
			"데이터를 불러오는 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.",
		);
	}

	// Load user profile for context
	let userProfile:
		| {
				nickname?: string;
				children?: Array<{ name: string; birthDate: string }>;
				region?: { sido: string; sigungu: string };
		  }
		| undefined;

	if (userId) {
		try {
			const user = await User.findById(userId).lean();
			if (user) {
				userProfile = {
					nickname: user.nickname || user.name,
					children: user.children?.map(
						(c: { name: string; birthDate: string }) => ({
							name: c.name,
							birthDate: c.birthDate,
						}),
					),
					region: user.region,
				};
			}
		} catch {
			// Continue without user context
		}
	}

	switch (intent) {
		case "recommend":
			return buildRecommendationResponse(
				message,
				userProfile,
				conversationContext,
			);

		case "transfer":
			return buildTransferResponse(
				message,
				userProfile,
				conversationContext,
			);

		case "compare":
			return buildComparisonResponse(
				message,
				userProfile,
				conversationContext,
			);

		case "explain":
			return buildFacilityDetailResponse(
				message,
				userProfile,
				conversationContext,
			);

		case "knowledge":
			return buildKnowledgeResponse(
				message,
				userProfile,
				conversationContext,
			);

		case "status":
			return buildStatusResponse(
				message,
				userId,
				userProfile,
				conversationContext,
			);

		case "checklist":
			return buildChecklistResponse(
				message,
				userId,
				userProfile,
				conversationContext,
			);

		case "general":
		default:
			return buildGeneralResponse(message, userProfile, conversationContext);
	}
}

async function buildTransferResponse(
	message: string,
	userProfile?: UserContext,
	conversationContext?: ConversationContext,
): Promise<{ content: string; blocks: ChatBlock[] }> {
	const scenario = detectTransferScenario(message);
	const empathyPrefix = transferScenarioEmpathy[scenario];
	const aiResponse = await generateChatResponse(
		`사용자 상황: ${message}
다음 톤과 순서로 상담해주세요:
1. 이동 이유(반편성/교사 변경/시설 불만/거리 등) 먼저 공감적으로 파악
2. 현재 거주 지역 기반 이동 가능 시설 탐색 가이드를 제안
3. 퇴소 통보(최소 1개월 전)와 새 시설 입소 신청 절차를 안내
4. 필요한 서류 체크리스트를 자연스럽게 제시

항상 엄마 말투로 공감 → 해결 순으로 답변해 주세요.`,
		{
			userProfile,
			intent: "transfer",
			previousMessages: conversationContext?.previousMessages,
		},
	);

	const content =
		aiResponse.success && aiResponse.content
			? `${empathyPrefix}\n\n${aiResponse.content}`
			: empathyPrefix;

	return {
		content,
		blocks: [{ type: "text", content }],
	};
}

async function buildGeneralResponse(
	message: string,
	userProfile?: UserContext,
	conversationContext?: ConversationContext,
): Promise<{ content: string; blocks: ChatBlock[] }> {
	const aiResponse = await generateChatResponse(message, {
		userProfile,
		intent: "general",
		previousMessages: conversationContext?.previousMessages,
	});

	const content =
		aiResponse.success && aiResponse.content
			? aiResponse.content
			: "안녕하세요! 저는 토리예요. 어린이집 검색, 비교, 입소 전략까지 도와드릴 수 있어요. 무엇이 궁금하세요?";

	return {
		content,
		blocks: [
			{ type: "text", content },
			{
				type: "actions",
				buttons: [
					{
						id: "recommend",
						label: "동네 추천",
						action: "compare",
						variant: "outline",
					},
					{
						id: "compare",
						label: "시설 비교",
						action: "compare",
						variant: "outline",
					},
					{
						id: "strategy",
						label: "입소 전략",
						action: "compare",
						variant: "outline",
					},
				],
			},
		],
	};
}

async function buildChecklistResponse(
	message: string,
	userId?: string,
	userProfile?: UserContext,
	conversationContext?: ConversationContext,
): Promise<{ content: string; blocks: ChatBlock[] }> {
	try {
		// Try to find a facility the user is asking about
		let facility = null;
		const facilities = await Facility.find({
			$text: { $search: sanitizeSearchQuery(message) },
		})
			.limit(1)
			.lean()
			.catch(() => []);

		if (facilities.length > 0) {
			facility = toFacilityDTO(facilities[0]);
		}

		// Get user's child profile
		let child: ChildProfile | null = null;
		if (userId) {
			const user = await User.findById(userId).lean();
			child = toChildProfile(user?.children?.[0] as Record<string, unknown> | undefined);
		}

		const checklist = generateChecklist(facility, child);

		const aiResponse = await generateChatResponse(
			`${message}\n[체크리스트 생성됨: ${checklist.categories.length}개 카테고리, ${checklist.categories.reduce((sum, c) => sum + c.items.length, 0)}개 항목]`,
			{
				userProfile,
				intent: "checklist",
				previousMessages: conversationContext?.previousMessages,
			},
		);

		const content =
			aiResponse.success && aiResponse.content
				? aiResponse.content
				: facility
					? `${facility.name} 입소 준비 체크리스트를 만들었어요!`
					: "어린이집 입소 준비 체크리스트를 만들었어요!";

		return {
			content,
			blocks: [
				{ type: "text", content },
				{
					type: "checklist",
					title: checklist.title,
					categories: checklist.categories,
				},
			],
		};
	} catch {
		return fallbackResponse(
			"체크리스트를 만드는 중 오류가 발생했어요. 다시 시도해주세요.",
		);
	}
}

async function buildKnowledgeResponse(
	message: string,
	userProfile?: UserContext,
	conversationContext?: ConversationContext,
): Promise<{ content: string; blocks: ChatBlock[] }> {
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
						action: "register_interest",
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

function fallbackResponse(
	content: string,
): { content: string; blocks: ChatBlock[] } {
	return {
		content,
		blocks: [{ type: "text", content }],
	};
}
