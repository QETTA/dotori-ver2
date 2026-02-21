import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { facilityService } from "@/lib/services/facility.service";

export const GET = withApiHandler(async (_req, { params }) => {
	const { id } = params;
	const facility = await facilityService.findById(id);

	return NextResponse.json(
		{ data: facility },
		{
			headers: {
				"Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
			},
		},
	);
}, { auth: false, rateLimiter: relaxedLimiter });
