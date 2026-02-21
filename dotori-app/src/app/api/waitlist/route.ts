import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { toFacilityDTO } from "@/lib/dto";
import { applyWaitlist } from "@/lib/services/waitlist-service";
import { waitlistCreateSchema } from "@/lib/validations";
import Waitlist from "@/models/Waitlist";

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

	const filter = { userId, status: { $ne: "cancelled" } as const };
	const [waitlists, total] = await Promise.all([
		Waitlist.find(filter)
			.select(
				"facilityId childName childBirthDate ageClass position previousPosition status checklist appliedAt estimatedDate",
			)
			.populate("facilityId")
			.sort({ appliedAt: -1 })
			.lean(),
		Waitlist.countDocuments(filter),
	]);

	// Transform populated facilityId to DTO (prevent leaking internal fields)
	const data = waitlists.map((w) => ({
		...w,
		facilityId: w.facilityId && typeof w.facilityId === "object" && "name" in w.facilityId
			? toFacilityDTO(w.facilityId as unknown as Parameters<typeof toFacilityDTO>[0])
			: w.facilityId,
	}));

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
		return NextResponse.json(
			{ error: result.error },
			{ status: result.status ?? 400 },
		);
	}

	return NextResponse.json(
		{
			data: result.waitlist,
			position: result.position,
		},
		{ status: 201 },
	);
}, { schema: waitlistCreateSchemaWithFlags, rateLimiter: standardLimiter });
