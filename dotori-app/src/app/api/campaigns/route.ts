import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { createCampaign, listCampaigns } from "@/lib/engines/campaign-engine";

const createCampaignSchema = z.object({
	name: z.string().min(1).max(200),
	triggerId: z.enum([
		"graduation",
		"relocation",
		"vacancy",
		"evaluation_change",
		"policy_change",
		"seasonal_admission",
		"sibling_priority",
	]),
	audience: z
		.object({
			regions: z.array(z.string()).optional(),
			childAgeRange: z
				.object({ min: z.number().min(0), max: z.number().min(0) })
				.optional(),
			facilityTypes: z.array(z.string()).optional(),
		})
		.default({}),
	schedule: z.object({
		startDate: z.string(),
		endDate: z.string().optional(),
		cronExpression: z.string().optional(),
	}),
	messageTemplate: z.string().min(1).max(2000),
});

/** POST /api/campaigns — Create campaign */
export const POST = withApiHandler(async (_req, { body }) => {
	const campaign = await createCampaign(body);
	return NextResponse.json({ data: campaign.toJSON() }, { status: 201 });
}, { schema: createCampaignSchema, rateLimiter: standardLimiter });

/** GET /api/campaigns — List campaigns */
export const GET = withApiHandler(async (req) => {
	const { searchParams } = req.nextUrl;
	const status = searchParams.get("status") as string | undefined;
	const page = Math.max(1, Number(searchParams.get("page")) || 1);
	const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));

	const result = await listCampaigns({
		status: status as "draft" | "active" | "paused" | "completed" | "archived" | undefined,
		page,
		limit,
	});

	return NextResponse.json({
		data: result.data,
		pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
	});
}, { rateLimiter: standardLimiter });
