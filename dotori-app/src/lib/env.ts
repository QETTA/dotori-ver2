import { z } from "zod";

const isBuildTime =
	process.env.SKIP_ENV_VALIDATION === "1" ||
	process.env.NEXT_PHASE === "phase-production-build";
const isProduction = process.env.NODE_ENV === "production";

const envSchema = z.object({
	/** MongoDB Atlas connection string */
	MONGODB_URI: isBuildTime ? z.string().default("") : z.string().min(1, "MONGODB_URI 환경변수를 .env.local에 설정해주세요"),
	/** MongoDB database name */
	MONGODB_DB_NAME: z.string().default("dotori"),
	/** NextAuth secret for JWT signing */
	AUTH_SECRET: isBuildTime ? z.string().default("") : z.string().min(1, "AUTH_SECRET 환경변수를 .env.local에 설정해주세요"),
	/** Kakao OAuth client ID */
	AUTH_KAKAO_ID: z.string().default(""),
	/** Kakao OAuth client secret */
	AUTH_KAKAO_SECRET: z.string().default(""),
	/** Public app URL */
	NEXT_PUBLIC_APP_URL: isBuildTime || !isProduction
		? z.string().default("http://localhost:3000")
		: z.string().min(1, "NEXT_PUBLIC_APP_URL 환경변수를 설정해주세요"),
	/** Node environment */
	NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse({
	MONGODB_URI: process.env.MONGODB_URI,
	MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
	AUTH_SECRET: process.env.AUTH_SECRET,
	AUTH_KAKAO_ID: process.env.AUTH_KAKAO_ID,
	AUTH_KAKAO_SECRET: process.env.AUTH_KAKAO_SECRET,
	NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
	NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
	const missing = parsed.error.issues.map((i) => i.message).join(", ");
	throw new Error(`환경변수 오류: ${missing}`);
}

export const env = {
	MONGODB_URI: parsed.data.MONGODB_URI,
	MONGODB_DB_NAME: parsed.data.MONGODB_DB_NAME,
	AUTH_SECRET: parsed.data.AUTH_SECRET,
	AUTH_KAKAO_ID: parsed.data.AUTH_KAKAO_ID,
	AUTH_KAKAO_SECRET: parsed.data.AUTH_KAKAO_SECRET,
	APP_URL: parsed.data.NEXT_PUBLIC_APP_URL,
	NODE_ENV: parsed.data.NODE_ENV,
	isProduction: parsed.data.NODE_ENV === "production",
} as const;
