import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { log } from "@/lib/logger";
import { getAllCircuitStatus } from "@/lib/external/circuit-breakers";
import { verifyCronSecret } from "@/lib/cron-auth";
import { createApiErrorResponse } from "@/lib/api-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Deep health check — DB 포함 (모니터링/알림용, DO health_check 경로 아님)
export async function GET(req: Request) {
	if (process.env.NODE_ENV === "production" && !verifyCronSecret(req)) {
		return createApiErrorResponse({
			status: 401,
			code: "UNAUTHORIZED",
			message: "인증이 필요합니다",
		});
	}

	const start = Date.now();
	const checks: Record<string, { status: "ok" | "error"; latencyMs?: number; reason?: string }> = {};

	try {
		await Promise.race([
			(async () => {
				await dbConnect();
				const dbStart = Date.now();
				if (!mongoose.connection.db) throw new Error("MongoDB not connected");
				await mongoose.connection.db.admin().ping({ maxTimeMS: 5000 });
				checks.mongodb = { status: "ok", latencyMs: Date.now() - dbStart };
			})(),
			new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DB check timeout (8s)")), 8000)),
		]);
	} catch (err) {
		log.error("Deep health check MongoDB failed", { error: err instanceof Error ? err.message : String(err) });
		checks.mongodb = {
			status: "error",
			reason: err instanceof Error ? err.message : "MongoDB check failed",
		};
	}

	// 외부 API 서킷 브레이커 상태
	const circuits = getAllCircuitStatus();
	const hasOpenCircuit = circuits.some((c) => c.state === "OPEN");

	const allOk = Object.values(checks).every((c) => c.status === "ok");

	return NextResponse.json(
		{
			status: allOk ? (hasOpenCircuit ? "degraded" : "healthy") : "degraded",
			uptime: process.uptime(),
			timestamp: new Date().toISOString(),
			latencyMs: Date.now() - start,
			checks,
			circuits,
		},
		{ status: allOk ? 200 : 503, headers: { "Cache-Control": "no-store" } },
	);
}
