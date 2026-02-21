import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { sanitizeSearchQuery } from "@/lib/sanitize";
import { toFacilityDTO } from "@/lib/dto";
import Facility from "@/models/Facility";

export const GET = withApiHandler(async (req) => {
	const { searchParams } = req.nextUrl;

	// Batch fetch by IDs — used by interests page
	const ids = searchParams.get("ids");
	if (ids) {
		const idList = ids
			.split(",")
			.map((s) => s.trim())
			.filter((id) => mongoose.Types.ObjectId.isValid(id))
			.slice(0, 50);

		if (idList.length === 0) {
			return NextResponse.json({ data: [], pagination: { page: 1, limit: 0, total: 0, totalPages: 0 } });
		}

		const facilities = await Facility.find({ _id: { $in: idList } }).lean();
		return NextResponse.json({
			data: facilities.map((f) => toFacilityDTO(f)),
			pagination: { page: 1, limit: facilities.length, total: facilities.length, totalPages: 1 },
		});
	}

	const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
	const limit = Math.min(
		100,
		Math.max(1, parseInt(searchParams.get("limit") || "20") || 20),
	);
	const rawSearch = searchParams.get("search") || "";
	const search = rawSearch ? sanitizeSearchQuery(rawSearch) : "";
	const type = searchParams.get("type") || "";
	const status = searchParams.get("status") || "";
	const sido = searchParams.get("sido") || "";
	const sigungu = searchParams.get("sigungu") || "";

	const filter: Record<string, unknown> = {};

	if (search) {
		filter.$text = { $search: search };
	}
	if (type) filter.type = type;
	if (status) filter.status = status;
	if (sido) filter["region.sido"] = sido;
	if (sigungu) filter["region.sigungu"] = sigungu;

	const [facilities, total] = await Promise.all([
		Facility.find(filter)
			.skip((page - 1) * limit)
			.limit(limit)
			.sort(search ? { score: { $meta: "textScore" } } : { lastSyncedAt: -1 })
			.lean(),
		Facility.countDocuments(filter),
	]);

	return NextResponse.json(
		{
			data: facilities.map((f) => toFacilityDTO(f)),
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		},
		{
			headers: {
				"Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
			},
		},
	);
}, { auth: false, rateLimiter: relaxedLimiter });
