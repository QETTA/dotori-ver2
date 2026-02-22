"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/catalyst/button";
import { Field, Fieldset, Label } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Skeleton } from "@/components/dotori/Skeleton";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand-assets";
import { cn, formatRelativeTime } from "@/lib/utils";
import { MarkdownText } from "@/components/dotori/MarkdownText";
import { BlockRenderer } from "@/components/dotori/blocks/BlockRenderer";
import { SourceChip } from "@/components/dotori/SourceChip";
import type { ChatMessage } from "@/types/dotori";
import { useSession } from "next-auth/react";
import { Text } from "@/components/catalyst/text";
import {
	ChatPromptPanel,
	type ChatPromptPanelItem,
} from "@/components/dotori/chat/ChatPromptPanel";
import { useChatStream } from "@/components/dotori/chat/useChatStream";
import { LoadingSpinner } from "./_components/LoadingSpinner";
import { PremiumGate } from "./_components/PremiumGate";
import { UsageCounter } from "./_components/UsageCounter";
import {
	FREE_PLAN_CHAT_LIMIT,
	GUEST_CHAT_LIMIT,
	getGuestUsageCount,
	getMonthKey,
	MONTHLY_USAGE_API_URL,
	parseUsageResponse,
	PREMIUM_GATE_HINT,
	RETRY_ACTION_ID,
	suggestedPrompts,
	TORI_ICON,
} from "./_lib/chat-config";

export default function ChatPage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-[calc(100dvh-8rem)] flex-col bg-dotori-50 dark:bg-dotori-900">
					<div className="px-5 pt-6">
						<Skeleton variant="card" count={2} />
					</div>
				</div>
			}
		>
			<ChatContent />
		</Suspense>
	);
}

