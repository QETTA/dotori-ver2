import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { strictLimiter } from "@/lib/rate-limit";
import { chatMessageSchema } from "@/lib/validations";
import { sanitizeString } from "@/lib/sanitize";
import { type ChatIntent, classifyIntent } from "@/lib/engine/intent-classifier";
import {
	buildResponse,
	extractConversationContext,
} from "@/lib/engine/response-builder";
import ChatHistory from "@/models/ChatHistory";

const MAX_CHAT_MESSAGES = 200;
const QUICK_REPLIES_BY_INTENT: Record<string, string[]> = {
	transfer: ["근처 대안 시설 찾기", "전원 절차 안내", "서류 체크리스트"],
	recommend: ["더 보기", "지도에서 보기", "비교하기"],
	general: ["이동 고민", "빈자리 탐색", "입소 체크리스트"],
};

function getQuickReplies(intent: ChatIntent): string[] {
	return QUICK_REPLIES_BY_INTENT[intent] ?? [];
}

export const POST = withApiHandler(async (_req, { userId, body }) => {
	const message = sanitizeString(body.message);

	// Get or create chat history (authenticated users only)
	let chatHistory = null;
	if (userId) {
		chatHistory = await ChatHistory.findOne({ userId }).sort({ createdAt: -1 });
		if (!chatHistory) {
			chatHistory = await ChatHistory.create({
				userId,
				messages: [],
			});
		}
	}

	// Save user message
	const userMessage = {
		role: "user" as const,
		content: message,
		timestamp: new Date(),
	};

	if (chatHistory) {
		chatHistory.messages.push(userMessage);
	}

	// Extract conversation context for multi-turn support
	const recentMessages = chatHistory?.messages.slice(-10) ?? [];
	const previousMessages = recentMessages.map((m) => ({
		role: m.role,
		content: m.content,
	}));
	const conversationContext = extractConversationContext(
		recentMessages.map((m) => ({
			role: m.role,
			content: m.content,
			blocks: m.blocks,
		})),
	);
	conversationContext.previousMessages = previousMessages;

	const intent = classifyIntent(message, {
		previousMessages: conversationContext.previousMessages,
	});
	const quickReplies = getQuickReplies(intent);

	// Build response
	const response = await buildResponse(
		intent,
		message,
		userId ?? undefined,
		conversationContext,
	);

	// Save assistant message
	const assistantMessage = {
		role: "assistant" as const,
		content: response.content,
		timestamp: new Date(),
		blocks: response.blocks,
		metadata: {
			intent,
			quickReplies,
		},
	};

	if (chatHistory) {
		chatHistory.messages.push(assistantMessage);
		// Trim to prevent unbounded growth (MongoDB 16MB doc limit)
		if (chatHistory.messages.length > MAX_CHAT_MESSAGES) {
			chatHistory.messages = chatHistory.messages.slice(-MAX_CHAT_MESSAGES);
		}
		await chatHistory.save();
	}

	return NextResponse.json({
		data: {
			role: "assistant",
			content: response.content,
			blocks: response.blocks,
			timestamp: assistantMessage.timestamp.toISOString(),
			intent,
			quick_replies: quickReplies,
		},
	});
}, { auth: false, schema: chatMessageSchema, rateLimiter: strictLimiter });
