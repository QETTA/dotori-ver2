import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

const clientErrorSchema = z.object({
	message: z.string().max(500).optional(),
	stack: z.string().max(2000).optional(),
	componentStack: z.string().max(2000).optional(),
	url: z.string().max(500).optional(),
	timestamp: z.string().optional(),
}).passthrough();

export const POST = withApiHandler(async (req) => {
	let raw: unknown;
	try {
		raw = await req.json();
	} catch {
		return NextResponse.json(
			{ ok: false, error: "유효하지 않은 JSON입니다" },
			{ status: 400 },
		);
	}

	const parsed = clientErrorSchema.safeParse(raw);

	if (!parsed.success) {
		return NextResponse.json({ ok: true });
	}

	const data = parsed.data;
	log.error("Client error", {
		type: "client-error",
		message: data.message ?? null,
		stack: data.stack ?? null,
		componentStack: data.componentStack ?? null,
		url: data.url ?? null,
		clientTimestamp: data.timestamp ?? new Date().toISOString(),
	});

	return NextResponse.json({ ok: true });
}, { auth: false, skipDb: true, rateLimiter: relaxedLimiter });
