import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { withApiHandler, BadRequestError, NotFoundError } from "@/lib/api-handler";
import Facility from "@/models/Facility";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const premiumProfileUpdateSchema = z.object({
	isPremium: z.boolean(),
	directorMessage: z.string().trim().max(1000).optional(),
	highlights: z.array(z.string()).max(20).optional(),
	programs: z.array(z.string()).max(20).optional(),
	photos: z.array(z.string()).max(20).optional(),
});

type PremiumProfileUpdatePayload = z.infer<typeof premiumProfileUpdateSchema>;

type PremiumProfileUpdate = {
	directorMessage?: string;
	highlights?: string[];
	programs?: string[];
	photos?: string[];
};

const trimStringList = (values: string[]): string[] => {
	const nextValues = values.map((value) => value.trim()).filter((item) => item.length > 0);
	return nextValues;
};

export const POST = withApiHandler<PremiumProfileUpdatePayload>(async (_req, { params, body }) => {
	const secret = process.env.CRON_SECRET;
	const authHeader = _req.headers.get("authorization");
	if (!secret || authHeader !== `Bearer ${secret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new BadRequestError("유효하지 않은 시설 ID입니다");
	}

	const facility = await Facility.findById(id).select("_id premiumProfile").lean();
	if (!facility) {
		throw new NotFoundError("시설을 찾을 수 없습니다");
	}

	const update: {
		$set: Record<string, unknown>;
		$unset?: Record<string, string>;
	} = {
		$set: {
			isPremium: body.isPremium,
		},
	};
	if (body.isPremium) {
		const nextProfile: PremiumProfileUpdate = facility?.premiumProfile
			? { ...(facility.premiumProfile as PremiumProfileUpdate) }
			: {};

		if (body.directorMessage !== undefined) {
			const directorMessage = body.directorMessage.trim();
			if (directorMessage) {
				nextProfile.directorMessage = directorMessage;
			} else {
				delete nextProfile.directorMessage;
			}
		}

		if (body.highlights !== undefined) {
			const highlights = trimStringList(body.highlights);
			if (highlights.length > 0) {
				nextProfile.highlights = highlights;
			} else {
				delete nextProfile.highlights;
			}
		}

		if (body.programs !== undefined) {
			const programs = trimStringList(body.programs);
			if (programs.length > 0) {
				nextProfile.programs = programs;
			} else {
				delete nextProfile.programs;
			}
		}

		if (body.photos !== undefined) {
			const photos = trimStringList(body.photos);
			if (photos.length > 0) {
				nextProfile.photos = photos;
			} else {
				delete nextProfile.photos;
			}
		}

		update.$set.premiumExpiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
		update.$set.premiumProfile = nextProfile;
	} else {
		update.$unset = {
			premiumExpiresAt: "",
			premiumProfile: "",
		} as Record<string, string>;
	}

	const updatedFacility = await Facility.findByIdAndUpdate(id, update, {
		new: true,
	}).select("isPremium premiumExpiresAt premiumProfile");

	return NextResponse.json(
		{
			data: {
				id,
				isPremium: updatedFacility?.isPremium || false,
				premiumExpiresAt: updatedFacility?.premiumExpiresAt,
				premiumProfile: updatedFacility?.premiumProfile,
			},
		},
		{ status: 200 },
	);
}, { auth: false, schema: premiumProfileUpdateSchema });

export const DELETE = withApiHandler<never>(async (_req, { params }) => {
	const secret = process.env.CRON_SECRET;
	const authHeader = _req.headers.get("authorization");
	if (!secret || authHeader !== `Bearer ${secret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { id } = params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new BadRequestError("유효하지 않은 시설 ID입니다");
	}

	await Facility.findByIdAndUpdate(id, {
		$set: { isPremium: false },
		$unset: { premiumExpiresAt: "", premiumProfile: "" },
	});

	return NextResponse.json({ data: { id, isPremium: false } }, { status: 200 });
}, { auth: false });
