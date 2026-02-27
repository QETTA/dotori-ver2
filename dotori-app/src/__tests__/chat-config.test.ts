import { describe, expect, it } from "vitest";
import {
	FREE_PLAN_CHAT_LIMIT,
	parseUsageResponse,
} from "@/app/(app)/chat/_lib/chat-config";

describe("parseUsageResponse", () => {
	it("parses current usage payload shape", () => {
		const parsed = parseUsageResponse(
			{
				chat: 3,
				limits: {
					free: { chat: 5 },
					premium: { chat: -1 },
				},
			},
			FREE_PLAN_CHAT_LIMIT,
		);

		expect(parsed).toEqual({ count: 3, limit: 5 });
	});

	it("parses legacy nested payload shape", () => {
		const parsed = parseUsageResponse(
			{
				data: {
					count: "4",
					limit: "7",
				},
			},
			FREE_PLAN_CHAT_LIMIT,
		);

		expect(parsed).toEqual({ count: 4, limit: 7 });
	});

	it("prioritizes chat over count and used values", () => {
		const parsed = parseUsageResponse(
			{
				data: {
					chat: "6",
					count: 3,
					used: 2,
				},
				limits: { free: { chat: 9 } },
			},
			FREE_PLAN_CHAT_LIMIT,
		);

		expect(parsed).toEqual({ count: 6, limit: 9 });
	});

	it("normalizes negative and decimal values", () => {
		const parsed = parseUsageResponse(
			{
				data: {
					chat: -2.9,
					limits: { free: { chat: 2.7 } },
				},
			},
			FREE_PLAN_CHAT_LIMIT,
		);

		expect(parsed).toEqual({ count: 0, limit: 2 });
	});

	it("falls back safely for invalid payloads", () => {
		expect(parseUsageResponse(null, FREE_PLAN_CHAT_LIMIT)).toEqual({
			count: 0,
			limit: FREE_PLAN_CHAT_LIMIT,
		});
		expect(
			parseUsageResponse({ data: { chat: "abc" } }, FREE_PLAN_CHAT_LIMIT),
		).toEqual({
			count: 0,
			limit: FREE_PLAN_CHAT_LIMIT,
		});
	});
});
