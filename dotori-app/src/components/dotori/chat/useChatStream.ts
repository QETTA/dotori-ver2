"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { ChatBlock, ChatMessage } from "@/types/dotori";
import {
	parseQuickReplies,
	RETRY_ACTION_ID,
	setGuestUsageCount,
} from "@/app/(app)/chat/_lib/chat-config";
import {
	getStreamErrorPayload,
	parseSseEvent,
	type StreamEvent,
} from "@/app/(app)/chat/_lib/chat-stream";

interface UseChatStreamOptions {
	isTrackingUsage: boolean;
	isUsageLoading: boolean;
	isUsageLimitReached: boolean;
	monthKey: string;
	messages: ChatMessage[];
	setInput: Dispatch<SetStateAction<string>>;
	setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
	setUsageCount: Dispatch<SetStateAction<number>>;
	status: "authenticated" | "loading" | "unauthenticated";
	usageCount: number;
	usageLimit: number;
}

interface UseChatStreamResult {
	isLoading: boolean;
	sendMessage: (text: string) => Promise<void>;
	retryLastMessage: () => void;
}

function isAbortError(error: unknown): error is DOMException {
	return error instanceof DOMException && error.name === "AbortError";
}

export function useChatStream({
	isTrackingUsage,
	isUsageLoading,
	isUsageLimitReached,
	monthKey,
	messages,
	setInput,
	setMessages,
	setUsageCount,
	status,
	usageCount,
	usageLimit,
}: UseChatStreamOptions): UseChatStreamResult {
	const [isLoading, setIsLoading] = useState(false);
	const lastPromptRef = useRef("");
	const isMountedRef = useRef(true);
	const activeRequestRef = useRef<AbortController | null>(null);
	const messageSequenceRef = useRef(0);

	useEffect(() => {
		return () => {
			isMountedRef.current = false;
			activeRequestRef.current?.abort();
		};
	}, []);

	const createMessageId = useCallback((prefix: string) => {
		const sequence = ++messageSequenceRef.current;
		return `${prefix}-${Date.now()}-${sequence}`;
	}, []);

	const patchStreamingMessage = useCallback(
		(streamingMessageId: string, patch: Partial<ChatMessage>) => {
			if (!isMountedRef.current) return;
			setMessages((prev) =>
				prev.map((message) =>
					message.id === streamingMessageId
						? { ...message, ...patch }
						: message,
				),
			);
		},
		[setMessages],
	);

	const sendMessage = useCallback(
		async (text: string) => {
			const normalizedText = text.trim();
			if (!normalizedText || isLoading || isUsageLoading || isUsageLimitReached) {
				return;
			}

			activeRequestRef.current?.abort();
			const controller = new AbortController();
			activeRequestRef.current = controller;

			lastPromptRef.current = normalizedText;
			const userMsg: ChatMessage = {
				id: createMessageId("user"),
				role: "user",
				content: normalizedText,
				timestamp: new Date().toISOString(),
			};

			setMessages((prev) => [...prev, userMsg]);
			setInput("");
			setIsLoading(true);

			const streamingMsg: ChatMessage = {
				id: createMessageId("assistant"),
				role: "assistant",
				content: "",
				timestamp: new Date().toISOString(),
				isStreaming: true,
			};
			setMessages((prev) => [...prev, streamingMsg]);

			try {
				const response = await fetch("/api/chat/stream", {
					method: "POST",
					signal: controller.signal,
					headers: {
						"Content-Type": "application/json",
						...(isTrackingUsage && status !== "authenticated"
							? { "x-chat-guest-usage": String(usageCount) }
							: {}),
					},
					body: JSON.stringify({
						message: normalizedText,
					}),
				});

				if (!response.ok || !response.body) {
					if (!isMountedRef.current || controller.signal.aborted) return;
					const errorPayload = await getStreamErrorPayload(response);
					if (!isMountedRef.current || controller.signal.aborted) return;

					setMessages((prev) => prev.filter((message) => message.id !== streamingMsg.id));
					if (errorPayload.isQuotaExceeded) {
						if (isTrackingUsage && usageLimit > 0) {
							setUsageCount((prev) => Math.min(Math.max(prev, usageLimit), usageLimit));
							if (status !== "authenticated") {
								setGuestUsageCount(monthKey, usageLimit);
							}
						}
						const retryLabel =
							typeof errorPayload.retryAfterSeconds === "number" &&
							errorPayload.retryAfterSeconds > 0
								? `${errorPayload.retryAfterSeconds}초 후 다시 시도`
								: "잠시 후 다시 시도";
						setMessages((prev) =>
							prev
								.filter((message) => message.id !== streamingMsg.id)
								.concat({
									id: createMessageId("error"),
									role: "assistant",
									content: `요청이 잠시 많아서 처리하지 못했어요. ${retryLabel}.`,
									timestamp: new Date().toISOString(),
									actions: [
										{
											id: RETRY_ACTION_ID,
											label: "마지막 질문 다시 보내기",
											action: "generate_report",
											variant: "outline",
										},
									],
								}),
						);
						return;
					}

					throw new Error(errorPayload.message);
				}

				const streamingMessageId = streamingMsg.id;
				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";
				let assistantContent = "";
				let assistantBlocks: ChatBlock[] = [];
				let done = false;
				let currentIntent: string | undefined;
				let quickReplies: string[] = [];

				const parseEvent = (event: StreamEvent) => {
					if (!isMountedRef.current || controller.signal.aborted) return;

					switch (event.type) {
						case "start":
							currentIntent = event.intent;
							quickReplies = event.quick_replies?.length
								? event.quick_replies
								: parseQuickReplies(event.intent);
							patchStreamingMessage(streamingMessageId, {
								quick_replies: quickReplies,
							});
							return;
						case "block":
							if (!event.block) return;
							assistantBlocks = [...assistantBlocks, event.block];
							patchStreamingMessage(streamingMessageId, {
								isStreaming: false,
								blocks: assistantBlocks,
								content: assistantContent,
							});
							return;
						case "text":
							if (!event.text) return;
							assistantContent += event.text;
							patchStreamingMessage(streamingMessageId, {
								isStreaming: true,
								content: assistantContent,
								blocks: assistantBlocks.length > 0 ? assistantBlocks : undefined,
							});
							return;
						case "done": {
							const finalQuickReplies = event.quick_replies?.length
								? event.quick_replies
								: quickReplies.length > 0
									? quickReplies
									: parseQuickReplies(currentIntent);
								patchStreamingMessage(streamingMessageId, {
									isStreaming: false,
									content: assistantContent,
									blocks: assistantBlocks,
									timestamp: event.timestamp ?? new Date().toISOString(),
									quick_replies: finalQuickReplies,
								});
								done = true;
								if (!isMountedRef.current || controller.signal.aborted) return;
								if (isTrackingUsage && usageLimit > 0) {
									setUsageCount((prev) => {
										const next = Math.min(prev + 1, usageLimit);
										if (status !== "authenticated") {
											setGuestUsageCount(monthKey, next);
										}
										return next;
									});
								}
								return;
						}
						case "error":
							throw new Error(event.error || "스트리밍이 중단되었습니다.");
				}
				};

				while (!done && !controller.signal.aborted) {
					const { value, done: streamDone } = await reader.read();
					if (!isMountedRef.current || controller.signal.aborted) break;
					if (streamDone) break;

					buffer += decoder.decode(value, { stream: true });

					let separatorIndex = buffer.indexOf("\n\n");
					while (separatorIndex !== -1 && !done) {
						const eventChunk = buffer.slice(0, separatorIndex);
						buffer = buffer.slice(separatorIndex + 2);
						const event = parseSseEvent(eventChunk);
						if (event) {
							parseEvent(event);
						}
						separatorIndex = buffer.indexOf("\n\n");
					}
				}

				if (controller.signal.aborted || !isMountedRef.current) return;

				const tail = decoder.decode();
				if (tail) {
					buffer += tail;
					const tailEvent = parseSseEvent(buffer);
					if (tailEvent) {
						parseEvent(tailEvent);
					}
				}
			} catch (error) {
				if (
					isMountedRef.current &&
					!controller.signal.aborted &&
					!isAbortError(error)
				) {
					setMessages((prev) =>
						prev
							.filter((message) => message.id !== streamingMsg.id)
							.concat({
								id: createMessageId("error"),
								role: "assistant",
								content:
									"앗, 방금 응답이 중단됐어요. 네트워크 상태가 불안정하거나 서버가 잠시 바빠서 그랬을 수 있어요. 아래 버튼으로 바로 다시 시도할 수 있어요.",
								timestamp: new Date().toISOString(),
								actions: [
									{
										id: RETRY_ACTION_ID,
										label: "마지막 질문 다시 보내기",
										action: "generate_report",
										variant: "outline",
									},
								],
							}),
					);
				}
			} finally {
				if (activeRequestRef.current === controller) {
					activeRequestRef.current = null;
				}

				if (isMountedRef.current) {
					setIsLoading(false);
				}
			}
		},
		[
			createMessageId,
			isLoading,
			isTrackingUsage,
			isUsageLimitReached,
			isUsageLoading,
			monthKey,
			messages,
			patchStreamingMessage,
			setInput,
			setMessages,
			setUsageCount,
			status,
			usageCount,
			usageLimit,
		],
	);

	const retryLastMessage = useCallback(() => {
		void sendMessage(lastPromptRef.current);
	}, [sendMessage]);

	return {
		isLoading,
		sendMessage,
		retryLastMessage,
	};
}
