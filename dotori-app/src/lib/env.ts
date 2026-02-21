/**
 * Runtime environment variable validation.
 * Fails fast at startup if required variables are missing.
 */

function required(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(
			`Missing required environment variable: ${name}. Check .env.local`,
		);
	}
	return value;
}

function optional(name: string, fallback = ""): string {
	return process.env[name] ?? fallback;
}

export const env = {
	/** MongoDB Atlas connection string */
	MONGODB_URI: required("MONGODB_URI"),
	/** NextAuth secret for JWT signing */
	AUTH_SECRET: required("AUTH_SECRET"),
	/** Kakao OAuth client ID */
	AUTH_KAKAO_ID: optional("AUTH_KAKAO_ID"),
	/** Kakao OAuth client secret */
	AUTH_KAKAO_SECRET: optional("AUTH_KAKAO_SECRET"),
	/** Public app URL (for server-side API calls) */
	APP_URL: optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
	/** Node environment */
	NODE_ENV: optional("NODE_ENV", "development"),
	/** Is production? */
	isProduction: process.env.NODE_ENV === "production",
} as const;
