import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { NotFoundError, withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { sanitizeSearchQuery } from "@/lib/sanitize";
import { toFacilityDTO } from "@/lib/dto";
import Facility from "@/models/Facility";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const READ_ONLY_CACHE_CONTROL = "public, max-age=30, stale-while-revalidate=60";

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
			return NextResponse.json({
				data: [],
				pagination: { page: 1, limit: 0, total: 0, totalPages: 0 },
			});
		}

		const facilities = await Facility.find({ _id: { $in: idList } }).lean();
		if (facilities.length === 0) {
			throw new NotFoundError("요청한 시설을 찾을 수 없습니다");
		}
		return NextResponse.json({
			data: facilities.map((f) => toFacilityDTO(f)),
			pagination: {
				page: 1,
				limit: facilities.length,
				total: facilities.length,
				totalPages: 1,
			},
		});
	}

	const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
	const limit = Math.min(
		100,
		Math.max(1, parseInt(searchParams.get("limit") || "20") || 20),
	);
	const rawSearch = searchParams.get("search") || "";
	const search = rawSearch ? sanitizeSearchQuery(rawSearch) : "";
	const rawQ = searchParams.get("q") || "";
	const q = rawQ ? sanitizeSearchQuery(rawQ) : "";
	const type = searchParams.get("type") || "";
	const status = searchParams.get("status") || "";
	const sido = searchParams.get("sido") || "";
	const sigungu = searchParams.get("sigungu") || "";
	const rawSort = searchParams.get("sort") || "distance";
	const rawLat = Number(searchParams.get("lat"));
	const rawLng = Number(searchParams.get("lng"));

	const sort = ["distance", "rating", "capacity"].includes(rawSort)
		? (rawSort as "distance" | "rating" | "capacity")
		: "distance";

	const filter: Record<string, unknown> = {};

	const keywordFilters: Array<Record<string, unknown>> = [];
	if (search) {
		keywordFilters.push({ $text: { $search: search } });
	}
	if (q) {
		const safeKeyword = escapeRegex(q);
		keywordFilters.push({
			$or: [
				{ name: { $regex: safeKeyword, $options: "i" } },
				{ address: { $regex: safeKeyword, $options: "i" } },
			],
		});
	}
	if (keywordFilters.length === 1) {
		Object.assign(filter, keywordFilters[0]);
	} else if (keywordFilters.length > 1) {
		filter.$and = keywordFilters;
	}
	if (type) {
		const types = type
			.split(",")
			.map((value) => value.trim())
			.filter(Boolean);
		if (types.length === 1) filter.type = types[0];
		else if (types.length > 1) filter.type = { $in: types };
	}
	if (status) filter.status = status;
	if (sido) filter["region.sido"] = sido;
	if (sigungu) filter["region.sigungu"] = sigungu;

	const hasValidLatLng =
		typeof rawLat === "number" &&
		typeof rawLng === "number" &&
		Number.isFinite(rawLat) &&
		Number.isFinite(rawLng) &&
		rawLat >= -90 &&
		rawLat <= 90 &&
		rawLng >= -180 &&
		rawLng <= 180;

	const useDistanceSort = sort === "distance" && hasValidLatLng;

	const facilitiesQuery =
		useDistanceSort
			? Facility.aggregate([
					{
						$geoNear: {
							near: {
								type: "Point",
								coordinates: [rawLng, rawLat],
							},
							distanceField: "distance",
							spherical: true,
							query: filter,
							key: "location",
						},
					},
					{ $skip: (page - 1) * limit },
					{ $limit: limit },
				]).exec()
			: Facility.aggregate([
					{ $match: filter },
					...(sort === "capacity"
						? [
								{
									$addFields: {
										availableSeats: {
											$max: [
												{ $subtract: ["$capacity.total", "$capacity.current"] },
												0,
											],
										},
									},
								},
							]
						: []),
					{
						$sort:
							sort === "rating"
								? { rating: -1, reviewCount: -1, lastSyncedAt: -1 }
								: sort === "capacity"
									? { availableSeats: -1, lastSyncedAt: -1 }
									: { lastSyncedAt: -1 },
					},
					{ $skip: (page - 1) * limit },
					{ $limit: limit },
				]).exec();

	const [facilities, total] = await Promise.all([
		facilitiesQuery,
		Facility.countDocuments(filter),
	]);
	const facilityData = facilities as Array<
		Record<string, unknown> & { distance?: unknown }
	>;

	return NextResponse.json(
		{
			data: facilityData.map((f) =>
				toFacilityDTO(
					f as unknown as Parameters<typeof toFacilityDTO>[0],
					typeof f.distance === "number" ? f.distance : undefined,
				),
			),
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		},
	);
}, {
	auth: false,
	rateLimiter: relaxedLimiter,
	cacheControl: READ_ONLY_CACHE_CONTROL,
});
