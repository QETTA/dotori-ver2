import { describe, it, expect } from "vitest";
import {
	KAKAO_CHANNEL_ID,
	KAKAO_CHANNEL_URL,
	KAKAO_CHANNEL_CHAT_URL,
	KAKAO_SHARE_DEFAULTS,
} from "../kakao-constants";

describe("kakao-constants", () => {
	it("KAKAO_CHANNEL_ID has default value", () => {
		expect(KAKAO_CHANNEL_ID).toBeTruthy();
		expect(typeof KAKAO_CHANNEL_ID).toBe("string");
	});

	it("KAKAO_CHANNEL_URL includes channel ID", () => {
		expect(KAKAO_CHANNEL_URL).toContain("pf.kakao.com");
		expect(KAKAO_CHANNEL_URL).toContain(KAKAO_CHANNEL_ID);
	});

	it("KAKAO_CHANNEL_CHAT_URL ends with /chat", () => {
		expect(KAKAO_CHANNEL_CHAT_URL).toMatch(/\/chat$/);
	});

	it("KAKAO_SHARE_DEFAULTS has required fields", () => {
		expect(KAKAO_SHARE_DEFAULTS.webUrl).toBeTruthy();
		expect(KAKAO_SHARE_DEFAULTS.imageWidth).toBeGreaterThan(0);
		expect(KAKAO_SHARE_DEFAULTS.imageHeight).toBeGreaterThan(0);
	});
});
