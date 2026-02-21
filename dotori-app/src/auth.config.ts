import type { NextAuthConfig } from "next-auth";
import Kakao from "next-auth/providers/kakao";

/**
 * Edge-safe NextAuth config (no adapter/database imports).
 * Used by middleware for JWT-only route protection.
 * The full config in auth.ts spreads this and adds MongoDBAdapter.
 */
export const authConfig = {
	providers: [
		Kakao({
			clientId: process.env.AUTH_KAKAO_ID!,
			clientSecret: process.env.AUTH_KAKAO_SECRET!,
		}),
	],
	session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
	pages: { signIn: "/login" },
	callbacks: {
		async jwt({ token, user }) {
			if (user) token.userId = user.id;
			return token;
		},
		async session({ session, token }) {
			if (token.userId) session.user.id = token.userId as string;
			return session;
		},
	},
} satisfies NextAuthConfig;
