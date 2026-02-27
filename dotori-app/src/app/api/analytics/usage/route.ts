import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import UsageLog, { type UsageType } from "@/models/UsageLog";

const getCurrentMonth = (): string => new Date().toISOString().slice(0, 7);

export const GET = withApiHandler(async (_req, { userId }) => {
	const month = getCurrentMonth();

	const usages = await UsageLog.find(
		{ userId, month },
		{ type: 1, count: 1, _id: 0 },
	).lean<{ type: UsageType; count: number }[]>();

	const totals = { chat: 0, alert: 0, export: 0 };

	for (const item of usages) {
		if (item.type === "chat" || item.type === "alert") {
			totals[item.type] += item.count || 0;
		}
	}

	return NextResponse.json({
		chat: totals.chat,
		alert: totals.alert,
		limits: {
			free: { chat: 5 },
			premium: { chat: -1 },
		},
	});
}, { rateLimiter: relaxedLimiter });
