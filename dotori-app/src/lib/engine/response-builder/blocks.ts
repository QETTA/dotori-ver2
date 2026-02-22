import type { ChatBlock, ChildProfile } from "@/types/dotori";
import { type ChatIntent } from "../intent-classifier";
import Facility from "@/models/Facility";
import User from "@/models/User";
import Waitlist from "@/models/Waitlist";
import { toFacilityDTO, toChildProfile } from "@/lib/dto";
import dbConnect from "@/lib/db";
import { generateChatResponse } from "@/lib/ai/claude";
import { generateChecklist } from "../report-engine";
import {
	detectTransferScenario,
	extractFacilityType,
	extractRegion,
	sanitizeSearchQuery,
	transferScenarioEmpathy,
} from "./context";
import type { ConversationContext, UserContext } from "./types";

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
			return buildRecommendResponse(
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
			return buildCompareResponse(
				message,
				userProfile,
				conversationContext,
			);

		case "explain":
			return buildExplainResponse(
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

async function buildRecommendResponse(
	message: string,
	userProfile?: UserContext,
	conversationContext?: ConversationContext,
): Promise<{ content: string; blocks: ChatBlock[] }> {
	try {
		const region = extractRegion(message);
		const type = extractFacilityType(message) ?? conversationContext?.establishedFacilityType;
		const filter: Record<string, unknown> = {};
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

		const facilities = await Facility.find(filter)
			.sort({ reviewCount: -1, updatedAt: -1 })
			.limit(5)
			.lean();

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

		const dtos = facilities.map((f) => toFacilityDTO(f));

		// Generate AI commentary about the results
		const aiResponse = await generateChatResponse(message, {
			facilities: dtos.map((f) => ({
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

		const regionLabel =
			region.sigungu ||
			conversationContext?.establishedRegion?.sigungu ||
			userProfile?.region?.sigungu ||
			"주변";
		const fallbackContent = `${regionLabel} 어린이집 ${dtos.length}곳을 찾았어요!`;
		const content =
			aiResponse.success && aiResponse.content
				? aiResponse.content
				: fallbackContent;

		return {
			content,
			blocks: [
				{ type: "text", content },
				{ type: "facility_list", facilities: dtos },
				{
					type: "map",
					center: { lat: dtos[0].lat, lng: dtos[0].lng },
					markers: dtos.map((f) => ({
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

async function buildCompareResponse(
	message: string,
	userProfile?: UserContext,
	conversationContext?: ConversationContext,
): Promise<{ content: string; blocks: ChatBlock[] }> {
	try {
		const region = extractRegion(message);
		const type = extractFacilityType(message) ?? conversationContext?.establishedFacilityType;
		const filter: Record<string, unknown> = {};
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

		const facilities = await Facility.find(filter)
			.sort({ reviewCount: -1, updatedAt: -1 })
			.limit(3)
			.lean();
		const dtos = facilities.map((f) => toFacilityDTO(f));

		if (dtos.length < 2) {
			return fallbackResponse("비교할 어린이집이 충분하지 않아요.");
		}

		const aiResponse = await generateChatResponse(message, {
			facilities: dtos.map((f) => ({
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

		const fallbackContent = `${dtos.map((f) => f.name).join(", ")}을(를) 비교해드릴게요.`;
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
					facilities: dtos,
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

async function buildExplainResponse(
	message: string,
	userProfile?: UserContext,
	conversationContext?: ConversationContext,
): Promise<{ content: string; blocks: ChatBlock[] }> {
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
		return buildKnowledgeResponse(message, userProfile, conversationContext);
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

async function buildStatusResponse(
	message: string,
	userId?: string,
	userProfile?: UserContext,
	conversationContext?: ConversationContext,
): Promise<{ content: string; blocks: ChatBlock[] }> {
	function asRecord(value: unknown): Record<string, unknown> | null {
		if (!value || typeof value !== "object") {
			return null;
		}

		return value as Record<string, unknown>;
	}

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

function fallbackResponse(
	content: string,
): { content: string; blocks: ChatBlock[] } {
	return {
		content,
		blocks: [{ type: "text", content }],
	};
}
