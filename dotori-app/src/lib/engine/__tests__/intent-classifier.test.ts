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
});
