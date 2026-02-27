/**
 * Circuit Breaker — 외부 API 장애 전파 방지
 *
 * 상태: CLOSED → OPEN (장애) → HALF_OPEN (시험) → CLOSED (정상)
 *
 * 사용:
 *   const cb = createCircuitBreaker("isalang-api", { failureThreshold: 5 });
 *   const data = await cb.execute(() => fetchFromIsalang());
 */
import { log } from "@/lib/logger";

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
	/** 연속 실패 횟수 → OPEN (기본 5) */
	failureThreshold?: number;
	/** OPEN 유지 시간 ms (기본 60초) */
	resetTimeoutMs?: number;
	/** HALF_OPEN에서 허용할 시험 요청 수 (기본 1) */
	halfOpenRequests?: number;
}

export interface CircuitBreakerStatus {
	name: string;
	state: CircuitState;
	failures: number;
	lastFailureAt: string | null;
	nextRetryAt: string | null;
}

export interface CircuitBreaker {
	execute: <T>(fn: () => Promise<T>, fallback?: T) => Promise<T>;
	getStatus: () => CircuitBreakerStatus;
	reset: () => void;
}

export function createCircuitBreaker(
	name: string,
	options: CircuitBreakerOptions = {},
): CircuitBreaker {
	const failureThreshold = options.failureThreshold ?? 5;
	const resetTimeoutMs = options.resetTimeoutMs ?? 60_000;
	const halfOpenRequests = options.halfOpenRequests ?? 1;

	let state: CircuitState = "CLOSED";
	let failures = 0;
	let lastFailureAt: Date | null = null;
	let openedAt: Date | null = null;
	let halfOpenAttempts = 0;

	function shouldAttempt(): boolean {
		if (state === "CLOSED") return true;

		if (state === "OPEN") {
			const elapsed = Date.now() - (openedAt?.getTime() ?? 0);
			if (elapsed >= resetTimeoutMs) {
				state = "HALF_OPEN";
				halfOpenAttempts = 0;
				log.info(`[circuit-breaker] ${name}: OPEN → HALF_OPEN`);
				return true;
			}
			return false;
		}

		// HALF_OPEN
		return halfOpenAttempts < halfOpenRequests;
	}

	function onSuccess(): void {
		if (state === "HALF_OPEN") {
			state = "CLOSED";
			failures = 0;
			halfOpenAttempts = 0;
			log.info(`[circuit-breaker] ${name}: HALF_OPEN → CLOSED (정상 복구)`);
		} else if (state === "CLOSED") {
			failures = 0;
		}
	}

	function onFailure(err: unknown): void {
		failures++;
		lastFailureAt = new Date();

		if (state === "HALF_OPEN") {
			state = "OPEN";
			openedAt = new Date();
			log.warn(`[circuit-breaker] ${name}: HALF_OPEN → OPEN (시험 실패)`, {
				error: err instanceof Error ? err.message : String(err),
			});
			return;
		}

		if (failures >= failureThreshold) {
			state = "OPEN";
			openedAt = new Date();
			log.warn(`[circuit-breaker] ${name}: CLOSED → OPEN (연속 ${failures}회 실패)`, {
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}

	async function execute<T>(fn: () => Promise<T>, fallback?: T): Promise<T> {
		if (!shouldAttempt()) {
			if (fallback !== undefined) return fallback;
			throw new CircuitOpenError(
				`[${name}] 서킷 오픈 — 외부 서비스 일시 중단`,
			);
		}

		if (state === "HALF_OPEN") {
			halfOpenAttempts++;
		}

		try {
			const result = await fn();
			onSuccess();
			return result;
		} catch (err) {
			onFailure(err);
			if (fallback !== undefined) return fallback;
			throw err;
		}
	}

	function getStatus(): CircuitBreakerStatus {
		const nextRetryAt =
			state === "OPEN" && openedAt
				? new Date(openedAt.getTime() + resetTimeoutMs).toISOString()
				: null;

		return {
			name,
			state,
			failures,
			lastFailureAt: lastFailureAt?.toISOString() ?? null,
			nextRetryAt,
		};
	}

	function reset(): void {
		state = "CLOSED";
		failures = 0;
		lastFailureAt = null;
		openedAt = null;
		halfOpenAttempts = 0;
	}

	return { execute, getStatus, reset };
}

export class CircuitOpenError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "CircuitOpenError";
	}
}
