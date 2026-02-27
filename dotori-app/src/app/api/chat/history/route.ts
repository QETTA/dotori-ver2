import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import ChatHistory from "@/models/ChatHistory";

const QUICK_REPLIES_FIELD: string[] = ["quickReplies", "quick_replies"];

function getQuickRepliesFromMessage(raw: Record<string, unknown>): string[] {
	const metadata = raw.metadata as Record<string, unknown> | undefined;
	for (const field of QUICK_REPLIES_FIELD) {
		const value = metadata?.[field];
		if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
			return value;
		}
		const directValue = raw[field];
		if (Array.isArray(directValue) && directValue.every((item) => typeof item === "string")) {
			return directValue as string[];
		}
	}
	return [];
}

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
			quick_replies: getQuickRepliesFromMessage(m as Record<string, unknown>),
			blocks: m.blocks,
		}),
	);

	return NextResponse.json({ data: { messages } });
}, { auth: true, rateLimiter: relaxedLimiter });

export const DELETE = withApiHandler(async (_req, { userId }) => {
	const chatHistory = await ChatHistory.findOne({ userId });
	if (!chatHistory) {
		return NextResponse.json({ data: { deleted: true } });
	}

	chatHistory.messages = [];
	await chatHistory.save();

	return NextResponse.json({ data: { deleted: true } });
}, { auth: true, rateLimiter: relaxedLimiter });
