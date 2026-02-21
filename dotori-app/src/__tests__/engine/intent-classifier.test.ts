import { describe, expect, it } from "@jest/globals";
import { classifyIntent, type ChatIntent } from "@/lib/engine/intent-classifier";

describe("classifyIntent", () => {
	const scenarios: Array<{ message: string; expected: ChatIntent[] }> = [
		{ message: "이동하고 싶어요", expected: ["transfer"] },
		{ message: "반편성이 맘에 안들어요", expected: ["transfer"] },
		{ message: "선생님이 또 바뀌었어요", expected: ["transfer"] },
		{ message: "국공립 대기 당첨됐어요", expected: ["transfer"] },
		{ message: "강남구 어린이집 추천해줘", expected: ["recommend"] },
		{ message: "A와 B 시설 비교해줘", expected: ["compare"] },
		{ message: "국공립 대기 신청 방법 알려줘", expected: ["knowledge"] },
		{ message: "반편성 결과 실망", expected: ["transfer"] },
		{ message: "교사 바뀌었어요", expected: ["transfer", "general"] },
		{ message: "강남구 빈자리", expected: ["recommend", "status"] },
		{ message: "서류 준비 어떻게 해?", expected: ["knowledge", "checklist"] },
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

	it("returns general for empty input", () => {
		expect(classifyIntent("")).toBe("general");
	});

	it("returns general for emoji-only input", () => {
		expect(classifyIntent("🍼👶✨")).toBe("general");
	});

	it("classifies very long recommendation sentence without crashing", () => {
		const longMessage =
			"요즘 아이가 어린이집에서 보내는 시간이 길어져서 프로그램과 교사 안정성, 통원 동선까지 전부 다시 보고 싶은데 여러 요소를 종합해서 우리 동네에서 추천할 만한 곳을 자세히 알려주세요.";
		expect(classifyIntent(longMessage)).toBe("recommend");
	});

	it("classifies mixed transfer/recommend intent into supported high-priority intent", () => {
		const mixedIntent = "반편성도 맘에 안 들고 국공립 빈자리도 보고 싶어요";
		expect(["transfer", "recommend"]).toContain(classifyIntent(mixedIntent));
	});
});
