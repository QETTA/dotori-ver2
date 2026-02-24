import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Deep health check — DB 포함 (모니터링/알림용, DO health_check 경로 아님)
export async function GET() {
	const start = Date.now();
	const checks: Record<string, { status: "ok" | "error"; latencyMs?: number; reason?: string }> = {};

	try {
		await dbConnect();
		const dbStart = Date.now();
		if (!mongoose.connection.db) throw new Error("MongoDB not connected");
		await mongoose.connection.db.admin().ping();
		checks.mongodb = { status: "ok", latencyMs: Date.now() - dbStart };
	} catch (err) {
		log.error("Deep health check MongoDB failed", { error: err instanceof Error ? err.message : String(err) });
		checks.mongodb = {
			status: "error",
			reason: err instanceof Error ? err.message : "MongoDB check failed",
		};
	}

	const allOk = Object.values(checks).every((c) => c.status === "ok");

	return NextResponse.json(
		{ status: allOk ? "healthy" : "degraded", uptime: process.uptime(), timestamp: new Date().toISOString(), latencyMs: Date.now() - start, checks },
		{ status: allOk ? 200 : 503, headers: { "Cache-Control": "no-store" } },
	);
}
