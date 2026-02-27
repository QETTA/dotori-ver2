import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Liveness probe — DO App Platform health_check 전용
// DB ping 없음: 앱 프로세스 생존 여부만 확인
// DB 상태는 /api/health/deep 에서 확인
export async function GET() {
	return NextResponse.json(
		{ status: "healthy", uptime: process.uptime(), timestamp: new Date().toISOString() },
		{ status: 200, headers: { "Cache-Control": "no-store" } },
	);
}
