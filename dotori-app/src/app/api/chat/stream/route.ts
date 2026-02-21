import Anthropic from "@anthropic-ai/sdk";
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
const AI_MODEL = process.env.AI_MODEL || "claude-sonnet-4-6";
const AI_TIMEOUT_MS = 15_000;
const STREAM_SYSTEM_PROMPT = `당신은 도토리 앱의 "토리"입니다. 어린이집·유치원 찾기 AI 어시스턴트로, 부모 관점에서 친절하고 간결하게 도와주세요.`;

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

function getAnthropicClient(): Anthropic | null {
	const apiKey = process.env.ANTHROPIC_API_KEY || "";
	if (!apiKey) {
		log.warn("ANTHROPIC_API_KEY가 설정되지 않았습니다");
		return null;
	}

	return new Anthropic({
		apiKey,
		timeout: AI_TIMEOUT_MS,
	});
}

function buildFacilityContext(blocks: ChatBlock[]): string {
	const seenNames = new Set<string>();
	const lines: string[] = [];

	for (const block of blocks) {
		if (block.type === "facility_list" || block.type === "compare") {
			for (const facility of block.facilities) {
				if (seenNames.has(facility.name)) continue;
				seenNames.add(facility.name);

				const waitLabel =
					facility.status === "available"
						? `여석 ${facility.capacity.total - facility.capacity.current}명`
						: facility.status === "waiting"
							? `대기 ${facility.capacity.waiting}명`
							: "정원 마감";

				lines.push(
					`- ${facility.name} (${facility.type}, ${facility.status}, 정원 ${facility.capacity.total}명/현원 ${facility.capacity.current}명, ${waitLabel}, 평점 ${facility.rating.toFixed(1)})`,
				);
				lines.push(`  주소: ${facility.address}`);
				if (facility.evaluationGrade) {
					lines.push(`  평가인증 ${facility.evaluationGrade}등급`);
				}
				if (facility.features.length > 0) {
					lines.push(`  특징: ${facility.features.join(", ")}`);
				}
			}
		}
	}

	if (lines.length === 0) return "";
	return `[검색된 시설 데이터]\n${lines.join("\n")}`;
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
			let assistantContent = "";
			let hasStreamingText = false;

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

				const facilityContext = buildFacilityContext(response.blocks);
				const streamInput = facilityContext
					? `${facilityContext}\n\n사용자 질문:\n${message}`
					: message;
				const streamMessages: { role: "user" | "assistant"; content: string }[] = [
					...previousMessages.map((m) => ({
						role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
						content: m.content,
					})),
					{ role: "user" as const, content: streamInput },
				];

				const anthropicClient = getAnthropicClient();
				if (anthropicClient) {
					try {
						const responseStream = await anthropicClient.messages.stream({
							model: AI_MODEL,
							max_tokens: 1500,
							messages: streamMessages,
							system: STREAM_SYSTEM_PROMPT,
						});

						for await (const chunk of responseStream) {
							if (
								chunk.type === "content_block_delta" &&
								chunk.delta.type === "text_delta"
							) {
								hasStreamingText = true;
								assistantContent += chunk.delta.text;
								emitEvent(controller, encoder, {
									type: "text",
									text: chunk.delta.text,
								});
							}
						}
						await responseStream.finalMessage();
					} catch (err) {
						const streamError = err instanceof Error ? err.message : "unknown";
						log.error("Anthropic 실시간 응답 처리 실패", {
							intent,
							error: streamError,
						});
					}
				}

				if (!hasStreamingText) {
					assistantContent = response.content;
					emitEvent(controller, encoder, {
						type: "text",
						text: response.content,
					});
				}

				if (!assistantContent) {
					assistantContent = "요청하신 응답을 생성하지 못했어요. 잠시 후 다시 시도해주세요.";
				}

				const assistantTimestamp = new Date();
				const assistantMessage = {
					role: "assistant" as const,
					content: assistantContent,
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
				const errorMessage = err instanceof Error
					? err.message
					: "요청 처리 중 문제가 발생했습니다.";
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
