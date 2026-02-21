import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import ChatHistory from "@/models/ChatHistory";

export const GET = withApiHandler(async (_req, { userId }) => {
	const chatHistory = await ChatHistory.findOne({
		userId,
	})
		.sort({ updatedAt: -1 })
		.lean();

	if (!chatHistory) {
		return NextResponse.json({ data: { messages: [] } });
	}

	const messages = chatHistory.messages.map(
		(m: Record<string, unknown>, i: number) => ({
			id: String((m as { _id?: unknown })._id ?? `msg-${i}`),
			role: m.role as string,
			content: m.content as string,
			timestamp:
				m.timestamp instanceof Date
					? m.timestamp.toISOString()
					: String(m.timestamp),
			blocks: m.blocks,
		}),
	);

	return NextResponse.json({ data: { messages } });
}, { auth: true, rateLimiter: relaxedLimiter });
