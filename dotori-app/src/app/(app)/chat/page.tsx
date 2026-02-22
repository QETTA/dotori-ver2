"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/catalyst/button";
import { Field, Fieldset, Label } from "@/components/catalyst/fieldset";
import { ChatBubble } from "@/components/dotori/ChatBubble";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Skeleton } from "@/components/dotori/Skeleton";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MarkdownText } from "@/components/dotori/MarkdownText";
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
					<ChatPromptPanel
						onSelectPrompt={handleSelectPrompt}
						onSuggestPrompt={handleSuggestPrompt}
						selectedPromptLabel={selectedPromptLabel}
						toriIcon={TORI_ICON}
					/>
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
						disabled={!input.trim() || isLoading || isUsageLoading || isUsageLimitReached}
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
