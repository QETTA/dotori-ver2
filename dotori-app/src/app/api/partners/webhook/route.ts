import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import CPAEvent from "@/models/CPAEvent";

const webhookSchema = z.object({
	eventType: z.enum(["visit_request", "waitlist_apply", "interest_add", "esign_complete"]),
	userId: z.string().min(1),
	facilityId: z.string().min(1),
	targetId: z.string().min(1),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

/** POST /api/partners/webhook — Receive CPA event webhook */
export const POST = withApiHandler(async (_req, { body }) => {
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
