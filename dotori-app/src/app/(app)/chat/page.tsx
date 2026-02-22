"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/catalyst/button";
import { Field, Fieldset, Label } from "@/components/catalyst/fieldset";
import { ChatBubble } from "@/components/dotori/ChatBubble";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Skeleton } from "@/components/dotori/Skeleton";
import { Select } from "@/components/catalyst/select";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { MarkdownText } from "@/components/dotori/MarkdownText";
import type { ChatBlock, ChatMessage } from "@/types/dotori";
import { useSession } from "next-auth/react";
import { Text } from "@/components/catalyst/text";
import { LoadingSpinner } from "./_components/LoadingSpinner";
import { PremiumGate } from "./_components/PremiumGate";
import { UsageCounter } from "./_components/UsageCounter";
import {
	FREE_PLAN_CHAT_LIMIT,
	GUEST_CHAT_LIMIT,
	getGuestUsageCount,
	getMonthKey,
	MONTHLY_USAGE_API_URL,
	parseQuickReplies,
	parseUsageResponse,
	PREMIUM_GATE_HINT,
	RETRY_ACTION_ID,
	setGuestUsageCount,
	suggestedPrompts,
	TORI_ICON,
	promptItemVariants,
	promptListVariants,
} from "./_lib/chat-config";
import { getStreamErrorPayload, parseSseEvent, type StreamEvent } from "./_lib/chat-stream";

export default function ChatPage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-[calc(100dvh-8rem)] flex-col">
					<div className="px-5 pt-8">
						<Skeleton variant="card" count={2} />
					</div>
				</div>
			}
		>
			<ChatContent />
		</Suspense>
	);
}

