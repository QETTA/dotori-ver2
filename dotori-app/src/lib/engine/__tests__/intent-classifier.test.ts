import { describe, expect, it } from "@jest/globals";
import type { ChatIntent } from "../intent-classifier";
import { classifyIntent } from "../intent-classifier";

describe("classifyIntent", () => {
	const scenarios: Array<{ message: string; expected: ChatIntent }> = [
		{ message: "반편성 때문에 너무 힘들어", expected: "transfer" },
		{ message: "선생님 바뀌었어", expected: "transfer" },
		{ message: "이동 가능한 곳이 있을까?", expected: "transfer" },
		{ message: "국공립 대기 당첨이 떴어", expected: "transfer" },
		{ message: "어린이집 추천해줘", expected: "recommend" },
		{ message: "강남구 국공립 추천해줘", expected: "recommend" },
		{ message: "우리 동네 근처 좋은 어린이집 알려줘", expected: "recommend" },
		{ message: "여기보다 나은 곳 추천해줘", expected: "recommend" },
		{ message: "A vs B 비교", expected: "compare" },
		{ message: "A와 B 중 어떤 게 나을까 비교해줘", expected: "compare" },
		{ message: "두 곳 차이점이 뭐가 나아?", expected: "compare" },
		{ message: "이 어린이집 뭐야?", expected: "explain" },
		{ message: "입소 대기 순번이 어떻게 되지?", expected: "status" },
		{ message: "입소 대기 현황 알려줘", expected: "status" },
		{ message: "입소 준비물 체크리스트", expected: "checklist" },
		{ message: "서류 뭐 준비해야 해?", expected: "checklist" },
		{ message: "국공립 대기 신청 방법 알려줘", expected: "knowledge" },
		{ message: "아이사랑포털에서 지원금 받는 방법", expected: "knowledge" },
		{ message: "안녕하세요", expected: "general" },
		{ message: "고마워", expected: "general" },
	];

	it.each(scenarios)(`$message`, ({ message, expected }) => {
		expect(classifyIntent(message)).toBe(expected);
	});

	it("uses context to classify explanatory deictic references", () => {
		const context = {
			previousMessages: [
				{ role: "assistant", content: "서울 강남구 어린이집 3곳을 찾았어요!" },
			],
		};
		expect(classifyIntent("여기 어떤 곳이야?", context)).toBe("explain");
	});

	it.each([
		{ message: "반편성 결과가 너무 실망스러워요", expected: "transfer" },
		{
			message: "교사가 또 바뀌었어요 너무 불안해",
			expected: ["transfer", "general"],
		},
		{
			message: "강남구 국공립 빈자리 있어요?",
			expected: ["recommend", "status"],
		},
		{
			message: "입소 서류 어떻게 준비하나요?",
			expected: "checklist",
		},
	] as const)(
		`$message`,
		({ message, expected }) => {
			const intent = classifyIntent(message);
			expect(Array.isArray(expected) ? expected : [expected]).toContain(intent);
		},
	);

	it.each([
		{
			message: "반편성 결과 실망",
			expected: ["transfer"],
		},
		{
			message: "교사 바뀌었어요",
			expected: ["transfer", "general"],
		},
		{
			message: "강남구 빈자리",
			expected: ["recommend", "status"],
		},
		{
			message: "서류 준비",
			expected: ["knowledge", "checklist"],
		},
		{
			message: "두 시설 비교해줘",
			expected: ["compare"],
		},
	] as const)(
		`matches required transfer scenarios: $message`,
		({ message, expected }) => {
			expect(expected).toContain(classifyIntent(message));
		},
	);

	it("returns general for empty input", () => {
		expect(classifyIntent("")).toBe("general");
	});

	it("returns general for emoji-only input", () => {
		expect(classifyIntent("🧸🎈😊")).toBe("general");
	});

	it("returns general for whitespace-only input", () => {
		expect(classifyIntent("   ")).toBe("general");
	});

	it("classifies a very long sentence with recommendation intent", () => {
		const message =
			"아이가 적응을 힘들어해서 교사 안정성과 통원 거리, 프로그램 균형, 급식 만족도까지 길게 비교해보고 싶고 우리 동네 기준으로 추천 가능한 어린이집을 자세히 알려주세요.";
		expect(classifyIntent(message)).toBe("recommend");
	});

	it("classifies mixed transfer and vacancy message as transfer or recommend", () => {
		const message = "반편성도 맘에 안 들고 국공립 빈자리도 보고 싶어요";
		expect(["transfer", "recommend"]).toContain(classifyIntent(message));
	});

	it("classifies uppercase VS keyword as compare", () => {
		expect(classifyIntent("A VS B 어디가 좋아?")).toBe("compare");
	});

	it("prefers checklist over knowledge when both checklist and application keywords exist", () => {
		expect(classifyIntent("국공립 신청 방법이랑 서류 뭐가 필요해?")).toBe(
			"checklist",
		);
	});

	it("prioritizes transfer over status when transfer signals are stronger", () => {
		const message = "국공립 대기 당첨됐는데 빈자리 현황도 궁금해요";
		expect(classifyIntent(message)).toBe("transfer");
	});
});
