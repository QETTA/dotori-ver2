import { NextResponse } from "next/server";
import { withApiHandler, NotFoundError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { alertCreateSchema } from "@/lib/validations";
import Alert from "@/models/Alert";
import Facility from "@/models/Facility";

export const GET = withApiHandler(async (_req, { userId }) => {
	const filter = { userId, active: true };
	const [alerts, total] = await Promise.all([
		Alert.find(filter)
			.select("facilityId type channels active lastTriggeredAt createdAt condition")
			.populate("facilityId")
			.sort({ createdAt: -1 })
			.lean(),
		Alert.countDocuments(filter),
	]);

	return NextResponse.json({
		data: alerts,
		pagination: { page: 1, limit: total, total, totalPages: 1 },
	});
}, { rateLimiter: standardLimiter });

export const POST = withApiHandler(async (_req, { userId, body }) => {
	const facilityExists = await Facility.exists({ _id: body.facilityId });
	if (!facilityExists) {
		throw new NotFoundError("시설을 찾을 수 없습니다");
	}

	const alert = await Alert.create({
		userId,
		facilityId: body.facilityId,
		type: body.type || "vacancy",
		condition: body.condition || {},
		channels: body.channels || ["push"],
	});

	return NextResponse.json({ data: alert }, { status: 201 });
}, { schema: alertCreateSchema, rateLimiter: standardLimiter });
