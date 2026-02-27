import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter, standardLimiter } from "@/lib/rate-limit";
import { addInterest, removeInterest } from "@/lib/services/interest-service";
import { interestSchema } from "@/lib/validations";
import User from "@/models/User";
import "@/models/Facility";

/** GET /api/users/me/interests — 관심 시설 목록 (populate) */
export const GET = withApiHandler(async (_req, { userId }) => {
	const user = await User.findById(userId)
		.populate("interests", "name type status address capacity features lastSyncedAt")
		.lean();

	if (!user) {
		return NextResponse.json({ data: [] });
	}

	const facilities = (user.interests ?? []).map((fac) => {
		if (!fac || typeof fac !== "object") return null;
		const f = fac as unknown as Record<string, unknown>;
		const cap = f.capacity && typeof f.capacity === "object"
			? f.capacity as Record<string, unknown>
			: null;
		return {
			id: String(f._id ?? f.id),
			name: typeof f.name === "string" ? f.name : "시설",
			type: typeof f.type === "string" ? f.type : "",
			status: typeof f.status === "string" ? f.status : "",
			address: typeof f.address === "string" ? f.address : "",
			capacity: {
				total: typeof cap?.total === "number" ? cap.total : 0,
				current: typeof cap?.current === "number" ? cap.current : 0,
				waiting: typeof cap?.waiting === "number" ? cap.waiting : 0,
			},
		};
	}).filter(Boolean);

	return NextResponse.json({ data: facilities });
}, { rateLimiter: relaxedLimiter });

export const POST = withApiHandler(async (_req, { userId, body }) => {
	const result = await addInterest(userId, body.facilityId);
	return NextResponse.json({
		data: { interestsCount: result.interestsCount },
	});
}, { schema: interestSchema, rateLimiter: standardLimiter });

export const DELETE = withApiHandler(async (_req, { userId, body }) => {
	await removeInterest(userId, body.facilityId);
	return NextResponse.json({ data: { success: true } });
}, { schema: interestSchema, rateLimiter: standardLimiter });
