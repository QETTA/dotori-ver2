import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { actionIntentSchema } from "@/lib/validations";
import { generatePreview } from "@/lib/engine/intent-preview";
import ActionIntent from "@/models/ActionIntent";

export const POST = withApiHandler(async (_req, { userId, body }) => {
	const { actionType, params } = body;

	const preview = await generatePreview(actionType, params);

	const intent = await ActionIntent.create({
		userId,
		actionType,
		params,
		preview,
	});

	return NextResponse.json(
		{
			data: {
				intentId: String(intent._id),
				preview,
				expiresAt: intent.expiresAt.toISOString(),
			},
		},
		{ status: 201 },
	);
}, { auth: true, schema: actionIntentSchema, rateLimiter: standardLimiter });
