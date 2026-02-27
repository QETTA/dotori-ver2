/**
 * Facility service layer.
 */
import mongoose, { type FilterQuery, type PipelineStage } from "mongoose";
import Facility, { type IFacility } from "@/models/Facility";
import { ApiError, NotFoundError } from "@/lib/api-handler";
import { toFacilityDTO } from "@/lib/dto";
import { normalizePage, normalizeLimit, toNumber } from "@/lib/pagination";

const DEFAULT_NEARBY_LIMIT = 20;

export type FacilitySort = "distance" | "rating" | "capacity" | "isPremium";

export type FacilityRecord = Omit<IFacility, keyof mongoose.Document> & {
	_id: mongoose.Types.ObjectId;
	distance?: number;
};

export interface FacilitySearchParams {
	ids?: string | string[];
	page?: string | number;
	limit?: string | number;
	search?: string;
	q?: string;
	type?: string | string[];
	status?: string;
	sido?: string;
	sigungu?: string;
	sort?: string;
	lat?: string | number;
	lng?: string | number;
	latitude?: string | number;
	longitude?: string | number;
}

export interface FacilityListResult {
	data: FacilityRecord[];
	total: number;
	page: number;
	limit: number;
}

export interface FacilitySearchApiResult {
	data: ReturnType<typeof toFacilityDTO>[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface NearbyFacilityParams {
	latitude: string | number;
	longitude: string | number;
	maxDistanceMeters?: number;
	type?: string;
	status?: string;
	limit?: number;
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function parseFacilityIds(raw?: string | string[]): string[] {
	if (!raw) {
		return [];
	}
	const ids = Array.isArray(raw) ? raw : raw.split(",");
	return ids
		.map((value) => value.trim())
		.filter((value) => mongoose.Types.ObjectId.isValid(value));
}

function normalizeTypeFilter(raw?: string | string[]): string[] {
	if (!raw) {
		return [];
	}
	return Array.isArray(raw)
		? raw.map((value) => value.trim()).filter(Boolean)
		: raw.split(",").map((value) => value.trim()).filter(Boolean);
}

function normalizeFilter(params: FacilitySearchParams): FilterQuery<FacilityRecord> {
	const filter: FilterQuery<FacilityRecord> = {};
	const conditions: Array<Record<string, unknown>> = [];

	if (params.search) {
		conditions.push({ $text: { $search: params.search } });
	}
	if (params.q) {
		const safeKeyword = escapeRegex(params.q);
		conditions.push({
			$or: [
				{ name: { $regex: safeKeyword, $options: "i" } },
				{ address: { $regex: safeKeyword, $options: "i" } },
			],
		});
	}
	if (conditions.length === 1) {
		Object.assign(filter, conditions[0]);
	} else if (conditions.length > 1) {
		filter.$and = conditions;
	}

	const types = normalizeTypeFilter(params.type);
	if (types.length === 1) {
		filter.type = types[0];
	} else if (types.length > 1) {
		filter.type = { $in: types };
	}
	if (params.status) filter.status = params.status;
	if (params.sido) filter["region.sido"] = params.sido;
	if (params.sigungu) filter["region.sigungu"] = params.sigungu;

	const ids = parseFacilityIds(params.ids);
	if (ids.length > 0) {
		filter._id = { $in: ids };
	}

	return filter;
}

function numberIsValidCoordinate(
	latitude?: number,
	longitude?: number,
): latitude is number & {} {
	return (
		typeof latitude === "number" &&
		typeof longitude === "number" &&
		Number.isFinite(latitude) &&
		Number.isFinite(longitude) &&
		latitude >= -90 &&
		latitude <= 90 &&
		longitude >= -180 &&
		longitude <= 180
	);
}

export function findById(id: string): Promise<FacilityRecord> {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError("유효하지 않은 시설 ID입니다", 400);
	}

	return Facility.findById(id)
		.lean()
		.then((facility) => {
			if (!facility) {
				throw new NotFoundError("시설을 찾을 수 없습니다");
			}
			return facility as FacilityRecord;
		});
}

export async function search(params: FacilitySearchParams = {}): Promise<FacilityListResult> {
	const page = normalizePage(params.page);
	const limit = normalizeLimit(params.limit);
	const skip = (page - 1) * limit;
	const filter = normalizeFilter(params);
	const premiumSort = {
		"premium.isActive": -1,
		"premium.sortBoost": -1,
		isPremium: -1,
	} as const;
	const sort =
		params.sort === "rating" || params.sort === "capacity" || params.sort === "isPremium"
			? (params.sort as FacilitySort)
			: "distance";

	const latitude = toNumber(params.latitude ?? params.lat);
	const longitude = toNumber(params.longitude ?? params.lng);
	const hasValidGeo = numberIsValidCoordinate(latitude, longitude);

	if (sort === "distance" && hasValidGeo) {
		const geoNear: { type: "Point"; coordinates: [number, number] } = {
			type: "Point",
			coordinates: [longitude!, latitude!],
		};
		const pipeline: PipelineStage[] = [
			{
				$geoNear: {
					near: geoNear,
					distanceField: "distance",
					spherical: true,
					key: "location",
					query: filter,
					...{},
				},
			},
			{ $sort: { ...premiumSort, distance: 1 } },
			{ $skip: skip },
			{ $limit: limit },
		];
		const data = (await Facility.aggregate(pipeline).exec()) as FacilityRecord[];
		const total = await Facility.countDocuments(filter);
		return {
			data,
			total: Number(total),
			page,
			limit,
		};
	}

	if (sort === "capacity") {
		const data = (await Facility.aggregate([
			{ $match: filter },
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
			{ $sort: { ...premiumSort, availableSeats: -1, lastSyncedAt: -1 } },
			{ $skip: skip },
			{ $limit: limit },
		]).exec()) as FacilityRecord[];
		const total = await Facility.countDocuments(filter);
		return {
			data,
			total: Number(total),
			page,
			limit,
		};
	}

	const data = (await Facility.find(filter)
		.sort({ ...premiumSort, rating: -1, reviewCount: -1, lastSyncedAt: -1 })
		.skip(skip)
		.limit(limit)
		.lean()
		.exec()) as FacilityRecord[];
	const total = await Facility.countDocuments(filter);
	return {
		data,
		total: Number(total),
		page,
		limit,
	};
}

export async function findNearby(params: NearbyFacilityParams): Promise<FacilityRecord[]> {
	const latitude = toNumber(params.latitude);
	const longitude = toNumber(params.longitude);
	if (!numberIsValidCoordinate(latitude, longitude)) {
		throw new ApiError("유효하지 않은 좌표입니다", 400);
	}
	if (params.maxDistanceMeters !== undefined && params.maxDistanceMeters <= 0) {
		throw new ApiError("유효하지 않은 반경 값입니다", 400);
	}

	const limit = normalizeLimit(params.limit, DEFAULT_NEARBY_LIMIT);
	const query: Record<string, unknown> = {};
	if (params.type) query.type = params.type;
	if (params.status) query.status = params.status;

	const geoNear: { type: "Point"; coordinates: [number, number] } = {
		type: "Point",
		coordinates: [longitude!, latitude!],
	};
	const pipeline: PipelineStage[] = [
		{
			$geoNear: {
				near: geoNear,
				distanceField: "distance",
				query,
				key: "location",
				spherical: true,
				...(params.maxDistanceMeters !== undefined
					? { maxDistance: params.maxDistanceMeters }
					: {}),
			},
		},
		{ $sort: { distance: 1 } },
		{ $limit: limit },
	];

	return (await Facility.aggregate(pipeline).exec()) as FacilityRecord[];
}

export const facilityService = {
	findById: async (id: string) => toFacilityDTO(await findById(id)),
	search: async (params: FacilitySearchParams): Promise<FacilitySearchApiResult> => {
		const result = await search(params);
		return {
			data: result.data.map((facility) => toFacilityDTO(facility, facility.distance)),
			pagination: {
				page: result.page,
				limit: result.limit,
				total: result.total,
				totalPages: result.total === 0 ? 0 : Math.ceil(result.total / result.limit),
			},
		};
	},
	findNearby,
};
