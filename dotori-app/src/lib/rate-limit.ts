/**
 * In-memory sliding-window rate limiter for API routes.
 *
 * Usage in any route handler:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
 *
 *   export async function POST(req: NextRequest) {
 *     const limited = limiter.check(req);
 *     if (limited) return limited;  // 429 response
 *     ...
 *   }
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface RateLimitOptions {
	/** Time window in milliseconds */
	windowMs: number;
	/** Maximum requests per window */
	max: number;
	/** Key extractor — defaults to IP-based */
	keyFn?: (req: NextRequest) => string;
}

interface TokenBucket {
	tokens: number;
	lastRefill: number;
}

const DEFAULT_KEY_FN = (req: NextRequest): string => {
	return (
		req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		req.headers.get("x-real-ip") ||
		"anonymous"
	);
};

export function createRateLimiter(options: RateLimitOptions) {
	const { windowMs, max, keyFn = DEFAULT_KEY_FN } = options;
	const buckets = new Map<string, TokenBucket>();

	// Periodic cleanup every 5 minutes to prevent memory leak
	const CLEANUP_INTERVAL = 5 * 60_000;
	let lastCleanup = Date.now();

	function cleanup() {
		const now = Date.now();
		if (now - lastCleanup < CLEANUP_INTERVAL) return;
		lastCleanup = now;

		for (const [key, bucket] of buckets) {
			if (now - bucket.lastRefill > windowMs * 2) {
				buckets.delete(key);
			}
		}
	}

	function check(req: NextRequest): NextResponse | null {
		cleanup();

		const key = keyFn(req);
		const now = Date.now();

		let bucket = buckets.get(key);
		if (!bucket) {
			bucket = { tokens: max, lastRefill: now };
			buckets.set(key, bucket);
		}

		// Refill tokens based on elapsed time
		const elapsed = now - bucket.lastRefill;
		const refillRate = max / windowMs; // tokens per ms
		bucket.tokens = Math.min(max, bucket.tokens + elapsed * refillRate);
		bucket.lastRefill = now;

		if (bucket.tokens < 1) {
			const retryAfter = Math.ceil((1 - bucket.tokens) / refillRate / 1000);
			return NextResponse.json(
				{ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
				{
					status: 429,
					headers: {
						"Retry-After": String(retryAfter),
						"X-RateLimit-Limit": String(max),
						"X-RateLimit-Remaining": "0",
					},
				},
			);
		}

		bucket.tokens -= 1;
		return null; // not limited
	}

	return { check };
}

// Pre-configured limiters for different tiers
/** Strict: 5 req/min — for expensive operations (AI chat, OCR) */
export const strictLimiter = createRateLimiter({
	windowMs: 60_000,
	max: 5,
});

/** Standard: 30 req/min — for write operations */
export const standardLimiter = createRateLimiter({
	windowMs: 60_000,
	max: 30,
});

/** Relaxed: 120 req/min — for read operations */
export const relaxedLimiter = createRateLimiter({
	windowMs: 60_000,
	max: 120,
});
