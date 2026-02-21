import { describe, expect, it } from "@jest/globals";
import { classifyIntent, type ChatIntent } from "@/lib/engine/intent-classifier";

describe("classifyIntent", () => {
	const scenarios: Array<{ message: string; expected: ChatIntent[] }> = [
		{ message: "이동하고 싶어요", expected: ["transfer"] },
		{ message: "반편성이 맘에 안들어요", expected: ["transfer"] },
		{ message: "선생님이 또 바뀌었어요", expected: ["transfer"] },
		{ message: "국공립 대기 당첨됐어요", expected: ["transfer"] },
		{ message: "강남구 어린이집 추천해줘", expected: ["recommend"] },
		{
			message: "반편성 결과가 너무 실망스러워요",
			expected: ["transfer"],
		},
		{
			message: "교사가 또 바뀌었어요 너무 불안해",
			expected: ["transfer", "general"],
		},
		{
			message: "강남구 국공립 빈자리 있어요?",
			// 빈자리를 찾는 질의는 추천/시설 탐색 의도로도 쓰입니다.
			expected: ["recommend", "status"],
		},
		{
			message: "입소 서류 어떻게 준비하나요?",
			expected: ["checklist"],
		},
	];

	it.each(scenarios)(`%s`, ({ message, expected }) => {
		expect(expected).toContain(classifyIntent(message));
	});
});
