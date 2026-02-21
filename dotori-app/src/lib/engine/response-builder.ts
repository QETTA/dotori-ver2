import type { ChatBlock, ChildProfile } from "@/types/dotori";
import { type ChatIntent } from "./intent-classifier";
import Facility from "@/models/Facility";
import User from "@/models/User";
import Waitlist from "@/models/Waitlist";
import { toFacilityDTO, toChildProfile } from "@/lib/dto";
import dbConnect from "@/lib/db";
import { generateChatResponse } from "@/lib/ai/claude";
import { generateChecklist } from "./report-engine";

type UserContext = {
	nickname?: string;
	children?: Array<{ name: string; birthDate: string }>;
	region?: { sido: string; sigungu: string };
};

function extractRegion(message: string): { sido?: string; sigungu?: string } {
	// Phase 1: sigungu-level matching (specific district/city → sido + sigungu)
	const sigunguMap: Record<string, { sido: string; sigungu: string }> = {
		// 서울 25구
		강남: { sido: "서울특별시", sigungu: "강남구" },
		서초: { sido: "서울특별시", sigungu: "서초구" },
		송파: { sido: "서울특별시", sigungu: "송파구" },
		강동: { sido: "서울특별시", sigungu: "강동구" },
		마포: { sido: "서울특별시", sigungu: "마포구" },
		용산: { sido: "서울특별시", sigungu: "용산구" },
		성동: { sido: "서울특별시", sigungu: "성동구" },
		광진: { sido: "서울특별시", sigungu: "광진구" },
		동대문: { sido: "서울특별시", sigungu: "동대문구" },
		중랑: { sido: "서울특별시", sigungu: "중랑구" },
		영등포: { sido: "서울특별시", sigungu: "영등포구" },
		관악: { sido: "서울특별시", sigungu: "관악구" },
		동작: { sido: "서울특별시", sigungu: "동작구" },
		강서: { sido: "서울특별시", sigungu: "강서구" },
		양천: { sido: "서울특별시", sigungu: "양천구" },
		구로: { sido: "서울특별시", sigungu: "구로구" },
		금천: { sido: "서울특별시", sigungu: "금천구" },
		종로: { sido: "서울특별시", sigungu: "종로구" },
		성북: { sido: "서울특별시", sigungu: "성북구" },
		강북: { sido: "서울특별시", sigungu: "강북구" },
		도봉: { sido: "서울특별시", sigungu: "도봉구" },
		노원: { sido: "서울특별시", sigungu: "노원구" },
		은평: { sido: "서울특별시", sigungu: "은평구" },
		서대문: { sido: "서울특별시", sigungu: "서대문구" },
		// 중구 제외 — 서울/부산/대구/인천/대전/울산 중복
		// 경기 주요 20시
		성남: { sido: "경기도", sigungu: "성남시" },
		수원: { sido: "경기도", sigungu: "수원시" },
		용인: { sido: "경기도", sigungu: "용인시" },
		고양: { sido: "경기도", sigungu: "고양시" },
		화성: { sido: "경기도", sigungu: "화성시" },
		부천: { sido: "경기도", sigungu: "부천시" },
		안산: { sido: "경기도", sigungu: "안산시" },
		안양: { sido: "경기도", sigungu: "안양시" },
		남양주: { sido: "경기도", sigungu: "남양주시" },
		의정부: { sido: "경기도", sigungu: "의정부시" },
		시흥: { sido: "경기도", sigungu: "시흥시" },
		파주: { sido: "경기도", sigungu: "파주시" },
		김포: { sido: "경기도", sigungu: "김포시" },
		광명: { sido: "경기도", sigungu: "광명시" },
		하남: { sido: "경기도", sigungu: "하남시" },
		군포: { sido: "경기도", sigungu: "군포시" },
		오산: { sido: "경기도", sigungu: "오산시" },
		이천: { sido: "경기도", sigungu: "이천시" },
		평택: { sido: "경기도", sigungu: "평택시" },
		광주시: { sido: "경기도", sigungu: "광주시" },
		분당: { sido: "경기도", sigungu: "성남시" },
		판교: { sido: "경기도", sigungu: "성남시" },
		일산: { sido: "경기도", sigungu: "고양시" },
		동탄: { sido: "경기도", sigungu: "화성시" },
		// 부산 주요 구
		해운대: { sido: "부산광역시", sigungu: "해운대구" },
		수영: { sido: "부산광역시", sigungu: "수영구" },
		연제: { sido: "부산광역시", sigungu: "연제구" },
		부산진: { sido: "부산광역시", sigungu: "부산진구" },
		사하: { sido: "부산광역시", sigungu: "사하구" },
		금정: { sido: "부산광역시", sigungu: "금정구" },
		// 대구 주요 구
		수성: { sido: "대구광역시", sigungu: "수성구" },
		달서: { sido: "대구광역시", sigungu: "달서구" },
		// 인천 주요 구
		미추홀: { sido: "인천광역시", sigungu: "미추홀구" },
		연수: { sido: "인천광역시", sigungu: "연수구" },
		부평: { sido: "인천광역시", sigungu: "부평구" },
		// 대전 주요 구
		유성: { sido: "대전광역시", sigungu: "유성구" },
		서구: { sido: "대전광역시", sigungu: "서구" },
		// 광주 주요 구
		광산: { sido: "광주광역시", sigungu: "광산구" },
		// 제주
		제주시: { sido: "제주특별자치도", sigungu: "제주시" },
		서귀포: { sido: "제주특별자치도", sigungu: "서귀포시" },
		// 남구, 서구, 중구 제외 — 여러 시도에 중복
	};

	for (const [key, value] of Object.entries(sigunguMap)) {
		if (message.includes(key)) {
			return value;
		}
	}

	// Phase 2: sido-level matching (시도 약칭 → sido only)
	const sidoMap: Record<string, string> = {
		서울: "서울특별시",
		부산: "부산광역시",
		대구: "대구광역시",
		인천: "인천광역시",
		광주: "광주광역시",
		대전: "대전광역시",
		울산: "울산광역시",
		세종: "세종특별자치시",
		경기: "경기도",
		강원: "강원특별자치도",
		충북: "충청북도",
		충남: "충청남도",
		전북: "전북특별자치도",
		전남: "전라남도",
		경북: "경상북도",
		경남: "경상남도",
		제주: "제주특별자치도",
	};

	for (const [key, value] of Object.entries(sidoMap)) {
		if (message.includes(key)) {
			return { sido: value };
		}
	}

	return {};
}

