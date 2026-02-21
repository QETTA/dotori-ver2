import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const rateLimitMap = new Map<string, number[]>();

const getClientIp = (req: NextRequest) => {
	const xForwardedFor = req.headers.get("x-forwarded-for");
	if (xForwardedFor) {
		return xForwardedFor.split(",")[0]?.trim() ?? "anonymous";
	}

	const realIp = req.headers.get("x-real-ip");
	if (realIp) {
		return realIp;
	}

	return "anonymous";
};

const isRateLimited = (req: NextRequest) => {
	const clientIp = getClientIp(req);
	const now = Date.now();
	const windowStart = now - RATE_LIMIT_WINDOW_MS;
	const requestTimestamps = rateLimitMap.get(clientIp) ?? [];
	const recentRequests = requestTimestamps.filter(
		(timestamp) => timestamp > windowStart,
	);

	if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
		rateLimitMap.set(clientIp, recentRequests);
		const oldestRequestAt = recentRequests[0] ?? now;
		const retryAfterSeconds = Math.max(
			1,
			Math.ceil((oldestRequestAt + RATE_LIMIT_WINDOW_MS - now) / 1000),
		);
		return { limited: true, retryAfterSeconds };
	}

	recentRequests.push(now);
	rateLimitMap.set(clientIp, recentRequests);
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
  "/onboarding",
];

// Routes that authenticated users should be redirected away from
const authOnlyPaths = ["/login"];

const { auth } = NextAuth(authConfig);

export default auth((req) => {
	const { pathname } = req.nextUrl;
	if (pathname === "/api" || pathname.startsWith("/api/")) {
		const rateLimit = isRateLimited(req);
		if (rateLimit.limited) {
			return NextResponse.json(
				{ error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
				{
					status: 429,
					headers: {
						"Retry-After": String(rateLimit.retryAfterSeconds),
					},
				},
			);
		}

		return NextResponse.next();
	}

	const isLoggedIn = !!req.auth;

  // Check if current path is public
	const isPublicPath = publicPaths.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	);

	// Redirect authenticated users away from login
	if (isLoggedIn && authOnlyPaths.some((p) => pathname.startsWith(p))) {
		return NextResponse.redirect(new URL("/", req.url));
	}

	// Allow public paths
	if (isPublicPath || pathname === "/") {
		return NextResponse.next();
	}

	// Redirect unauthenticated users to login for protected paths
	if (!isLoggedIn) {
		const loginUrl = new URL("/login", req.url);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

  return NextResponse.next();
});

export const config = {
	matcher: [
    /*
     * Match all paths except:
     * - _next (Next.js internals)
     * - static files (favicon, brand assets, etc.)
	 */
	"/((?!_next/static|_next/image|favicon\\.ico|brand/).*)",
	],
};
