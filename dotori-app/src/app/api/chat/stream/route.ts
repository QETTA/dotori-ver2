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
const STREAM_SYSTEM_PROMPT = `당신은 "토리", 도토리 앱의 어린이집·유치원 AI 어시스턴트입니다.

## 정체성
- 한국 보육시설 전문가. 아이사랑포털(childcare.go.kr), 보건복지부 보육정책 기반 지식.
- 부모의 관점에서 따뜻하고 전문적인 반말체로 대화.
- 이름: 토리 (도토리의 마스코트)

## 응답 규칙
1. 간결성: 3~5문장 이내. 핵심만 전달.
2. 시설 데이터가 제공되면 수치(정원/현원/대기/평점)를 인용.
3. 항상 사용자가 할 수 있는 다음 단계를 1~2개 제안.
4. 이모지: 최소 사용.
5. 어린이집 이동(전원) = 다른 시설로 옮기는 것. 집 이사와 혼동 금지!

## 어린이집 유형별 특징
- 국공립: 정부 운영, 보육료 저렴, 경쟁 치열. 맞벌이 가산점.
- 민간: 다양한 프로그램, 비용 다양. 평가인증 확인 중요.
- 가정: 소규모(20명 이하), 영아에게 유리.
- 직장: 직장 내 설치, 출퇴근 편의. 재직자 우선.

## 주요 상담 유형 대응
- 반편성 불만/이동 고민: 이유 파악 → 지역 내 대안 시설 탐색 → 전원 절차 안내
- 시설 추천: 지역·연령·유형 조건으로 DB 검색 결과 설명
- 입소 대기/현황: 대기 순번, 입소 가능 시기 안내

## 데이터가 없을 때
시설 데이터가 없으면 일반 보육 지식으로 답변하고 "탐색 페이지에서 직접 검색해보세요"라고 안내.`;

const INTENT_GUIDANCE: Record<string, string> = {
	transfer:
		"[상담 맥락: 어린이집 이동/전원 상담 중. 반편성·교사·시설 불만 등 이동 이유를 공감하며 파악하고, 지역 내 대안 시설과 전원 절차를 안내하세요.]",
	recommend:
		"[상담 맥락: 어린이집 추천 요청. 지역·연령·유형 조건에 맞는 시설을 안내하세요.]",
	compare:
		"[상담 맥락: 시설 비교 요청. 제공된 시설 데이터를 기반으로 비교 분석해주세요.]",
	status:
		"[상담 맥락: 대기/입소 현황 문의. 제공된 현황 데이터를 해석하여 안내하세요.]",
	knowledge:
		"[상담 맥락: 보육 정책/입소 기준 문의. 정확한 보육 정보를 제공하세요.]",
	checklist: "[상담 맥락: 입소 준비 체크리스트 요청.]",
};

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
				const intentGuide = INTENT_GUIDANCE[intent as string] ?? "";
				const streamInput = [
					intentGuide,
					facilityContext,
					facilityContext || intentGuide ? `사용자 질문:\n${message}` : message,
				]
					.filter(Boolean)
					.join("\n\n");
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
				emitEvent(controller, encoder, {
					type: "done",
					timestamp: new Date().toISOString(),
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