function extractFacilityType(message: string): string | undefined {
	const types = ["국공립", "민간", "가정", "직장", "협동", "사회복지"];
	return types.find((t) => message.includes(t));
}

/** Claude AI 텍스트 + DB 데이터 블록 하이브리드 응답 생성 */
export async function buildResponse(
	intent: ChatIntent,
	message: string,
	userId?: string,
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
			return buildRecommendResponse(message, userProfile);

		case "compare":
			return buildCompareResponse(message, userProfile);

		case "explain":
			return buildExplainResponse(message, userProfile);

		case "status":
			return buildStatusResponse(message, userId, userProfile);

		case "checklist":
			return buildChecklistResponse(message, userId, userProfile);

		case "general":
		default:
			return buildGeneralResponse(message, userProfile);
	}
}

async function buildRecommendResponse(
	message: string,
	userProfile?: UserContext,
): Promise<{ content: string; blocks: ChatBlock[] }> {
	try {
		const region = extractRegion(message);
		const type = extractFacilityType(message);
		const filter: Record<string, unknown> = {};
		if (region.sido) filter["region.sido"] = region.sido;
		if (region.sigungu) filter["region.sigungu"] = region.sigungu;
		if (type) filter.type = type;

		// Use user's region as fallback
		if (!region.sido && userProfile?.region?.sido) {
			filter["region.sido"] = userProfile.region.sido;
			filter["region.sigungu"] = userProfile.region.sigungu;
		}

		const facilities = await Facility.find(filter)
			.sort({ reviewCount: -1, updatedAt: -1 })
			.limit(5)
			.lean();

		if (facilities.length === 0) {
			const aiResponse = await generateChatResponse(message, {
				userProfile,
				intent: "recommend",
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
		});

		const regionLabel = region.sigungu || userProfile?.region?.sigungu || "주변";
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
): Promise<{ content: string; blocks: ChatBlock[] }> {
	try {
		const region = extractRegion(message);
		const filter: Record<string, unknown> = {};
		if (region.sigungu) {
			filter["region.sido"] = region.sido;
			filter["region.sigungu"] = region.sigungu;
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
): Promise<{ content: string; blocks: ChatBlock[] }> {
	// Try to find a specific facility by name
	const facilities = await Facility.find({
		$text: { $search: message },
	})
		.limit(1)
		.lean()
		.catch(() => []);

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
): Promise<{ content: string; blocks: ChatBlock[] }> {
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
				const facility = w.facilityId as unknown as {
					name: string;
					status: string;
				};
				statusInfo += `- ${facility?.name || "시설"}: ${w.status === "pending" ? "대기 중" : w.status}${w.position ? ` (${w.position}번째)` : ""}\n`;
			}
		}
		statusInfo += `\n관심시설 ${interests.length}곳 등록됨`;

		const aiResponse = await generateChatResponse(message, {
			userProfile,
			intent: "status",
			statusInfo,
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
): Promise<{ content: string; blocks: ChatBlock[] }> {
	const aiResponse = await generateChatResponse(message, { userProfile, intent: "general" });

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
): Promise<{ content: string; blocks: ChatBlock[] }> {
	try {
		// Try to find a facility the user is asking about
		let facility = null;
		const facilities = await Facility.find({
			$text: { $search: message },
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
			{ userProfile, intent: "checklist" },
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

function fallbackResponse(
	content: string,
): { content: string; blocks: ChatBlock[] } {
	return {
		content,
		blocks: [{ type: "text", content }],
	};
}
