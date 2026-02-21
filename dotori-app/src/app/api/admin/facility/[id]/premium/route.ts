import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { withApiHandler, BadRequestError, NotFoundError } from "@/lib/api-handler";
import Facility from "@/models/Facility";

const premiumUpdateSchema = z.object({
	isActive: z.boolean(),
	plan: z.enum(["basic", "pro"]).default("basic"),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	features: z.array(z.string()).max(50).optional(),
	sortBoost: z.number().min(0).max(1000).default(0),
	verifiedAt: z.coerce.date().optional(),
	contactPerson: z.string().trim().max(80).optional(),
	contactPhone: z.string().trim().max(80).optional(),
	contactEmail: z.string().trim().email().max(254).optional(),
}).strict();

type PremiumUpdatePayload = z.infer<typeof premiumUpdateSchema>;

type StoredPremium = {
	isActive?: boolean;
	plan?: "basic" | "pro";
	startDate?: Date | string;
	endDate?: Date | string;
	features?: string[];
	sortBoost?: number;
	verifiedAt?: Date | string;
	contactPerson?: string;
	contactPhone?: string;
	contactEmail?: string;
};

const normalizeDate = (value?: Date | string): Date | undefined => {
	if (value instanceof Date) {
		return value;
	}
	if (typeof value === "string" && value.trim().length > 0) {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? undefined : parsed;
	}
	return undefined;
};

const normalizeFeatureList = (values: string[]): string[] => {
	return values
		.map((value) => value.trim())
		.filter((value) => value.length > 0);
};

const ensureAuthorized = (req: Request): boolean => {
	const secret = process.env.CRON_SECRET;
	const authorization = req.headers.get("authorization");
	return Boolean(secret && authorization === `Bearer ${secret}`);
};

export const PUT = withApiHandler<PremiumUpdatePayload>(async (_req, { params, body }) => {
	if (!ensureAuthorized(_req)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const facilityId = params.id;
	if (!mongoose.Types.ObjectId.isValid(facilityId)) {
		throw new BadRequestError("유효하지 않은 시설 ID입니다");
	}

	const facility = await Facility.findById(facilityId)
		.select("_id premium")
		.lean()
		.exec();
	if (!facility) {
		throw new NotFoundError("시설을 찾을 수 없습니다");
	}

	const currentPremium = (facility as { premium?: StoredPremium }).premium;
	const nextPremium = {
		isActive: body.isActive,
		plan: body.plan ?? currentPremium?.plan ?? "basic",
		startDate: normalizeDate(body.startDate) ?? normalizeDate(currentPremium?.startDate) ?? new Date(),
		endDate: normalizeDate(body.endDate) ?? normalizeDate(currentPremium?.endDate) ?? new Date(),
		features: normalizeFeatureList(
			typeof body.features === "undefined"
				? currentPremium?.features ?? []
				: body.features,
		),
		sortBoost: body.sortBoost ?? currentPremium?.sortBoost ?? 0,
		verifiedAt: body.verifiedAt ?? normalizeDate(currentPremium?.verifiedAt),
		contactPerson: body.contactPerson ?? currentPremium?.contactPerson,
		contactPhone: body.contactPhone ?? currentPremium?.contactPhone,
		contactEmail: body.contactEmail ?? currentPremium?.contactEmail,
	};

	const updatedFacility = await Facility.findByIdAndUpdate(
		facilityId,
		{
			$set: {
				isPremium: body.isActive,
				premium: nextPremium,
			},
		},
		{ new: true },
	).select("isPremium premium");

	return NextResponse.json(
		{
			data: {
				id: facilityId,
				isPremium: Boolean(updatedFacility?.isPremium),
				premium: updatedFacility?.premium,
			},
		},
		{ status: 200 },
	);
}, { auth: false, schema: premiumUpdateSchema });
