import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { log } from "@/lib/logger";
import dbConnect from "@/lib/db";
import { strictLimiter } from "@/lib/rate-limit";
import { parseBody, chatMessageSchema } from "@/lib/validations";
import { sanitizeString } from "@/lib/sanitize";
import { classifyIntent } from "@/lib/engine/intent-classifier";
import {
	buildResponse,
	extractConversationContext,
} from "@/lib/engine/response-builder";
import ChatHistory, { type IChatHistory } from "@/models/ChatHistory";
import type { ChatBlock } from "@/types/dotori";
import type { ChatIntent } from "@/lib/engine/intent-classifier";

const MAX_CHAT_MESSAGES = 200;

type StartEvent = {
	type: "start";
	intent: ChatIntent;
};

type BlockEvent = {
	type: "block";
	block: ChatBlock;
};

type TextEvent = {
	type: "text";
	text: string;
};

type DoneEvent = {
	type: "done";
	timestamp: string;
};

type ErrorEvent = {
	type: "error";
	error: string;
};

type StreamEvent = StartEvent | BlockEvent | TextEvent | DoneEvent | ErrorEvent;

function emitEvent(
	controller: ReadableStreamDefaultController<Uint8Array>,
	encoder: TextEncoder,
	event: StreamEvent,
) {
	controller.enqueue(
		encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
	);
}

function isAuthUserId(userId: unknown): userId is string {
	return typeof userId === "string" && userId.length > 0;
}

export const POST = async (req: NextRequest) => {
	const limited = strictLimiter.check(req);
	if (limited) return limited;

	let rawBody: unknown;
	try {
		rawBody = await req.json();
	} catch {
		return NextResponse.json({ error: "유효하지 않은 JSON입니다" }, { status: 400 });
	}

	const parsed = parseBody(chatMessageSchema, rawBody);
	if (!parsed.success) return parsed.response;

	const message = sanitizeString(parsed.data.message);
	const session = await auth();
	const userId = session?.user?.id;

		const encoder = new TextEncoder();

		const stream = new ReadableStream({
			async start(controller) {
			let chatHistory: IChatHistory | null = null;

			try {
				await dbConnect();

				if (isAuthUserId(userId)) {
					chatHistory = await ChatHistory.findOne({ userId }).sort({
						createdAt: -1,
					});
					if (!chatHistory) {
						chatHistory = await ChatHistory.create({
							userId,
							messages: [],
						});
					}
				}

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

				emitEvent(controller, encoder, {
					type: "start",
					intent,
				});

				const response = await buildResponse(
					intent,
					message,
					isAuthUserId(userId) ? userId : undefined,
					conversationContext,
				);

				for (const block of response.blocks) {
					emitEvent(controller, encoder, {
						type: "block",
						block,
					});
				}

				for (let i = 0; i < response.content.length; i += 12) {
					emitEvent(controller, encoder, {
						type: "text",
						text: response.content.slice(i, i + 12),
					});
				}

				const assistantTimestamp = new Date();
				const assistantMessage = {
					role: "assistant" as const,
					content: response.content,
					timestamp: assistantTimestamp,
					blocks: response.blocks,
				};

				if (chatHistory) {
					const userMessage = {
						role: "user" as const,
						content: message,
						timestamp: assistantTimestamp,
					};
					chatHistory.messages.push(userMessage);
					chatHistory.messages.push(assistantMessage);
					if (chatHistory.messages.length > MAX_CHAT_MESSAGES) {
						chatHistory.messages = chatHistory.messages.slice(-MAX_CHAT_MESSAGES);
					}
					await chatHistory.save();
				}

				emitEvent(controller, encoder, {
					type: "done",
					timestamp: assistantTimestamp.toISOString(),
				});
				controller.close();
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "요청 처리 중 문제가 발생했습니다.";
				log.error("Chat stream 처리 실패", { error: errorMessage });
				emitEvent(controller, encoder, {
					type: "error",
					error: "채팅을 생성하지 못했어요. 잠시 후 다시 시도해주세요.",
				});
				controller.close();
			}
		},
	});

	return new NextResponse(stream, {
		headers: {
			"Content-Type": "text/event-stream; charset=utf-8",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no",
		},
	});
};
