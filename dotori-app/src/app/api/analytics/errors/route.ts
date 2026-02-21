import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

export const POST = withApiHandler(async (req) => {
	const data = await req.json();

	if (!data || typeof data !== "object") {
		return NextResponse.json({ ok: true });
	}

	log.error("Client error", {
		type: "client-error",
		message: typeof data.message === "string" ? data.message.slice(0, 500) : null,
		stack: typeof data.stack === "string" ? data.stack.slice(0, 2000) : null,
		componentStack: typeof data.componentStack === "string" ? data.componentStack.slice(0, 2000) : null,
		url: typeof data.url === "string" ? data.url.slice(0, 500) : null,
		clientTimestamp: data.timestamp ?? new Date().toISOString(),
	});

	return NextResponse.json({ ok: true });
}, { auth: false, skipDb: true, rateLimiter: relaxedLimiter });
