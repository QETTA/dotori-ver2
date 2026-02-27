import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { withApiHandler, NotFoundError, ConflictError, BadRequestError } from "@/lib/api-handler";
import { createRateLimiter, standardLimiter } from "@/lib/rate-limit";
import { toFacilityDTO } from "@/lib/dto";
import { applyWaitlist } from "@/lib/services/waitlist-service";
import { waitlistCreateSchema } from "@/lib/validations";
import Waitlist from "@/models/Waitlist";

/** 20 req/min — waitlist write operations */
const waitlistWriteLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

function toFiniteNumber(value: unknown, fallback = 0): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function looksLikePopulatedFacility(value: unknown): value is Record<string, unknown> {
	if (!value || typeof value !== "object") {
		return false;
	}

	const record = value as Record<string, unknown>;
	return (
		"name" in record ||
		"type" in record ||
		"status" in record ||
		"address" in record ||
		"capacity" in record
	);
}

function toWaitlistFacilityDTO(value: unknown): ReturnType<typeof toFacilityDTO> | null {
	if (!looksLikePopulatedFacility(value)) {
		return null;
	}

	const record = value as Record<string, unknown>;
	const capRecord =
		record.capacity && typeof record.capacity === "object"
			? (record.capacity as Record<string, unknown>)
			: null;

	const doc: Parameters<typeof toFacilityDTO>[0] = {
		_id: record._id,
		id: typeof record.id === "string" ? record.id : undefined,
		name: typeof record.name === "string" ? record.name : "시설",
		type: typeof record.type === "string" ? record.type : "민간",
		status: typeof record.status === "string" ? record.status : "waiting",
		address: typeof record.address === "string" ? record.address : "",
		capacity: {
			total: toFiniteNumber(capRecord?.total),
			current: toFiniteNumber(capRecord?.current),
			waiting: toFiniteNumber(capRecord?.waiting),
		},
		features: Array.isArray(record.features)
			? record.features.filter((feature): feature is string => typeof feature === "string")
			: undefined,
		lastSyncedAt:
			record.lastSyncedAt instanceof Date ||
			typeof record.lastSyncedAt === "string"
				? record.lastSyncedAt
				: undefined,
	};

	return toFacilityDTO(doc);
}

const waitlistCreateSchemaWithFlags = waitlistCreateSchema.extend({
	hasMultipleChildren: z.boolean().optional(),
	isDualIncome: z.boolean().optional(),
	isSingleParent: z.boolean().optional(),
	hasDisability: z.boolean().optional(),
});

export const GET = withApiHandler(async (req, { userId }) => {
	// Support ?count=true for dashboard widget
	const countOnly = req.nextUrl.searchParams.get("count") === "true";
	if (countOnly) {
		const count = await Waitlist.countDocuments({
			userId,
			status: { $ne: "cancelled" },
		});
		return NextResponse.json({ data: { count } });
	}

	const userObjectId = new mongoose.Types.ObjectId(userId);
	const matchStage = { userId: userObjectId, status: { $ne: "cancelled" } };
	const [waitlists, totalResult] = await Promise.all([
		Waitlist.aggregate([
			{ $match: matchStage },
			{ $sort: { appliedAt: -1 as const } },
			{
				$lookup: {
					from: "facilities",
					localField: "facilityId",
					foreignField: "_id",
					as: "_facility",
					pipeline: [
						{
							$project: {
								name: 1, type: 1, status: 1, address: 1,
								capacity: 1, features: 1, lastSyncedAt: 1,
							},
						},
					],
				},
			},
			{ $unwind: { path: "$_facility", preserveNullAndEmptyArrays: true } },
			{
				$project: {
					facilityId: 1, childName: 1, childBirthDate: 1, ageClass: 1,
					position: 1, previousPosition: 1, status: 1, checklist: 1,
					appliedAt: 1, estimatedDate: 1, _facility: 1,
				},
			},
		]),
		Waitlist.aggregate([
			{ $match: matchStage },
			{ $count: "total" },
		]),
	]);
	const total = totalResult[0]?.total ?? 0;

	// Transform facility to DTO (prevent leaking internal fields)
	const data = waitlists.map((w) => {
		const facilityDTO = w._facility ? toWaitlistFacilityDTO(w._facility) : null;
		const { _facility, ...rest } = w;
		return {
			...rest,
			facilityId: facilityDTO ?? rest.facilityId,
		};
	});

	return NextResponse.json({
		data,
		pagination: { page: 1, limit: total, total, totalPages: 1 },
	});
}, { rateLimiter: standardLimiter });

export const POST = withApiHandler(async (_req, { userId, body }) => {
	const result = await applyWaitlist({
		userId,
		facilityId: body.facilityId,
		childName: body.childName,
		childBirthDate: body.childBirthDate,
		hasMultipleChildren: body.hasMultipleChildren ?? false,
		isDualIncome: body.isDualIncome ?? false,
		isSingleParent: body.isSingleParent ?? false,
		hasDisability: body.hasDisability ?? false,
	});

	if (!result.success) {
		const status = result.status ?? 400;
		if (status === 404) throw new NotFoundError(result.error);
		if (status === 409) throw new ConflictError(result.error);
		throw new BadRequestError(result.error);
	}

	return NextResponse.json(
		{
			data: result.waitlist,
			position: result.position,
		},
		{ status: 201 },
	);
}, { schema: waitlistCreateSchemaWithFlags, rateLimiter: waitlistWriteLimiter });
