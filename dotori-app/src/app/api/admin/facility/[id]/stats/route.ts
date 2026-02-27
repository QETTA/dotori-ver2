/**
 * GET /api/admin/facility/:id/stats?days=30
 *
 * 시설 통계 집계 API (B2B SaaS 대시보드용)
 * 인증: Bearer CRON_SECRET
 */
import { type NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron-auth";
import { facilityStatsService } from "@/lib/services/facility-stats.service";
import { API_CONFIG } from "@/lib/config/api";
import { createApiErrorResponse } from "@/lib/api-error";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
	req: NextRequest,
	routeCtx: RouteContext,
): Promise<NextResponse> {
	if (!verifyCronSecret(req)) {
		return createApiErrorResponse({
			status: 401,
			code: "UNAUTHORIZED",
			message: "인증이 필요합니다",
		});
	}

	const { id } = await routeCtx.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return createApiErrorResponse({
			status: 400,
			code: "BAD_REQUEST",
			message: "유효하지 않은 시설 ID입니다",
		});
	}

	const daysParam = req.nextUrl.searchParams.get("days");
	const days = daysParam
		? Math.min(
				Math.max(Number(daysParam) || API_CONFIG.FACILITY_STATS.defaultDays, 1),
				API_CONFIG.FACILITY_STATS.maxDays,
			)
		: API_CONFIG.FACILITY_STATS.defaultDays;

	await dbConnect();

	const stats = await facilityStatsService.getStats(id, days);

	return NextResponse.json(
		{ data: stats },
		{
			status: 200,
			headers: {
				"Cache-Control": "private, max-age=300, stale-while-revalidate=300",
			},
		},
	);
}
