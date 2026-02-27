import { NotFoundError, withApiHandler } from "@/lib/api-handler";
import { toTOPredictionDTO } from "@/lib/dto";
import { relaxedLimiter } from "@/lib/rate-limit";
import { getPrediction } from "@/lib/services/to-prediction.service";
import Facility from "@/models/Facility";
import { NextResponse } from "next/server";

export const GET = withApiHandler(
	async (_req, { params }) => {
		const { id } = params;

		const prediction = await getPrediction(id);
		if (!prediction) {
			throw new NotFoundError("TO 예측 데이터가 없습니다. 스냅샷이 충분히 쌓이면 자동 생성됩니다.");
		}

		const facility = await Facility.findById(id).select("name").lean();
		const facilityName = facility?.name ?? "알 수 없는 시설";

		return NextResponse.json(
			{ data: toTOPredictionDTO(prediction, facilityName) },
			{
				headers: {
					"Cache-Control": "public, max-age=3600, stale-while-revalidate=1800",
				},
			},
		);
	},
	{ auth: false, rateLimiter: relaxedLimiter, cacheControl: "public, max-age=3600, stale-while-revalidate=1800" },
);
