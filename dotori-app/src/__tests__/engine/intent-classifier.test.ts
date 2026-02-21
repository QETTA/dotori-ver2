import { describe, expect, it } from "@jest/globals";
import { classifyIntent, type ChatIntent } from "@/lib/engine/intent-classifier";

describe("classifyIntent", () => {
	const scenarios: Array<{ message: string; expected: ChatIntent }> = [
		{ message: "이동하고 싶어요", expected: "transfer" },
		{ message: "반편성이 맘에 안들어요", expected: "transfer" },
		{ message: "선생님이 또 바뀌었어요", expected: "transfer" },
		{ message: "국공립 대기 당첨됐어요", expected: "transfer" },
		{ message: "강남구 어린이집 추천해줘", expected: "recommend" },
	];

	it.each(scenarios)(`%s`, ({ message, expected }) => {
		expect(classifyIntent(message)).toBe(expected);
	});
});
