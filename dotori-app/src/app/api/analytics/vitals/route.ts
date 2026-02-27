import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

export const POST = withApiHandler(async (req) => {
	let data: unknown;
	try {
		data = await req.json();
	} catch {
		return NextResponse.json(
			{ ok: false, error: "유효하지 않은 JSON입니다" },
			{ status: 400 },
		);
	}

	if (!data || typeof data !== "object") {
		return NextResponse.json({ ok: true });
	}
	const payload = data as Record<string, unknown>;

	log.info("Web Vital", {
		type: "web-vital",
		name: typeof payload.name === "string" ? payload.name : undefined,
		value: typeof payload.value === "number" ? payload.value : undefined,
		rating: typeof payload.rating === "string" ? payload.rating : undefined,
		navigationType: typeof payload.navigationType === "string" ? payload.navigationType : undefined,
	});

	return NextResponse.json({ ok: true });
}, { auth: false, skipDb: true, rateLimiter: relaxedLimiter });
