/**
 * 외부 API 서킷 브레이커 레지스트리
 *
 * 모든 외부 API 호출은 이 레지스트리의 서킷 브레이커를 통해야 함.
 * 장애 시 자동으로 fallback 반환, 복구 시 자동 재연결.
 */
import { createCircuitBreaker, type CircuitBreaker } from "@/lib/circuit-breaker";

/** 아이사랑 어린이집 정보 API */
export const isalangBreaker: CircuitBreaker = createCircuitBreaker("isalang-api", {
	failureThreshold: 3,
	resetTimeoutMs: 120_000, // 2분
});

/** 유치원알리미 API */
export const kindergartenBreaker: CircuitBreaker = createCircuitBreaker("kindergarten-api", {
	failureThreshold: 3,
	resetTimeoutMs: 120_000,
});

/** KOSIS 통계 API */
export const kosisBreaker: CircuitBreaker = createCircuitBreaker("kosis-api", {
	failureThreshold: 5,
	resetTimeoutMs: 300_000, // 5분 (통계 API는 느림)
});

/** 행안부 인구통계 API */
export const moisBreaker: CircuitBreaker = createCircuitBreaker("mois-api", {
	failureThreshold: 5,
	resetTimeoutMs: 300_000,
});

/** 모두싸인 전자서명 API */
export const modusignBreaker: CircuitBreaker = createCircuitBreaker("modusign-api", {
	failureThreshold: 3,
	resetTimeoutMs: 120_000,
});

/** 전체 서킷 브레이커 상태 조회 (헬스체크용) */
export function getAllCircuitStatus() {
	return [
		isalangBreaker.getStatus(),
		kindergartenBreaker.getStatus(),
		kosisBreaker.getStatus(),
		moisBreaker.getStatus(),
		modusignBreaker.getStatus(),
	];
}
