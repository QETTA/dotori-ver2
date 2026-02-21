import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import Alert from "@/models/Alert";

const channelsSchema = z.object({
	channels: z.array(z.enum(["push", "kakao", "email"])),
});

export const PATCH = withApiHandler(async (_req, { userId, body }) => {
	await Alert.updateMany(
		{ userId, active: true },
		{ $set: { channels: body.channels } },
	);

	return NextResponse.json({ data: { channels: body.channels } });
}, { schema: channelsSchema, rateLimiter: standardLimiter });
