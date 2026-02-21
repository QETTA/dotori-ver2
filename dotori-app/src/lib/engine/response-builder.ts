import type { ChatBlock, ChildProfile } from "@/types/dotori";
import { type ChatIntent } from "./intent-classifier";
import Facility from "@/models/Facility";
import User from "@/models/User";
import Waitlist from "@/models/Waitlist";
import { toFacilityDTO, toChildProfile } from "@/lib/dto";
import dbConnect from "@/lib/db";
import { generateChatResponse } from "@/lib/ai/claude";
import { generateChecklist } from "./report-engine";

export interface ConversationContext {
	previousMessages?: { role: string; content: string }[];
	mentionedFacilityIds?: string[];
	mentionedFacilityNames?: string[];
	establishedRegion?: {
		sido?: string;
		sigungu?: string;
		confidence?: number;
	};
	establishedFacilityType?: string;
}

type UserContext = {
	nickname?: string;
	children?: Array<{ name: string; birthDate: string }>;
	region?: { sido: string; sigungu: string };
};

type TransferScenario =
	| "반편성"
	| "교사교체"
	| "설명회실망"
	| "국공립당첨"
	| "이사예정"
	| "일반";

const transferScenarioEmpathy: Record<TransferScenario, string> = {
	반편성: "반편성 결과가 실망스러우셨군요. 이동 골든타임은 3월 초예요...",
	교사교체: "교사 교체 후 불안한 마음이 드실 수 있어요...",
	설명회실망:
		"설명회에서 기대와 다르게 느껴져 많이 당황스럽고 실망스러우셨겠어요. 일단 지금 상황을 다시 한 번 차분히 정리해봐요.",
	국공립당첨:
		"국공립 당첨 축하해요! 현재 시설과 비교해볼게요..."
	,	이사예정:
		"이사 예정이라 생활권 변화가 커서 걱정이 클 거예요. 이동 준비를 같이 정리해드릴게요.",
	일반:
		"어린이집 이동 고민이 크시겠어요. 이동 이유를 먼저 파악하고, 지역·우선순위·시기까지 같이 확인해 다음 단계를 잡아드릴게요.",
};

function detectTransferScenario(message: string): TransferScenario {
	const lower = message.toLowerCase();
	if (lower.includes("반편성") || lower.includes("반 배정") || lower.includes("같은 반") || lower.includes("친한 친구")) {
		return "반편성";
	}
	if (lower.includes("선생님 바뀌") || lower.includes("교사 교체") || lower.includes("담임 바뀌")) {
		return "교사교체";
	}
	if (lower.includes("설명회") || lower.includes("원장 태도") || lower.includes("시설이 낡")) {
		return "설명회실망";
	}
	if (lower.includes("국공립 당첨") || lower.includes("대기 당첨") || lower.includes("연락 왔")) {
		return "국공립당첨";
	}
	if (
		lower.includes("이사") ||
		lower.includes("이사 예정") ||
		lower.includes("통원 거리")
	) {
		return "이사예정";
	}
	return "일반";
}

type RegionMatch = { sido: string; sigungu: string; confidence: number };
type ExtractedRegion = { sido?: string; sigungu?: string; confidence: number };

