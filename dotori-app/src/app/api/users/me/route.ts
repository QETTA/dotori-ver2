import { NextResponse } from "next/server";
import { withApiHandler, NotFoundError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/sanitize";
import { userUpdateSchema } from "@/lib/validations";
import User from "@/models/User";
import type { z } from "zod";

type UserUpdatePayload = z.infer<typeof userUpdateSchema>;

export const GET = withApiHandler(async (_req, { userId }) => {
	const user = await User.findById(userId).lean();
	if (!user) {
		throw new NotFoundError("사용자를 찾을 수 없습니다");
	}

	return NextResponse.json({ data: user });
}, { rateLimiter: standardLimiter });

export const PATCH = withApiHandler<UserUpdatePayload>(async (_req, { userId, body }) => {
	const update: Record<string, unknown> = {};

	if (body.nickname !== undefined) {
		update.nickname = sanitizeString(body.nickname);
	}
	if (body.phone !== undefined) {
		update.phone = sanitizeString(body.phone);
	}
	if (body.children !== undefined) {
		update.children = body.children.map((child) => ({
			...child,
			name: sanitizeString(child.name),
		}));
	}
	if (body.region !== undefined) {
		update.region = {
			sido: sanitizeString(body.region.sido),
			sigungu: sanitizeString(body.region.sigungu),
			dong: sanitizeString(body.region.dong),
		};
	}
	if (body.preferences !== undefined) {
		update.preferences = {
			facilityTypes: body.preferences.facilityTypes.map(sanitizeString),
			features: body.preferences.features.map(sanitizeString),
		};
	}
	if (body.gpsVerified !== undefined) {
		update.gpsVerified = body.gpsVerified;
	}
	if (body.onboardingCompleted !== undefined) {
		update.onboardingCompleted = body.onboardingCompleted;
	}
	if (body.alimtalkOptIn !== undefined) {
		update.alimtalkOptIn = body.alimtalkOptIn;
	}

	const user = await User.findByIdAndUpdate(
		userId,
		{ $set: update },
		{ new: true, runValidators: true },
	).lean();

	if (!user) {
		throw new NotFoundError("사용자를 찾을 수 없습니다");
	}

	return NextResponse.json({ data: user });
}, { schema: userUpdateSchema, rateLimiter: standardLimiter });
