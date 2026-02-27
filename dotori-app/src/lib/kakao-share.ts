/**
 * 카카오 공유 유틸리티 (클라이언트 전용)
 *
 * 폴백 체인: Kakao SDK → Web Share API → Clipboard
 */

import { KAKAO_JS_KEY, KAKAO_SHARE_DEFAULTS } from "./kakao-constants";

export interface ShareParams {
	title: string;
	description: string;
	imageUrl?: string;
	linkUrl: string;
	buttonTitle?: string;
}

export type ShareResult =
	| { method: "kakao"; success: true }
	| { method: "webshare"; success: true }
	| { method: "clipboard"; success: true }
	| { method: "none"; success: false; error: string };

/**
 * 카카오 SDK 초기화 (idempotent)
 */
export function initKakaoSDK(): boolean {
	if (typeof window === "undefined" || !window.Kakao) return false;
	if (window.Kakao.isInitialized()) return true;
	if (!KAKAO_JS_KEY) return false;
	window.Kakao.init(KAKAO_JS_KEY);
	return window.Kakao.isInitialized();
}

/**
 * 카카오톡 공유 → Web Share API → 클립보드 폴백 체인
 */
export async function shareViaKakao(
	params: ShareParams,
): Promise<ShareResult> {
	// 1. 카카오 SDK 공유
	if (tryKakaoShare(params)) {
		return { method: "kakao", success: true };
	}

	// 2. Web Share API 폴백
	if (await tryWebShare(params)) {
		return { method: "webshare", success: true };
	}

	// 3. 클립보드 폴백
	if (await tryClipboardCopy(params.linkUrl)) {
		return { method: "clipboard", success: true };
	}

	return { method: "none", success: false, error: "모든 공유 방법이 실패했습니다" };
}

function tryKakaoShare(params: ShareParams): boolean {
	try {
		if (!initKakaoSDK()) return false;

		const link = {
			webUrl: params.linkUrl,
			mobileWebUrl: params.linkUrl,
		};

		const shareSettings: KakaoShareSettings = {
			objectType: "feed",
			content: {
				title: params.title,
				description: params.description,
				imageUrl: params.imageUrl || `${KAKAO_SHARE_DEFAULTS.webUrl}/brand/og-default.png`,
				link,
				imageWidth: KAKAO_SHARE_DEFAULTS.imageWidth,
				imageHeight: KAKAO_SHARE_DEFAULTS.imageHeight,
			},
			buttons: [
				{
					title: params.buttonTitle || "도토리에서 보기",
					link,
				},
			],
		};

		window.Kakao.Share.sendDefault(shareSettings);
		return true;
	} catch {
		return false;
	}
}

async function tryWebShare(params: ShareParams): Promise<boolean> {
	try {
		if (typeof navigator === "undefined" || !navigator.share) return false;
		await navigator.share({
			title: params.title,
			text: params.description,
			url: params.linkUrl,
		});
		return true;
	} catch {
		return false;
	}
}

async function tryClipboardCopy(url: string): Promise<boolean> {
	try {
		if (typeof navigator === "undefined" || !navigator.clipboard) return false;
		await navigator.clipboard.writeText(url);
		return true;
	} catch {
		return false;
	}
}
