import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import Alert from "@/models/Alert";
// Facility must be imported so Mongoose registers the model for populate()
import "@/models/Facility";

interface NotificationFacility {
	_id: string;
	name: string;
	type: string;
	status: string;
	address: string;
	capacity: { total: number; current: number; waiting: number };
}

function toFiniteNumber(value: unknown, fallback = 0): number {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toNotificationFacility(value: unknown): NotificationFacility | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as Record<string, unknown>;
	const id = record._id ?? record.id;
	if (id == null) {
		return null;
	}

	const capRecord =
		record.capacity && typeof record.capacity === "object"
			? (record.capacity as Record<string, unknown>)
			: null;

	return {
		_id: String(id),
		name: typeof record.name === "string" ? record.name : "시설",
		type: typeof record.type === "string" ? record.type : "",
		status: typeof record.status === "string" ? record.status : "waiting",
		address: typeof record.address === "string" ? record.address : "",
		capacity: {
			total: toFiniteNumber(capRecord?.total),
			current: toFiniteNumber(capRecord?.current),
			waiting: toFiniteNumber(capRecord?.waiting),
		},
	};
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
		const facility = toNotificationFacility(alert.facilityId);

		return {
			id: String(alert._id),
			type: alert.type,
			facility,
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