function extractRegion(message: string): ExtractedRegion {
	// Phase 1: sigungu-level matching (specific district/city → sido + sigungu)
	const sigunguMap: Array<[string, RegionMatch]> = [
		// 서울 25구
		["강남", { sido: "서울특별시", sigungu: "강남구", confidence: 0.99 }],
		["서초", { sido: "서울특별시", sigungu: "서초구", confidence: 0.99 }],
		["송파", { sido: "서울특별시", sigungu: "송파구", confidence: 0.99 }],
		["강동", { sido: "서울특별시", sigungu: "강동구", confidence: 0.99 }],
		["마포", { sido: "서울특별시", sigungu: "마포구", confidence: 0.99 }],
		["용산", { sido: "서울특별시", sigungu: "용산구", confidence: 0.99 }],
		["성동", { sido: "서울특별시", sigungu: "성동구", confidence: 0.99 }],
		["광진", { sido: "서울특별시", sigungu: "광진구", confidence: 0.99 }],
		["동대문", { sido: "서울특별시", sigungu: "동대문구", confidence: 0.99 }],
		["중랑", { sido: "서울특별시", sigungu: "중랑구", confidence: 0.99 }],
		["영등포", { sido: "서울특별시", sigungu: "영등포구", confidence: 0.99 }],
		["관악", { sido: "서울특별시", sigungu: "관악구", confidence: 0.99 }],
		["동작", { sido: "서울특별시", sigungu: "동작구", confidence: 0.99 }],
		["강서", { sido: "서울특별시", sigungu: "강서구", confidence: 0.99 }],
		["양천", { sido: "서울특별시", sigungu: "양천구", confidence: 0.99 }],
		["구로", { sido: "서울특별시", sigungu: "구로구", confidence: 0.99 }],
		["금천", { sido: "서울특별시", sigungu: "금천구", confidence: 0.99 }],
		["종로", { sido: "서울특별시", sigungu: "종로구", confidence: 0.99 }],
		["성북", { sido: "서울특별시", sigungu: "성북구", confidence: 0.99 }],
		["강북", { sido: "서울특별시", sigungu: "강북구", confidence: 0.99 }],
		["도봉", { sido: "서울특별시", sigungu: "도봉구", confidence: 0.99 }],
		["노원", { sido: "서울특별시", sigungu: "노원구", confidence: 0.99 }],
		["은평", { sido: "서울특별시", sigungu: "은평구", confidence: 0.99 }],
		["서대문", { sido: "서울특별시", sigungu: "서대문구", confidence: 0.99 }],
		["중구", { sido: "서울특별시", sigungu: "중구", confidence: 0.99 }],
		// 경기 주요 20시
		["분당구", { sido: "경기도", sigungu: "성남시 분당구", confidence: 0.98 }],
		["일산동", { sido: "경기도", sigungu: "일산동구", confidence: 0.98 }],
		["일산서", { sido: "경기도", sigungu: "일산서구", confidence: 0.98 }],
		["분당", { sido: "경기도", sigungu: "성남시 분당구", confidence: 0.95 }],
		["일산", { sido: "경기도", sigungu: "고양시 일산동구", confidence: 0.9 }],
		["판교", { sido: "경기도", sigungu: "성남시", confidence: 0.9 }],
		["성남", { sido: "경기도", sigungu: "성남시", confidence: 0.9 }],
		["수원", { sido: "경기도", sigungu: "수원시", confidence: 0.9 }],
		["용인", { sido: "경기도", sigungu: "용인시", confidence: 0.9 }],
		["고양", { sido: "경기도", sigungu: "고양시", confidence: 0.9 }],
		["화성", { sido: "경기도", sigungu: "화성시", confidence: 0.9 }],
		["부천", { sido: "경기도", sigungu: "부천시", confidence: 0.9 }],
		["안산", { sido: "경기도", sigungu: "안산시", confidence: 0.9 }],
		["안양", { sido: "경기도", sigungu: "안양시", confidence: 0.9 }],
		["남양주", { sido: "경기도", sigungu: "남양주시", confidence: 0.9 }],
		["의정부", { sido: "경기도", sigungu: "의정부시", confidence: 0.9 }],
		["시흥", { sido: "경기도", sigungu: "시흥시", confidence: 0.9 }],
		["파주", { sido: "경기도", sigungu: "파주시", confidence: 0.9 }],
		["김포", { sido: "경기도", sigungu: "김포시", confidence: 0.9 }],
		["광명", { sido: "경기도", sigungu: "광명시", confidence: 0.9 }],
		["하남", { sido: "경기도", sigungu: "하남시", confidence: 0.9 }],
		["군포", { sido: "경기도", sigungu: "군포시", confidence: 0.9 }],
		["오산", { sido: "경기도", sigungu: "오산시", confidence: 0.9 }],
		["이천", { sido: "경기도", sigungu: "이천시", confidence: 0.9 }],
		["평택", { sido: "경기도", sigungu: "평택시", confidence: 0.9 }],
		["광주시", { sido: "경기도", sigungu: "광주시", confidence: 0.9 }],
		["동탄", { sido: "경기도", sigungu: "화성시", confidence: 0.9 }],
		["포천", { sido: "경기도", sigungu: "포천시", confidence: 0.9 }],
		["양주", { sido: "경기도", sigungu: "양주시", confidence: 0.9 }],
		["구리", { sido: "경기도", sigungu: "구리시", confidence: 0.9 }],
		["의왕", { sido: "경기도", sigungu: "의왕시", confidence: 0.9 }],
		["과천", { sido: "경기도", sigungu: "과천시", confidence: 0.9 }],
		["연천", { sido: "경기도", sigungu: "연천군", confidence: 0.9 }],
		["가평", { sido: "경기도", sigungu: "가평군", confidence: 0.9 }],
		["양평", { sido: "경기도", sigungu: "양평군", confidence: 0.9 }],
		["여주", { sido: "경기도", sigungu: "여주시", confidence: 0.9 }],
		["안성", { sido: "경기도", sigungu: "안성시", confidence: 0.9 }],
		// 부산 주요 구
		["해운대", { sido: "부산광역시", sigungu: "해운대구", confidence: 0.95 }],
		["수영", { sido: "부산광역시", sigungu: "수영구", confidence: 0.95 }],
		["연제", { sido: "부산광역시", sigungu: "연제구", confidence: 0.95 }],
		["부산진", { sido: "부산광역시", sigungu: "부산진구", confidence: 0.95 }],
		["사하", { sido: "부산광역시", sigungu: "사하구", confidence: 0.95 }],
		["금정", { sido: "부산광역시", sigungu: "금정구", confidence: 0.95 }],
		// 대구 주요 구
		["수성", { sido: "대구광역시", sigungu: "수성구", confidence: 0.95 }],
		["달서", { sido: "대구광역시", sigungu: "달서구", confidence: 0.95 }],
		// 인천 주요 구
		["미추홀", { sido: "인천광역시", sigungu: "미추홀구", confidence: 0.95 }],
		["연수", { sido: "인천광역시", sigungu: "연수구", confidence: 0.95 }],
		["부평", { sido: "인천광역시", sigungu: "부평구", confidence: 0.95 }],
		["남동", { sido: "인천광역시", sigungu: "남동구", confidence: 0.95 }],
		["송도", { sido: "인천광역시", sigungu: "연수구", confidence: 0.9 }],
		["청라", { sido: "인천광역시", sigungu: "서구", confidence: 0.9 }],
		// 대전 주요 구
		["대전 유성구", { sido: "대전광역시", sigungu: "유성구", confidence: 0.99 }],
		["대전 서구", { sido: "대전광역시", sigungu: "서구", confidence: 0.99 }],
		["대전 동구", { sido: "대전광역시", sigungu: "동구", confidence: 0.99 }],
		["대전 중구", { sido: "대전광역시", sigungu: "중구", confidence: 0.99 }],
		["대전 대덕구", { sido: "대전광역시", sigungu: "대덕구", confidence: 0.99 }],
		["유성구", { sido: "대전광역시", sigungu: "유성구", confidence: 0.9 }],
		["유성", { sido: "대전광역시", sigungu: "유성구", confidence: 0.9 }],
		// 광주 주요 구
		["광주 동구", { sido: "광주광역시", sigungu: "동구", confidence: 0.99 }],
		["광주 서구", { sido: "광주광역시", sigungu: "서구", confidence: 0.99 }],
		["광주 남구", { sido: "광주광역시", sigungu: "남구", confidence: 0.99 }],
		["광주 북구", { sido: "광주광역시", sigungu: "북구", confidence: 0.99 }],
		["광주 광산구", { sido: "광주광역시", sigungu: "광산구", confidence: 0.99 }],
		["광산", { sido: "광주광역시", sigungu: "광산구", confidence: 0.9 }],
		// 울산 주요 구
		["울산 중구", { sido: "울산광역시", sigungu: "중구", confidence: 0.99 }],
		["울산 남구", { sido: "울산광역시", sigungu: "남구", confidence: 0.99 }],
		["울산 동구", { sido: "울산광역시", sigungu: "동구", confidence: 0.99 }],
		["울산 북구", { sido: "울산광역시", sigungu: "북구", confidence: 0.99 }],
		["울산 울주군", { sido: "울산광역시", sigungu: "울주군", confidence: 0.99 }],
		// 강원도 주요 시
		["춘천", { sido: "강원특별자치도", sigungu: "춘천시", confidence: 0.9 }],
		["원주", { sido: "강원특별자치도", sigungu: "원주시", confidence: 0.9 }],
		["강릉", { sido: "강원특별자치도", sigungu: "강릉시", confidence: 0.9 }],
		["동해", { sido: "강원특별자치도", sigungu: "동해시", confidence: 0.9 }],
		["속초", { sido: "강원특별자치도", sigungu: "속초시", confidence: 0.9 }],
		["태백", { sido: "강원특별자치도", sigungu: "태백시", confidence: 0.9 }],
		["삼척", { sido: "강원특별자치도", sigungu: "삼척시", confidence: 0.9 }],
		["평창", { sido: "강원특별자치도", sigungu: "평창군", confidence: 0.9 }],
		// 충청북도 주요 시
		["청주", { sido: "충청북도", sigungu: "청주시", confidence: 0.9 }],
		["충주", { sido: "충청북도", sigungu: "충주시", confidence: 0.9 }],
		["제천", { sido: "충청북도", sigungu: "제천시", confidence: 0.9 }],
		["음성", { sido: "충청북도", sigungu: "음성군", confidence: 0.9 }],
		// 충청남도 주요 시
		["천안", { sido: "충청남도", sigungu: "천안시", confidence: 0.9 }],
		["아산", { sido: "충청남도", sigungu: "아산시", confidence: 0.9 }],
		["당진", { sido: "충청남도", sigungu: "당진시", confidence: 0.9 }],
		["서산", { sido: "충청남도", sigungu: "서산시", confidence: 0.9 }],
		["논산", { sido: "충청남도", sigungu: "논산시", confidence: 0.9 }],
		["공주", { sido: "충청남도", sigungu: "공주시", confidence: 0.9 }],
		["보령", { sido: "충청남도", sigungu: "보령시", confidence: 0.9 }],
		["홍성", { sido: "충청남도", sigungu: "홍성군", confidence: 0.9 }],
		["예산", { sido: "충청남도", sigungu: "예산군", confidence: 0.9 }],
		// 전북 주요 시
		["전주", { sido: "전북특별자치도", sigungu: "전주시", confidence: 0.9 }],
		["군산", { sido: "전북특별자치도", sigungu: "군산시", confidence: 0.9 }],
		["익산", { sido: "전북특별자치도", sigungu: "익산시", confidence: 0.9 }],
		["정읍", { sido: "전북특별자치도", sigungu: "정읍시", confidence: 0.9 }],
		["남원", { sido: "전북특별자치도", sigungu: "남원시", confidence: 0.9 }],
		["김제", { sido: "전북특별자치도", sigungu: "김제시", confidence: 0.9 }],
		// 전남 주요 시
		["목포", { sido: "전라남도", sigungu: "목포시", confidence: 0.9 }],
		["여수", { sido: "전라남도", sigungu: "여수시", confidence: 0.9 }],
		["순천", { sido: "전라남도", sigungu: "순천시", confidence: 0.9 }],
		["광양", { sido: "전라남도", sigungu: "광양시", confidence: 0.9 }],
		["나주", { sido: "전라남도", sigungu: "나주시", confidence: 0.9 }],
		["무안", { sido: "전라남도", sigungu: "무안군", confidence: 0.9 }],
		["해남", { sido: "전라남도", sigungu: "해남군", confidence: 0.9 }],
		["화순", { sido: "전라남도", sigungu: "화순군", confidence: 0.9 }],
		// 경북 주요 시
		["포항", { sido: "경상북도", sigungu: "포항시", confidence: 0.9 }],
		["경주", { sido: "경상북도", sigungu: "경주시", confidence: 0.9 }],
		["구미", { sido: "경상북도", sigungu: "구미시", confidence: 0.9 }],
		["안동", { sido: "경상북도", sigungu: "안동시", confidence: 0.9 }],
		["영주", { sido: "경상북도", sigungu: "영주시", confidence: 0.9 }],
		["영천", { sido: "경상북도", sigungu: "영천시", confidence: 0.9 }],
		["상주", { sido: "경상북도", sigungu: "상주시", confidence: 0.9 }],
		// 경남 주요 시
		["창원", { sido: "경상남도", sigungu: "창원시", confidence: 0.9 }],
		["김해", { sido: "경상남도", sigungu: "김해시", confidence: 0.9 }],
		["진주", { sido: "경상남도", sigungu: "진주시", confidence: 0.9 }],
		["양산", { sido: "경상남도", sigungu: "양산시", confidence: 0.9 }],
		["통영", { sido: "경상남도", sigungu: "통영시", confidence: 0.9 }],
		["사천", { sido: "경상남도", sigungu: "사천시", confidence: 0.9 }],
		["거제", { sido: "경상남도", sigungu: "거제시", confidence: 0.9 }],
		// 제주
		["제주", { sido: "제주특별자치도", sigungu: "제주시", confidence: 0.75 }],
		["제주시", { sido: "제주특별자치도", sigungu: "제주시", confidence: 0.95 }],
		["서귀포", { sido: "제주특별자치도", sigungu: "서귀포시", confidence: 0.95 }],
		["세종", { sido: "세종특별자치시", sigungu: "", confidence: 0.98 }],
		// 남구, 서구, 중구 제외 — 여러 시도에 중복
	];

	for (const [key, value] of sigunguMap) {
		if (message.includes(key)) {
			return value;
		}
	}

	// Phase 2: sido-level matching (시도 약칭 → sido only)
	const sidoMap: Array<[string, string]> = [
		["서울", "서울특별시"],
		["부산", "부산광역시"],
		["대구", "대구광역시"],
		["인천", "인천광역시"],
		["광주", "광주광역시"],
		["대전", "대전광역시"],
		["울산", "울산광역시"],
		["세종", "세종특별자치시"],
		["세종시", "세종특별자치시"],
		["경기", "경기도"],
		["강원", "강원특별자치도"],
		["강원도", "강원특별자치도"],
		["충북", "충청북도"],
		["충청북도", "충청북도"],
		["충남", "충청남도"],
		["충청남도", "충청남도"],
		["전북", "전북특별자치도"],
		["전북특별자치도", "전북특별자치도"],
		["전남", "전라남도"],
		["전라남도", "전라남도"],
		["경북", "경상북도"],
		["경상북도", "경상북도"],
		["경남", "경상남도"],
		["경상남도", "경상남도"],
		["제주", "제주특별자치도"],
		["제주도", "제주특별자치도"],
	];
	const sidoOnlyFallback = new Set(["인천", "대구", "대전", "광주", "울산"]);

	for (const [key, value] of sidoMap) {
		if (message.includes(key)) {
			return {
				sido: value,
				sigungu: sidoOnlyFallback.has(key) ? "" : undefined,
				confidence: 0.7,
			};
		}
	}

	return { confidence: 0 };
}

