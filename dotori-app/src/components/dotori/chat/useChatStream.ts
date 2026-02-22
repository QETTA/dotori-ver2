"use client";

import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from "react";
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

export function useChatStream({
	isTrackingUsage,
	isUsageLoading,
	isUsageLimitReached,
	monthKey,
	setInput,
	setMessages,
	setUsageCount,
	status,
	usageCount,
	usageLimit,
}: UseChatStreamOptions): UseChatStreamResult {
	const [isLoading, setIsLoading] = useState(false);
	const lastPromptRef = useRef("");

	const patchStreamingMessage = useCallback(
		(streamingMessageId: string, patch: Partial<ChatMessage>) => {
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
			lastPromptRef.current = normalizedText;

			const userMsg: ChatMessage = {
				id: `user-${Date.now()}`,
				role: "user",
				content: normalizedText,
				timestamp: new Date().toISOString(),
			};

			setMessages((prev) => [...prev, userMsg]);
			setInput("");
			setIsLoading(true);

			const streamingMsg: ChatMessage = {
				id: `assistant-${Date.now()}`,
				role: "assistant",
				content: "",
				timestamp: new Date().toISOString(),
				isStreaming: true,
			};
			setMessages((prev) => [...prev, streamingMsg]);

			try {
				const response = await fetch("/api/chat/stream", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(isTrackingUsage && status !== "authenticated"
							? { "x-chat-guest-usage": String(usageCount) }
							: {}),
					},
					body: JSON.stringify({ message: normalizedText }),
				});

				if (!response.ok || !response.body) {
					const errorPayload = await getStreamErrorPayload(response);
					setMessages((prev) => prev.filter((message) => message.id !== streamingMsg.id));
					if (errorPayload.isQuotaExceeded) {
						if (isTrackingUsage && usageLimit > 0) {
							setUsageCount((prev) => Math.max(prev, usageLimit));
							if (status !== "authenticated") {
								setGuestUsageCount(monthKey, usageLimit);
							}
						}
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
								blocks:
									assistantBlocks.length > 0
										? assistantBlocks
										: undefined,
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

				while (!done) {
					const { value, done: streamDone } = await reader.read();
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
				const tail = decoder.decode();
				if (tail) {
					buffer += tail;
					const tailEvent = parseSseEvent(buffer);
					if (tailEvent) {
						parseEvent(tailEvent);
					}
				}
			} catch {
				setMessages((prev) =>
					prev
						.filter((message) => message.id !== streamingMsg.id)
						.concat({
							id: `error-${Date.now()}`,
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
			} finally {
				setIsLoading(false);
			}
		},
		[
			isLoading,
			isTrackingUsage,
			isUsageLimitReached,
			isUsageLoading,
			monthKey,
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
