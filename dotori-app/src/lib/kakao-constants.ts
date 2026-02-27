/**
 * 카카오 관련 상수 중앙 관리
 * 하드코딩된 채널 ID, URL 등을 한 곳에서 관리
 */

/** 카카오톡 채널 ID (도토리 공식) */
export const KAKAO_CHANNEL_ID =
	process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID || "_dotori";

/** 카카오톡 채널 URL */
export const KAKAO_CHANNEL_URL =
	`https://pf.kakao.com/${KAKAO_CHANNEL_ID}` as const;

/** 카카오톡 채널 채팅 URL */
export const KAKAO_CHANNEL_CHAT_URL =
	`https://pf.kakao.com/${KAKAO_CHANNEL_ID}/chat` as const;

/** 카카오 JavaScript SDK 앱키 */
export const KAKAO_JS_KEY =
	process.env.NEXT_PUBLIC_KAKAO_JS_KEY || "";

/** 카카오 공유 기본 설정 */
export const KAKAO_SHARE_DEFAULTS = {
	/** 웹 URL (도토리 앱) */
	webUrl: process.env.NEXT_PUBLIC_APP_URL || "https://dotori.app",
	/** 공유 이미지 기본 크기 */
	imageWidth: 800,
	imageHeight: 400,
} as const;