function extractFacilityType(message: string): string | undefined {
	const types = ["국공립", "민간", "가정", "직장", "협동", "사회복지"];
	return types.find((t) => message.includes(t));
}

export function extractConversationContext(
	messages: { role: string; content: string; blocks?: unknown[] }[],
): ConversationContext {
	const mentionedFacilityIds: string[] = [];
	const mentionedFacilityNames: string[] = [];
	let establishedRegion: ExtractedRegion | undefined;
	let establishedFacilityType: string | undefined;

	for (const msg of messages) {
		if (msg.role === "user") {
			const region = extractRegion(msg.content);
			if (region.sigungu || region.sido) {
				establishedRegion = region;
			}
			const type = extractFacilityType(msg.content);
			if (type) establishedFacilityType = type;
		}
		if (msg.role === "assistant" && Array.isArray(msg.blocks)) {
			for (const block of msg.blocks as {
				type: string;
				facilities?: { id: string; name: string }[];
				markers?: { id: string }[];
			}[]) {
				if (block.type === "facility_list" || block.type === "compare") {
					for (const f of block.facilities ?? []) {
						if (f.id && !mentionedFacilityIds.includes(f.id)) {
							mentionedFacilityIds.push(f.id);
						}
						if (f.name && !mentionedFacilityNames.includes(f.name)) {
							mentionedFacilityNames.push(f.name);
						}
					}
				}
				if (block.type === "map") {
					for (const m of block.markers ?? []) {
						if (m.id && !mentionedFacilityIds.includes(m.id)) {
							mentionedFacilityIds.push(m.id);
						}
					}
				}
			}
		}
	}

	return {
		mentionedFacilityIds: mentionedFacilityIds.slice(-15),
		mentionedFacilityNames,
		establishedRegion:
			establishedRegion && (establishedRegion.sido || establishedRegion.sigungu)
				? establishedRegion
				: undefined,
		establishedFacilityType,
	};
}

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
		$text: { $search: message },
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
