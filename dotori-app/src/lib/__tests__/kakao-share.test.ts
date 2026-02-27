import { describe, it, expect, vi, beforeEach } from "vitest";
import { shareViaKakao, initKakaoSDK, type ShareParams } from "../kakao-share";

const mockSendDefault = vi.fn();

function setupKakaoMock(initialized = true) {
	Object.defineProperty(globalThis, "window", {
		value: {
			Kakao: {
				isInitialized: () => initialized,
				init: vi.fn(),
				Share: { sendDefault: mockSendDefault },
				Channel: { addChannel: vi.fn(), chat: vi.fn(), followChannel: vi.fn(), createAddChannelButton: vi.fn(), createChatButton: vi.fn() },
				Auth: { authorize: vi.fn(), setAccessToken: vi.fn(), getAccessToken: vi.fn(), logout: vi.fn() },
				cleanup: vi.fn(),
			},
		},
		writable: true,
		configurable: true,
	});
}

function clearKakaoMock() {
	Object.defineProperty(globalThis, "window", {
		value: undefined,
		writable: true,
		configurable: true,
	});
}

const baseParams: ShareParams = {
	title: "도토리 테스트 시설",
	description: "서울특별시 강남구 어린이집",
	linkUrl: "https://dotori.app/facility/123",
};

describe("kakao-share", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		clearKakaoMock();
	});

	describe("initKakaoSDK", () => {
		it("returns false when window is undefined (SSR)", () => {
			expect(initKakaoSDK()).toBe(false);
		});

		it("returns true when already initialized", () => {
			setupKakaoMock(true);
			expect(initKakaoSDK()).toBe(true);
		});
	});

	describe("shareViaKakao", () => {
		it("uses Kakao SDK when available", async () => {
			setupKakaoMock(true);
			const result = await shareViaKakao(baseParams);
			expect(result).toEqual({ method: "kakao", success: true });
			expect(mockSendDefault).toHaveBeenCalledOnce();
		});

		it("falls back to clipboard when Kakao and WebShare unavailable", async () => {
			const writeText = vi.fn().mockResolvedValue(undefined);
			Object.defineProperty(globalThis, "navigator", {
				value: { clipboard: { writeText } },
				writable: true,
				configurable: true,
			});
			const result = await shareViaKakao(baseParams);
			expect(result).toEqual({ method: "clipboard", success: true });
			expect(writeText).toHaveBeenCalledWith(baseParams.linkUrl);
		});

		it("returns failure when all methods fail", async () => {
			// Ensure no clipboard or share API available
			Object.defineProperty(globalThis, "navigator", {
				value: {},
				writable: true,
				configurable: true,
			});
			const result = await shareViaKakao(baseParams);
			expect(result.success).toBe(false);
			expect(result.method).toBe("none");
		});
	});
});
