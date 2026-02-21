import { type NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import type { Session } from "next-auth";
import { z } from "zod";
import { auth } from "@/auth";
import { withApiHandler, BadRequestError, NotFoundError } from "@/lib/api-handler";
import Facility from "@/models/Facility";

const premiumUpdateSchema = z.object({
	isActive: z.boolean(),
	plan: z.enum(["basic", "pro"]).default("basic"),
	features: z.array(z.string()).max(50).optional(),
	sortBoost: z.number().min(0).max(1000).default(0),
}).strict();

type PremiumUpdatePayload = z.infer<typeof premiumUpdateSchema>;

type StoredPremium = {
	isActive?: boolean;
	plan?: "basic" | "pro";
	features?: string[];
	sortBoost?: number;
};

const normalizeFeatureList = (values: string[]): string[] => {
	return values
		.map((value) => value.trim())
		.filter((value) => value.length > 0);
};

const hasValidCronSecret = (req: Request): boolean => {
	const secret = process.env.CRON_SECRET;
	const authorization = req.headers.get("authorization");
	return Boolean(secret && authorization === `Bearer ${secret}`);
};

const hasAdminRole = (session: Session | null): boolean => {
	if (!session?.user?.id) return false;
	const user = session.user as Record<string, unknown>;
	return user.role === "admin";
};

const updateFacilityPremium = async (
	facilityId: string,
	body: PremiumUpdatePayload,
): Promise<NextResponse> => {
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
		features: normalizeFeatureList(
			typeof body.features === "undefined"
				? currentPremium?.features ?? []
				: body.features,
		),
		sortBoost: body.sortBoost ?? currentPremium?.sortBoost ?? 0,
	};

	const updatedFacility = await Facility.findByIdAndUpdate(
		facilityId,
		{
			$set: {
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
};

const putByAdminSession = withApiHandler<PremiumUpdatePayload>(async (_req, { params, body }) => {
	const session = await auth();
	if (!hasAdminRole(session)) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	return updateFacilityPremium(params.id, body);
}, { schema: premiumUpdateSchema });

const putByCronSecret = withApiHandler<PremiumUpdatePayload>(async (_req, { params, body }) => {
	return updateFacilityPremium(params.id, body);
}, { auth: false, schema: premiumUpdateSchema });

type RouteContext = { params: Promise<Record<string, string>> };

export const PUT = async (req: NextRequest, routeCtx: RouteContext): Promise<NextResponse> => {
	if (hasValidCronSecret(req)) {
		return putByCronSecret(req, routeCtx);
	}

	const session = await auth();
	if (!hasAdminRole(session)) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	return putByAdminSession(req, routeCtx);
};