function ChatContent() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isHistoryLoading, setIsHistoryLoading] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [isResetting, setIsResetting] = useState(false);
	const [usageCount, setUsageCount] = useState(0);
	const [usageLimit, setUsageLimit] = useState(0);
	const [isUsageLoading, setIsUsageLoading] = useState(false);
	const [selectedPromptLabel, setSelectedPromptLabel] = useState<string>(
		suggestedPrompts[0]?.label ?? "",
	);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const promptHandled = useRef(false);
	const lastPromptRef = useRef("");
	const monthKey = getMonthKey();
	const isPremiumUser = status === "authenticated" && session?.user?.plan === "premium";
	const isTrackingUsage = status !== "loading" && !isPremiumUser;
	const isUsageLimitReached = isTrackingUsage && usageLimit > 0 && usageCount >= usageLimit;

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
		[],
	);

	const sendMessage = useCallback(async (text: string) => {
		const normalizedText = text.trim();
		if (
			!normalizedText ||
			isLoading ||
			isUsageLoading ||
			isUsageLimitReached
		) {
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
			const res = await fetch("/api/chat/stream", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(isTrackingUsage && status !== "authenticated"
						? { "x-chat-guest-usage": String(usageCount) }
						: {}),
				},
				body: JSON.stringify({ message: normalizedText }),
			});

			if (!res.ok || !res.body) {
				const errorPayload = await getStreamErrorPayload(res);
				setMessages((prev) => prev.filter((m) => m.id !== streamingMsg.id));
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
			const reader = res.body.getReader();
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
					case "done":
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
					.filter((m) => m.id !== streamingMsg.id)
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
	}, [
		isLoading,
		isTrackingUsage,
		isUsageLimitReached,
		isUsageLoading,
		monthKey,
		patchStreamingMessage,
		status,
		usageCount,
		usageLimit,
	]);

	const handleBlockAction = useCallback(
		(actionId: string) => {
			if (actionId === RETRY_ACTION_ID) {
				sendMessage(lastPromptRef.current);
				return;
			}

			const actionRoutes: Record<string, string> = {
				explore: "/explore",
				waitlist: "/my/waitlist",
				interests: "/my/interests",
				community: "/community",
				settings: "/my/settings",
				login: "/login",
				import: "/my/import",
			};

			const route = actionRoutes[actionId];
			if (route) {
				router.push(route);
				return;
			}

			if (actionId.startsWith("facility_")) {
				const fId = actionId.replace("facility_", "");
				router.push(`/facility/${fId}`);
				return;
			}

			sendMessage(actionId);
		},
		[router, sendMessage],
	);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		setIsHistoryLoading(true);
		apiFetch<{ data: { messages: ChatMessage[] } }>("/api/chat/history")
			.then((res) => {
				if (res.data.messages.length > 0) {
					setMessages(res.data.messages);
				}
			})
			.catch(() => {
				// Not logged in or no history — that's fine
			})
			.finally(() => {
				setIsHistoryLoading(false);
			});
	}, []);

	useEffect(() => {
		if (promptHandled.current) return;
		const prompt = searchParams.get("prompt");
		if (prompt) {
			promptHandled.current = true;
			const timer = setTimeout(() => sendMessage(prompt), 300);
			return () => clearTimeout(timer);
		}
	}, [searchParams, sendMessage]);

	useEffect(() => {
		if (status === "loading") return;
		let isActive = true;
		setIsUsageLoading(true);

		if (status !== "authenticated") {
			const count = getGuestUsageCount(monthKey);
			if (isActive) {
				setUsageCount(Math.min(count, GUEST_CHAT_LIMIT));
				setUsageLimit(GUEST_CHAT_LIMIT);
				setIsUsageLoading(false);
			}
			return;
		}

		if (session?.user?.plan === "premium") {
			if (isActive) {
				setUsageCount(0);
				setUsageLimit(0);
				setIsUsageLoading(false);
			}
			return;
		}

		(async () => {
			try {
				const res = await fetch(MONTHLY_USAGE_API_URL, {
					cache: "no-store",
				});
				if (!res.ok) {
					throw new Error("usage-load-failed");
				}
				const payload = await res.json().catch(() => null);
				if (!isActive) return;
				const data = parseUsageResponse(payload, FREE_PLAN_CHAT_LIMIT);
				setUsageCount(Math.min(data.count, data.limit));
				setUsageLimit(Math.max(1, data.limit));
			} catch {
				if (!isActive) return;
				setUsageCount(0);
				setUsageLimit(FREE_PLAN_CHAT_LIMIT);
			} finally {
				if (isActive) {
					setIsUsageLoading(false);
				}
			}
		})();

		return () => {
			isActive = false;
		};
	}, [status, session?.user?.id, session?.user?.plan, monthKey]);

	function handleSuggest(prompt: string) {
		const selectedPrompt = suggestedPrompts.find((item) => item.prompt === prompt);
		if (selectedPrompt) {
			setSelectedPromptLabel(selectedPrompt.label);
		}
		sendMessage(prompt);
	}

	const handlePromptSelectChange = (value: string) => {
		const selectedPrompt = suggestedPrompts.find((item) => item.label === value);
		if (!selectedPrompt) return;
		setSelectedPromptLabel(selectedPrompt.label);
		setInput(selectedPrompt.prompt);
		inputRef.current?.focus();
	};

	const handleClearHistory = async () => {
		setIsResetting(true);
		try {
			await apiFetch("/api/chat/history", { method: "DELETE" });
			setMessages([]);
		} finally {
			setIsResetting(false);
		}
	};

	return (
		<div className="flex h-[calc(100dvh-8rem)] flex-col">
			{/* ── Header ── */}
			<header className="flex items-center gap-3 border-b border-dotori-100/30 bg-white/80 px-5 py-3.5 backdrop-blur-xl">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={TORI_ICON}
					alt=""
					aria-hidden="true"
					className="h-10 w-10 rounded-full border border-dotori-100 bg-white"
				/>
				<div className="min-w-0">
					<Heading level={3} className="font-semibold text-dotori-900">
						토리
					</Heading>
					<div className="mt-0.5 flex items-center gap-1.5">
						<span className="inline-block h-2 w-2 animate-pulse rounded-full bg-forest-500" />
						<Text className="text-xs font-medium text-forest-700">온라인</Text>
					</div>
				</div>
				<Button
					onClick={handleClearHistory}
					disabled={isResetting || isLoading}
					color="dotori"
					className="ml-auto min-h-10 min-w-24 px-3 text-sm"
				>
					대화 초기화
				</Button>
			</header>
			{isTrackingUsage ? (
				<div className="border-b border-dotori-100/30 bg-white/90 px-5 py-2.5">
					<UsageCounter
						count={usageCount}
						limit={usageLimit}
						isLoading={isUsageLoading}
					/>
				</div>
			) : null}

			{/* ── Messages ── */}
			<div className="flex-1 overflow-y-auto">
				{isHistoryLoading ? (
					<div className="px-4 pt-4">
						<Skeleton variant="chat" count={3} />
					</div>
				) : messages.length === 0 ? (
					<div className="relative px-6 pb-4 pt-10">
						<div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-dotori-100 bg-white/90 p-6 shadow-sm">
							<div className="relative">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={TORI_ICON}
									alt=""
									className="mx-auto mb-4 h-14 w-14 rounded-full border border-dotori-100 bg-white"
								/>
								<Heading level={3} className="text-center text-lg text-dotori-800">
									이동 고민이라면 뭐든 물어보세요
								</Heading>
								<Text className="mt-1.5 block text-center text-sm text-dotori-500">
									반편성, 교사 교체, 빈자리까지 토리가 함께 정리해드려요.
								</Text>
							</div>

							<Fieldset className="sr-only">
								<Field>
									<Label>빠른 시나리오</Label>
									<Select
										value={selectedPromptLabel}
										onChange={(event) =>
											handlePromptSelectChange(event.currentTarget.value)
										}
									>
										{suggestedPrompts.map((prompt) => (
											<option key={prompt.label} value={prompt.label}>
												{prompt.label}
											</option>
										))}
									</Select>
								</Field>
							</Fieldset>

							<motion.div
								className="relative mt-6 space-y-2.5"
								variants={promptListVariants}
								initial="hidden"
								animate="show"
							>
								{suggestedPrompts.map((sp) => (
									<motion.div key={sp.label} variants={promptItemVariants}>
										<Button
											plain={true}
											type="button"
											onClick={() => handleSuggest(sp.prompt)}
											className={cn(
												"flex w-full items-center gap-3 rounded-2xl bg-dotori-50 px-4 py-3 text-left transition-all",
												"hover:bg-dotori-100 active:scale-95",
											)}
										>
											<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-lg">
												{sp.icon}
											</span>
											<div className="min-w-0">
												<Text className="block font-semibold text-dotori-700">
													{sp.label}
												</Text>
												<Text className="mt-0.5 block text-sm text-dotori-500 line-clamp-1">
													{sp.prompt}
												</Text>
											</div>
										</Button>
									</motion.div>
								))}
							</motion.div>
						</div>
					</div>
				) : (
					<div className="px-4 pt-4">
						{messages.map((msg) => (
							<ChatBubble
								key={msg.id}
								role={msg.role}
								timestamp={msg.timestamp}
								sources={msg.sources}
								actions={msg.actions}
								blocks={msg.blocks}
								isStreaming={msg.isStreaming}
								onBlockAction={handleBlockAction}
								onQuickReply={sendMessage}
								quickReplies={msg.quick_replies}
								isRead={msg.role === "user"}
							>
								{msg.role === "assistant" ? (
									<MarkdownText content={msg.content} />
								) : (
									<Text>{msg.content}</Text>
								)}
							</ChatBubble>
						))}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>

			{/* ── Input area ── */}
			<div className="border-t border-dotori-100/30 bg-white/80 px-5 py-3.5 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
				{isTrackingUsage && isUsageLimitReached ? (
					<PremiumGate
						usageLimit={usageLimit}
						message={PREMIUM_GATE_HINT}
					/>
				) : null}
				<div className="flex items-center gap-2.5">
					<Fieldset className="min-w-0 flex-1">
						<Field>
							<Label className="sr-only">메시지 입력</Label>
							<Input
								ref={inputRef}
								type="text"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="토리에게 물어보세요..."
								className="min-h-12 bg-dotori-100/60 text-sm"
								onKeyDown={(event) => {
									if (event.key === "Enter" && input.trim()) {
										sendMessage(input);
									}
								}}
								disabled={isLoading || isUsageLoading || isUsageLimitReached}
							/>
						</Field>
					</Fieldset>
					<Button
						plain={true}
						type="button"
						onClick={() => sendMessage(input)}
						disabled={
							!input.trim() || isLoading || isUsageLoading || isUsageLimitReached
						}
						aria-label="메시지 전송"
						className={cn(
							"flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-95",
							input.trim() && !isLoading && !isUsageLoading && !isUsageLimitReached
								? "bg-dotori-900 text-white"
								: "bg-dotori-100 text-dotori-500",
						)}
					>
						{isLoading ? (
							<LoadingSpinner />
						) : (
							<svg
								className="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
							>
								<path
									d="M3.9 2.6L22 11.4L3.9 20.2V13.7L15 11.4L3.9 9.1V2.6Z"
									fill="currentColor"
								/>
							</svg>
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
