import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import Alert from "@/models/Alert";
// Facility must be imported so Mongoose registers the model for populate()
import "@/models/Facility";

interface PopulatedFacility {
	_id: unknown;
	name: string;
	type: string;
	status: string;
	address: string;
	capacity: { total: number; current: number; waiting: number };
}

export const GET = withApiHandler(async (_req, { userId }) => {
	const alerts = await Alert.find({
		userId,
		active: true,
		lastTriggeredAt: { $exists: true },
	})
		.select("type facilityId channels lastTriggeredAt createdAt")
		.populate("facilityId", "name type status address capacity")
		.sort({ lastTriggeredAt: -1 })
		.limit(50)
		.lean();

	const notifications = alerts.map((alert) => {
		// After populate + lean, facilityId is either a plain facility object or null
		const fac = alert.facilityId as unknown as PopulatedFacility | null;

		return {
			id: String(alert._id),
			type: alert.type,
			facility: fac
				? {
						_id: String(fac._id),
						name: fac.name,
						type: fac.type,
						status: fac.status,
						address: fac.address,
						capacity: {
							total: fac.capacity?.total ?? 0,
							current: fac.capacity?.current ?? 0,
							waiting: fac.capacity?.waiting ?? 0,
						},
					}
				: null,
			channels: alert.channels,
			triggeredAt:
				alert.lastTriggeredAt instanceof Date
					? alert.lastTriggeredAt.toISOString()
					: String(alert.lastTriggeredAt ?? alert.createdAt),
			createdAt:
				alert.createdAt instanceof Date
					? alert.createdAt.toISOString()
					: String(alert.createdAt),
		};
	});

	return NextResponse.json({ data: notifications });
}, { rateLimiter: relaxedLimiter });
