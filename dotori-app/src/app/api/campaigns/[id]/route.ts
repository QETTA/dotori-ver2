import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler, NotFoundError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import Campaign from "@/models/Campaign";
import {
	updateCampaignStatus,
	executeCampaign,
} from "@/lib/engines/campaign-engine";

const updateCampaignSchema = z.object({
	action: z.enum(["activate", "pause", "complete", "archive", "execute"]),
	name: z.string().min(1).max(200).optional(),
	messageTemplate: z.string().min(1).max(2000).optional(),
});

/** GET /api/campaigns/[id] — Campaign detail */
export const GET = withApiHandler(async (_req, { params }) => {
	const campaign = await Campaign.findById(params.id).lean();
	if (!campaign) throw new NotFoundError("캠페인을 찾을 수 없습니다");
	return NextResponse.json({ data: campaign });
}, { rateLimiter: standardLimiter });

/** PATCH /api/campaigns/[id] — Update campaign */
export const PATCH = withApiHandler(async (_req, { body, params }) => {
	if (body.action === "execute") {
		const result = await executeCampaign(params.id);
		return NextResponse.json({ data: result });
	}

	const statusMap: Record<string, string> = {
		activate: "active",
		pause: "paused",
		complete: "completed",
		archive: "archived",
	};

	const newStatus = statusMap[body.action];
	if (newStatus) {
		const updated = await updateCampaignStatus(
			params.id,
			newStatus as "active" | "paused" | "completed" | "archived",
		);
		if (!updated) throw new NotFoundError("캠페인을 찾을 수 없습니다");
		return NextResponse.json({ data: updated });
	}

	// Field update (name, messageTemplate)
	const updateFields: Record<string, unknown> = {};
	if (body.name) updateFields.name = body.name;
	if (body.messageTemplate) updateFields.messageTemplate = body.messageTemplate;

	const updated = await Campaign.findByIdAndUpdate(
		params.id,
		{ $set: updateFields },
		{ new: true },
	).lean();

	if (!updated) throw new NotFoundError("캠페인을 찾을 수 없습니다");
	return NextResponse.json({ data: updated });
}, { schema: updateCampaignSchema, rateLimiter: standardLimiter });

/** DELETE /api/campaigns/[id] — Archive campaign */
export const DELETE = withApiHandler(async (_req, { params }) => {
	const updated = await updateCampaignStatus(params.id, "archived");
	if (!updated) throw new NotFoundError("캠페인을 찾을 수 없습니다");
	return NextResponse.json({ data: { success: true } });
}, { rateLimiter: standardLimiter });
