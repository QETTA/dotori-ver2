import { NextResponse } from "next/server";
import { withApiHandler, NotFoundError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/sanitize";
import User from "@/models/User";

export const GET = withApiHandler(async (_req, { userId }) => {
	const user = await User.findById(userId).lean();
	if (!user) {
		throw new NotFoundError("사용자를 찾을 수 없습니다");
	}

	return NextResponse.json({ data: user });
}, { rateLimiter: standardLimiter });

export const PATCH = withApiHandler(async (req, { userId }) => {
	const body = await req.json();

	const allowedFields = [
		"nickname",
		"children",
		"region",
		"preferences",
		"gpsVerified",
		"onboardingCompleted",
		"phone",
		"alimtalkOptIn",
	];
	const stringFields = ["nickname", "phone"];
	const update: Record<string, unknown> = {};
	for (const key of allowedFields) {
		if (key in body) {
			if (stringFields.includes(key) && typeof body[key] === "string") {
				update[key] = sanitizeString(body[key]);
			} else if (key === "region" && typeof body[key] === "object" && body[key] !== null) {
				const region = body[key] as Record<string, unknown>;
				update[key] = {
					sido: typeof region.sido === "string" ? sanitizeString(region.sido) : "",
					sigungu: typeof region.sigungu === "string" ? sanitizeString(region.sigungu) : "",
					dong: typeof region.dong === "string" ? sanitizeString(region.dong) : "",
				};
			} else {
				update[key] = body[key];
			}
		}
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
}, { rateLimiter: standardLimiter });
