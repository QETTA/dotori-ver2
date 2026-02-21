import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { withApiHandler, BadRequestError, NotFoundError } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { toFacilityDTO } from "@/lib/dto";
import Facility from "@/models/Facility";

export const GET = withApiHandler(async (_req, { params }) => {
	const { id } = params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new BadRequestError("유효하지 않은 시설 ID입니다");
	}

	const facility = await Facility.findById(id).lean();

	if (!facility) {
		throw new NotFoundError("시설을 찾을 수 없습니다");
	}

	return NextResponse.json(
		{ data: toFacilityDTO(facility) },
		{
			headers: {
				"Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
			},
		},
	);
}, { auth: false, rateLimiter: relaxedLimiter });
