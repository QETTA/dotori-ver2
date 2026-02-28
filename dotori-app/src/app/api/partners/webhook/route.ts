import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler, ApiError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import CPAEvent from "@/models/CPAEvent";

const webhookSchema = z.object({
	eventType: z.enum(["visit_request", "waitlist_apply", "interest_add", "esign_complete"]),
	userId: z.string().min(1),
	facilityId: z.string().min(1),
	targetId: z.string().min(1),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

/** Verify HMAC-SHA256 signature from X-Dotori-Signature header */
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
	const secret = process.env.WEBHOOK_SECRET;
	if (!secret) return false;
	if (!signature) return false;

	const expected = createHmac("sha256", secret).update(payload).digest("hex");
	const sigBuffer = Buffer.from(signature, "hex");
	const expectedBuffer = Buffer.from(expected, "hex");

	if (sigBuffer.length !== expectedBuffer.length) return false;
	return timingSafeEqual(sigBuffer, expectedBuffer);
}

/** POST /api/partners/webhook — Receive CPA event webhook */
export const POST = withApiHandler(async (req, { body }) => {
	const signature = req.headers.get("x-dotori-signature");
	const rawBody = JSON.stringify(body);

	if (!verifyWebhookSignature(rawBody, signature)) {
		throw new ApiError("유효하지 않은 웹훅 서명입니다", 401, { code: "UNAUTHENTICATED" });
	}

	const event = await CPAEvent.create({
		eventType: body.eventType,
		userId: body.userId,
		facilityId: body.facilityId,
		targetId: body.targetId,
		metadata: body.metadata,
		occurredAt: new Date(),
	});

	return NextResponse.json(
		{ data: { id: event._id, received: true } },
		{ status: 201 },
	);
}, { auth: false, schema: webhookSchema, rateLimiter: standardLimiter });
