export type ChatIntent =
	| "recommend"
	| "compare"
	| "explain"
	| "status"
	| "checklist"
	| "general";

type WeightedKeyword = { word: string; weight: number };

const keywords: Record<ChatIntent, WeightedKeyword[]> = {
	recommend: [
		{ word: "추천", weight: 2 },
		{ word: "찾아", weight: 2 },
		{ word: "찾기", weight: 2 },
		{ word: "검색", weight: 2 },
		{ word: "어떤", weight: 1 },
		{ word: "좋은", weight: 2 },
		{ word: "근처", weight: 1 },
		{ word: "가까운", weight: 1 },
		{ word: "동네", weight: 1 },
		{ word: "우리", weight: 1 },
		{ word: "주변", weight: 1 },
		{ word: "알아보", weight: 1 },
		{ word: "알려주", weight: 1 },
	],
	compare: [
		{ word: "비교", weight: 2 },
		{ word: "차이", weight: 2 },
		{ word: "vs", weight: 2 },
		{ word: "어디가", weight: 1 },
		{ word: "뭐가 나아", weight: 2 },
		{ word: "더 좋", weight: 1 },
		{ word: "리포트", weight: 2 },
		{ word: "다른점", weight: 2 },
	],
	explain: [
		{ word: "뭐야", weight: 2 },
		{ word: "알려줘", weight: 1 },
		{ word: "설명", weight: 2 },
		{ word: "어떻게", weight: 1 },
		{ word: "뭔가요", weight: 2 },
		{ word: "정보", weight: 1 },
		{ word: "특징", weight: 1 },
		{ word: "프로그램", weight: 1 },
		{ word: "평가", weight: 1 },
		{ word: "장단점", weight: 1 },
		{ word: "장점", weight: 1 },
		{ word: "단점", weight: 1 },
		{ word: "리뷰", weight: 1 },
		{ word: "후기", weight: 1 },
		{ word: "비용", weight: 1 },
		{ word: "보육료", weight: 1 },
	],
	status: [
		{ word: "대기", weight: 2 },
		{ word: "순번", weight: 2 },
		{ word: "TO", weight: 2 },
		{ word: "빈자리", weight: 1 },
		{ word: "현황", weight: 1 },
		{ word: "신청", weight: 1 },
		{ word: "상태", weight: 1 },
		{ word: "언제", weight: 1 },
	],
	checklist: [
		{ word: "준비물", weight: 2 },
		{ word: "체크리스트", weight: 2 },
		{ word: "서류", weight: 2 },
		{ word: "무엇을 준비", weight: 2 },
		{ word: "뭐 준비", weight: 2 },
		{ word: "입소 준비", weight: 2 },
		{ word: "필요한 것", weight: 2 },
		{ word: "챙겨야", weight: 2 },
	],
	general: [],
};

interface ClassifyContext {
	previousMessages?: { role: string; content: string }[];
}

export function classifyIntent(
	message: string,
	context?: ClassifyContext,
): ChatIntent {
	const scores: Record<ChatIntent, number> = {
		recommend: 0,
		compare: 0,
		explain: 0,
		status: 0,
		checklist: 0,
		general: 0,
	};

	const lower = message.toLowerCase();

	for (const [intent, weightedWords] of Object.entries(keywords) as [ChatIntent, WeightedKeyword[]][]) {
		for (const { word, weight } of weightedWords) {
			if (lower.includes(word.toLowerCase())) {
				scores[intent] += weight;
			}
		}
	}

	// Context bonus: if previous message had facility list, boost explain/compare
	if (context?.previousMessages?.length) {
		const lastAssistant = [...(context.previousMessages || [])]
			.reverse()
			.find((m) => m.role === "assistant");
		if (lastAssistant?.content.includes("어린이집")) {
			if (lower.includes("여기") || lower.includes("이거") || lower.includes("이 곳") || lower.includes("이 시설") || lower.includes("이 어린이집") || lower.includes("거기")) {
				scores.explain += 2;
			}
		}
	}

	// Tie-breaking priority (higher = wins ties over generic recommend)
	const tieBreakPriority: Record<ChatIntent, number> = {
		checklist: 5,
		compare: 4,
		status: 3,
		explain: 2,
		recommend: 1,
		general: 0,
	};

	// Find highest score (with tie-breaking)
	let best: ChatIntent = "general";
	let maxScore = 0;
	for (const [intent, score] of Object.entries(scores) as [
		ChatIntent,
		number,
	][]) {
		if (
			score > maxScore ||
			(score === maxScore && score > 0 && tieBreakPriority[intent] > tieBreakPriority[best])
		) {
			maxScore = score;
			best = intent;
		}
	}

	return best;
}
