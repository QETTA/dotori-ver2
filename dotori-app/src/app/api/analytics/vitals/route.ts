import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

export const POST = withApiHandler(async (req) => {
	const data = await req.json();

	if (!data || typeof data !== "object") {
		return NextResponse.json({ ok: true });
	}

	log.info("Web Vital", {
		type: "web-vital",
		name: typeof data.name === "string" ? data.name : undefined,
		value: typeof data.value === "number" ? data.value : undefined,
		rating: typeof data.rating === "string" ? data.rating : undefined,
		navigationType: typeof data.navigationType === "string" ? data.navigationType : undefined,
	});

	return NextResponse.json({ ok: true });
}, { auth: false, skipDb: true, rateLimiter: relaxedLimiter });
