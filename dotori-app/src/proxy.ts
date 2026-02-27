import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createApiErrorResponse } from "@/lib/api-error";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const RATE_LIMIT_MAX_TRACKED_IPS = 10_000;
const PREHOME_SPLASH_COOKIE = "dotori_prehome_splash";
const rateLimitMap = new Map<string, number[]>();
let cleanupCounter = 0;

const getPublicBaseUrl = (req: NextRequest) => {
	return req.nextUrl.origin;
};

const pruneOldestRateLimitEntries = () => {
	while (rateLimitMap.size > RATE_LIMIT_MAX_TRACKED_IPS) {
		const oldestIp = rateLimitMap.keys().next().value;
		if (typeof oldestIp !== "string") {
			break;
		}

		rateLimitMap.delete(oldestIp);
	}
};

const getClientIp = (req: NextRequest) => {
	const requestIp = (req as NextRequest & { ip?: string }).ip;
	if (typeof requestIp === "string" && requestIp.length > 0) {
		return requestIp;
	}

	const realIp = req.headers.get("x-real-ip")?.trim();
	if (realIp) {
		return realIp;
	}

	const xForwardedFor = req.headers.get("x-forwarded-for");
	if (xForwardedFor) {
		return xForwardedFor.split(",")[0]?.trim() ?? "anonymous";
	}

	return "anonymous";
};

const hasSessionCookie = (req: NextRequest) => {
	const cookieNames = [
		"__Secure-authjs.session-token",
		"authjs.session-token",
		"__Secure-next-auth.session-token",
		"next-auth.session-token",
	];

	return cookieNames.some((name) => Boolean(req.cookies.get(name)?.value));
};

const isRateLimited = (req: NextRequest) => {
	const clientIp = getClientIp(req);
	const now = Date.now();
	cleanupCounter += 1;

	if (cleanupCounter % 100 === 0) {
		for (const [ip, timestamps] of rateLimitMap) {
			const validTimestamps = timestamps.filter(
				(timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
			);
			if (validTimestamps.length === 0) {
				rateLimitMap.delete(ip);
				continue;
			}

			rateLimitMap.set(ip, validTimestamps);
		}

		pruneOldestRateLimitEntries();
	}

	const windowStart = now - RATE_LIMIT_WINDOW_MS;
	const requestTimestamps = rateLimitMap.get(clientIp) ?? [];
	const recentRequests = requestTimestamps.filter(
		(timestamp) => timestamp > windowStart,
	);

	if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
		rateLimitMap.set(clientIp, recentRequests);
		pruneOldestRateLimitEntries();
		const oldestRequestAt = recentRequests[0] ?? now;
		const retryAfterSeconds = Math.max(
			1,
			Math.ceil((oldestRequestAt + RATE_LIMIT_WINDOW_MS - now) / 1000),
		);
		return { limited: true, retryAfterSeconds };
	}

	recentRequests.push(now);
	rateLimitMap.set(clientIp, recentRequests);
	pruneOldestRateLimitEntries();
	return { limited: false, retryAfterSeconds: 0 };
};

// Routes that don't require authentication
const publicPaths = [
  "/login",
  "/landing",
  "/chat",
  "/explore",
  "/community",
  "/facility",
  "/my",
  "/onboarding",
  "/manifest.json",
];

// Routes that authenticated users should be redirected away from
const authOnlyPaths = ["/login"];

const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF protection: verify Origin header for state-changing API requests.
 * Allows requests where Origin matches the host, or where Origin is absent
 * (same-origin requests from some browsers omit it).
 */
const isOriginAllowed = (req: NextRequest): boolean => {
	if (CSRF_SAFE_METHODS.has(req.method)) return true;

	const origin = req.headers.get("origin");
	// same-origin fetch may omit Origin; also check Sec-Fetch-Site as fallback
	if (!origin) {
		const fetchSite = req.headers.get("sec-fetch-site");
		// Allow if browser confirms same-origin, or if header absent (non-browser client)
		return !fetchSite || fetchSite === "same-origin" || fetchSite === "none";
	}

	try {
		const originHost = new URL(origin).host;
		const requestHost = req.nextUrl.host || req.headers.get("host") || "";
		return originHost === requestHost;
	} catch {
		return false;
	}
};

export default function proxy(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const publicBaseUrl = getPublicBaseUrl(req);
	if (pathname === "/api" || pathname.startsWith("/api/")) {
		// DO App Platform health check는 shallow health 엔드포인트만 사용
		if (pathname === "/api/health") {
			return NextResponse.next();
		}

		const rateLimit = isRateLimited(req);
		if (rateLimit.limited) {
			return createApiErrorResponse({
				status: 429,
				code: "RATE_LIMITED",
				message: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
				details: {
					retryAfterSeconds: rateLimit.retryAfterSeconds,
				},
				headers: {
					"Retry-After": String(rateLimit.retryAfterSeconds),
				},
			});
		}

		// CSRF origin check for mutating API requests
		if (!isOriginAllowed(req)) {
			return createApiErrorResponse({
				status: 403,
				code: "FORBIDDEN",
				message: "잘못된 요청 출처입니다",
			});
		}

		return NextResponse.next();
	}

	if (pathname === "/") {
		const hasSeenSplash = req.cookies.get(PREHOME_SPLASH_COOKIE)?.value === "1";
		if (!hasSeenSplash) {
			return NextResponse.redirect(new URL("/landing", publicBaseUrl));
		}
	}

	const isLoggedIn = hasSessionCookie(req);

  // Check if current path is public
	const isPublicPath = publicPaths.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	);

	// Redirect authenticated users away from login
	if (isLoggedIn && authOnlyPaths.some((p) => pathname.startsWith(p))) {
		return NextResponse.redirect(new URL("/", publicBaseUrl));
	}

	// Allow public paths
	if (isPublicPath || pathname === "/") {
		return NextResponse.next();
	}

	// Redirect unauthenticated users to login for protected paths
	if (!isLoggedIn) {
		const loginUrl = new URL("/login", publicBaseUrl);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
    /*
     * Match all paths except:
     * - Next.js internals
     * - public static assets (including manifest, icons, PWA files, brand assets)
	 */
	"/((?!_next/|favicon\\.ico|manifest\\.json|brand/|robots\\.txt|sitemap\\.xml).*)",
	],
};
