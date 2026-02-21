import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

// Routes that don't require authentication
const publicPaths = [
  "/login",
  "/landing",
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
     * - api (API routes handle their own auth)
     * - _next (Next.js internals)
     * - static files (favicon, brand assets, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|brand/).*)",
  ],
};
