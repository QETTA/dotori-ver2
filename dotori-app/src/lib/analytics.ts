/**
 * Analytics — GA4 이벤트 추적 유틸리티 (클라이언트 전용)
 */

import { API_CONFIG } from "./config/api";

/** 표준 이벤트 이름 상수 */
export const ANALYTICS_EVENTS = {
	// 시설
	facility_view: "facility_view",
	facility_compare: "facility_compare",
	facility_save: "facility_save",

	// 카카오
	kakao_share: "kakao_share",
	kakao_channel_add: "kakao_channel_add",

	// 대기 / 알림
	waitlist_join: "waitlist_join",
	alert_create: "alert_create",
	alert_delete: "alert_delete",

	// 전자서명
	esignature_create: "esignature_create",
	esignature_sign: "esignature_sign",
	esignature_submit: "esignature_submit",

	// 구독
	subscription_start: "subscription_start",
	subscription_cancel: "subscription_cancel",

	// 채팅
	chat_message: "chat_message",
	chat_action: "chat_action",

	// 커뮤니티
	post_create: "post_create",
	post_like: "post_like",
	comment_create: "comment_create",

	// 탐색
	filter_open: "filter_open",
	filter_apply: "filter_apply",
	search_query: "search_query",

	// 온보딩
	onboarding_start: "onboarding_start",
	onboarding_complete: "onboarding_complete",
} as const;

export type AnalyticsEventName =
	(typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/**
 * GA4 이벤트 추적
 * - 개발 모드: 콘솔 출력
 * - 프로덕션: window.gtag로 GA4 전송
 */
export function trackEvent(
	event: string,
	category: string,
	data?: Record<string, unknown>,
): void {
	if (API_CONFIG.ANALYTICS.devMode) {
		console.debug("[analytics]", category, event, data);
		return;
	}

	if (typeof window !== "undefined" && window.gtag) {
		window.gtag("event", event, {
			event_category: category,
			...data,
		});
	}
}

/**
 * GA4 페이지뷰 추적
 */
export function trackPageView(path: string, title?: string): void {
	if (API_CONFIG.ANALYTICS.devMode) {
		console.debug("[analytics] pageview", path, title);
		return;
	}

	if (typeof window !== "undefined" && window.gtag) {
		const config: Record<string, string | number | boolean> = {
			page_path: path,
		};
		if (title) config.page_title = title;
		window.gtag("event", "page_view", config);
	}
}
