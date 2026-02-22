import type {
	ConversationContext,
	ExtractedRegion,
	RegionMatch,
	TransferScenario,
} from "./types";

export const transferScenarioEmpathy: Record<TransferScenario, string> = {
	반편성: "반편성 결과가 실망스러우셨군요. 이동 골든타임은 3월 초예요...",
	교사교체: "교사 교체 후 불안한 마음이 드실 수 있어요...",
	설명회실망:
		"설명회에서 기대와 다르게 느껴져 많이 당황스럽고 실망스러우셨겠어요. 일단 지금 상황을 다시 한 번 차분히 정리해봐요.",
	국공립당첨:
		"국공립 당첨 축하해요! 현재 시설과 비교해볼게요...",
	이사예정:
		"이사 예정이라 생활권 변화가 커서 걱정이 클 거예요. 이동 준비를 같이 정리해드릴게요.",
	일반:
		"어린이집 이동 고민이 크시겠어요. 이동 이유를 먼저 파악하고, 지역·우선순위·시기까지 같이 확인해 다음 단계를 잡아드릴게요.",
};

export function detectTransferScenario(message: string): TransferScenario {
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

export function sanitizeSearchQuery(query: string): string {
	return query
		.replace(/["'\\]/g, "")
		.replace(/[-~]/g, " ")
		.trim()
		.slice(0, 200);
}

export function extractRegion(message: string): ExtractedRegion {
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

export function extractFacilityType(message: string): string | undefined {
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