function MessageBubble({
	msg,
	onBlockAction,
	onQuickReply,
}: {
	msg: ChatMessage;
	onBlockAction: (actionId: string) => void;
	onQuickReply: (value: string) => void;
}) {
	const relativeTime = formatRelativeTime(msg.timestamp);
	const normalizedQuickReplies = msg.quick_replies?.slice(0, 4);
	const showQuickReplies =
		normalizedQuickReplies && normalizedQuickReplies.length > 0 && !msg.isStreaming;
	const hasStreamingContent =
		(typeof msg.content === "string" && msg.content.trim().length > 0) ||
		Boolean(msg.blocks && msg.blocks.length > 0);

	if (msg.role === "user") {
		return (
			<div
				role="log"
				aria-label="사용자 메시지"
				className={cn(
					"mb-3 flex justify-end",
					"motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 duration-300",
				)}
			>
				<div className="max-w-[85%] rounded-2xl rounded-br-sm bg-dotori-100 px-4 py-3 text-dotori-900 shadow-none dark:bg-dotori-800 dark:text-dotori-50">
					<div className="space-y-1">
						<Text className="text-dotori-900 dark:text-dotori-50">{msg.content}</Text>
						<span
							className="mt-1 flex items-center justify-end gap-1.5 text-xs text-dotori-600 dark:text-dotori-200"
							suppressHydrationWarning
						>
							<svg
								viewBox="0 0 20 20"
								aria-hidden="true"
								className="h-3.5 w-3.5 fill-none stroke-current"
							>
								<path
									strokeWidth="2.2"
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M16.8 6.4 8.5 14.2 4.2 10.2"
								/>
								<path
									strokeWidth="2.2"
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M16.8 9.2 8.5 17 4.2 13"
								/>
							</svg>
							<span className="leading-none">읽음</span>
							{relativeTime}
						</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			role="log"
			aria-label="어시스턴트 메시지"
			className={cn(
				"mb-3 flex justify-start gap-2.5",
				"motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 duration-300",
			)}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img src={BRAND.symbol} alt="토리" className="mt-1 h-9 w-9 shrink-0 rounded-full" />
			<div className="flex max-w-[85%] flex-col gap-2">
				<div className="rounded-2xl rounded-bl-sm border border-dotori-100 bg-white px-4 py-3 text-dotori-900 shadow-sm dark:border-dotori-800 dark:bg-dotori-900 dark:text-dotori-50 dark:shadow-none">
					{msg.isStreaming && !hasStreamingContent ? (
						<div className="flex gap-1.5 py-1">
							{[0, 250, 500].map((delay) => (
								<span
									key={delay}
									className="h-2 w-2 animate-bounce rounded-full bg-dotori-300"
									style={{ animationDelay: `${delay}ms` }}
								/>
							))}
						</div>
					) : msg.blocks && msg.blocks.length > 0 ? (
						<BlockRenderer blocks={msg.blocks} onAction={onBlockAction} />
					) : (
						<MarkdownText content={msg.content} />
					)}

					{msg.isStreaming ? (
						<span
							className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-dotori-500"
							aria-hidden="true"
						/>
					) : null}
				</div>

				{msg.sources && msg.sources.length > 0 ? (
					<div className="flex flex-wrap gap-1.5 px-1">
						{msg.sources.map((s, i) => (
							<SourceChip key={`${s.source}-${i}`} {...s} />
						))}
					</div>
				) : null}

				{msg.actions && msg.actions.length > 0 ? (
					<div className="flex flex-wrap gap-2 px-1">
						{msg.actions.map((a) =>
							a.variant === "outline" ? (
								<Button key={a.id} plain={true} onClick={() => onBlockAction(a.id)}>
									{a.label}
								</Button>
							) : (
								<Button key={a.id} color="dotori" onClick={() => onBlockAction(a.id)}>
									{a.label}
								</Button>
							),
						)}
					</div>
				) : null}

				{showQuickReplies ? (
					<div className="flex flex-wrap gap-2 px-1">
						{normalizedQuickReplies?.map((text) => (
							<Button key={text} plain={true} onClick={() => onQuickReply(text)}>
								{text}
							</Button>
						))}
					</div>
				) : null}

				<span className="px-1 text-xs text-dotori-500" suppressHydrationWarning>
					{relativeTime}
				</span>
			</div>
		</div>
	);
}

function ChatContent() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isHistoryLoading, setIsHistoryLoading] = useState(true);
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
	const monthKey = getMonthKey();
	const isPremiumUser = status === "authenticated" && session?.user?.plan === "premium";
	const isTrackingUsage = status !== "loading" && !isPremiumUser;
	const isUsageLimitReached = isTrackingUsage && usageLimit > 0 && usageCount >= usageLimit;

	const { isLoading, retryLastMessage, sendMessage } = useChatStream({
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
	});

	const handleBlockAction = useCallback(
		(actionId: string) => {
			if (actionId === RETRY_ACTION_ID) {
				retryLastMessage();
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
		[retryLastMessage, router, sendMessage],
	);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		if (status === "loading") {
			return;
		}

		if (status !== "authenticated") {
			setMessages([]);
			setIsHistoryLoading(false);
			return;
		}

		let isMounted = true;
		setIsHistoryLoading(true);
		apiFetch<{ data: { messages: ChatMessage[] } }>("/api/chat/history")
			.then((res) => {
				if (!isMounted) return;
				if (res.data.messages.length > 0) {
					setMessages(res.data.messages);
				}
			})
			.catch(() => {
				if (!isMounted) return;
				// Logged-in user with empty/expired history
				setMessages([]);
			})
			.finally(() => {
				if (isMounted) {
					setIsHistoryLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [status]);

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

	const handleSuggestPrompt = useCallback(
		(prompt: ChatPromptPanelItem) => {
			setSelectedPromptLabel(prompt.label);
			sendMessage(prompt.prompt);
		},
		[sendMessage],
	);

	const handleSelectPrompt = useCallback((prompt: ChatPromptPanelItem) => {
		setSelectedPromptLabel(prompt.label);
		setInput(prompt.prompt);
		inputRef.current?.focus();
	}, []);

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
		<div className="flex h-[calc(100dvh-8rem)] flex-col bg-dotori-50 text-dotori-900 dark:bg-dotori-900 dark:text-dotori-50">
			{/* ── Header ── */}
			<header className="glass-header sticky top-0 z-10 flex items-center gap-3 px-5 py-3.5">
				<div className="flex min-w-0 items-center gap-3">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={TORI_ICON}
						alt=""
						aria-hidden="true"
						className="h-10 w-10 rounded-full border border-dotori-100 bg-white dark:border-dotori-800 dark:bg-dotori-900"
					/>
					<div className="min-w-0">
						<Heading level={3} className="font-semibold text-dotori-900 dark:text-dotori-50">
							토리
						</Heading>
						<div className="mt-0.5 flex items-center gap-1.5">
							<span className="inline-block h-2 w-2 animate-pulse rounded-full bg-forest-500" />
							<Text className="text-xs font-medium text-forest-700 dark:text-forest-300">
								온라인
							</Text>
						</div>
					</div>
				</div>

				<div className="ml-auto flex items-center gap-2">
					{isTrackingUsage ? (
						<div className="rounded-2xl border border-dotori-100/70 bg-white/70 px-3 py-2 backdrop-blur-sm dark:border-dotori-800/50 dark:bg-dotori-950/40 dark:[&_*]:text-dotori-200">
							<UsageCounter
								count={usageCount}
								limit={usageLimit}
								isLoading={isUsageLoading}
							/>
						</div>
					) : null}
					<Button
						plain={true}
						onClick={handleClearHistory}
						disabled={isResetting || isLoading}
						className="min-h-11 min-w-24 rounded-2xl border border-dotori-100 bg-white/70 px-3 text-sm transition-all hover:bg-white active:scale-[0.97] dark:border-dotori-800 dark:bg-dotori-950/40 dark:hover:bg-dotori-950/60"
					>
						대화 초기화
					</Button>
				</div>
			</header>

			{/* ── Messages ── */}
			<div className="flex-1 overflow-y-auto">
				{isHistoryLoading ? (
					<div className="px-5 py-4">
						<Skeleton variant="chat" count={3} />
					</div>
				) : messages.length === 0 ? (
					<ChatPromptPanel
						onSelectPrompt={handleSelectPrompt}
						onSuggestPrompt={handleSuggestPrompt}
						selectedPromptLabel={selectedPromptLabel}
						toriIcon={TORI_ICON}
					/>
				) : (
					<div className="px-5 py-4">
						{messages.map((msg) => (
							<MessageBubble
								key={msg.id}
								msg={msg}
								onBlockAction={handleBlockAction}
								onQuickReply={sendMessage}
							/>
						))}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>

			{/* ── Input area ── */}
			<div className="border-t border-dotori-100/30 bg-white/80 px-5 py-3.5 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-dotori-800/40 dark:bg-dotori-950/70">
				{isTrackingUsage && isUsageLimitReached ? (
					<PremiumGate usageLimit={usageLimit} message={PREMIUM_GATE_HINT} />
				) : null}
				<div className="flex items-center gap-2.5">
					<Fieldset className="min-w-0 flex-1">
						<Field>
							<Label className="sr-only">메시지 입력</Label>
							<Input
								ref={inputRef}
								type="text"
								value={input}
								onChange={(event) => setInput(event.target.value)}
								placeholder="토리에게 물어보세요..."
								className="min-h-12 bg-dotori-100/60 text-sm text-dotori-900 placeholder:text-dotori-400 dark:bg-dotori-800/60 dark:text-dotori-50 dark:placeholder:text-dotori-600"
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
						disabled={!input.trim() || isLoading || isUsageLoading || isUsageLimitReached}
						aria-label="메시지 전송"
						className={cn(
							"flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-[0.97]",
							input.trim() && !isLoading && !isUsageLoading && !isUsageLimitReached
								? "bg-dotori-900 text-white hover:bg-dotori-800 hover:shadow-sm dark:bg-dotori-50 dark:text-dotori-900 dark:hover:bg-dotori-100 dark:hover:shadow-none"
								: "bg-dotori-100 text-dotori-500 dark:bg-dotori-800 dark:text-dotori-300",
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
