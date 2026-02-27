import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { alertService } from "@/lib/services/alert.service";

const channelsSchema = z.object({
	channels: z.array(z.enum(["push", "kakao", "email"])),
});

export const PATCH = withApiHandler(async (_req, { userId, body }) => {
	const result = await alertService.updateChannels(userId, body.channels);
	return NextResponse.json({ data: result });
}, { schema: channelsSchema, rateLimiter: standardLimiter });
