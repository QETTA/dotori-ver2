/**
 * Analytics — 이벤트 추적 유틸리티
 * TODO: 실제 분석 플랫폼(Mixpanel/Amplitude 등) 연동 시 구현 교체
 */

/**
 * 사용자 행동 이벤트 추적
 * @param event - 이벤트 이름 (예: "filter_open", "filter_apply")
 * @param category - 이벤트 카테고리 (예: "explore", "chat")
 * @param data - 추가 메타데이터
 */
export function trackEvent(
	event: string,
	category: string,
	data?: Record<string, unknown>,
): void {
	if (process.env.NODE_ENV === "development") {
		// eslint-disable-next-line no-console
		console.debug("[analytics]", category, event, data);
	}
	// 프로덕션: window.analytics 또는 서드파티 SDK 연동 여기에 추가
}
