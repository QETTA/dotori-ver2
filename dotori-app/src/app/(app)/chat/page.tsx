"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Field, Fieldset, Label } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Input } from "@/components/catalyst/input";
import { Skeleton } from "@/components/dotori/Skeleton";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand-assets";
import { DS_GLASS, DS_STATUS } from "@/lib/design-system/tokens";
import { stagger, tap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { MarkdownText } from "@/components/dotori/MarkdownText";
import { ChatBubble } from "@/components/dotori/ChatBubble";
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
	return (
		<ChatBubble
			role={msg.role}
			timestamp={msg.timestamp}
			sources={msg.sources}
			isStreaming={msg.isStreaming}
			actions={msg.actions}
			blocks={msg.blocks}
			onBlockAction={onBlockAction}
			onQuickReply={onQuickReply}
			quickReplies={msg.quick_replies}
		>
			{msg.role === "user" ? (
				<Text className="text-body text-white/95">{msg.content}</Text>
			) : (
				<MarkdownText content={msg.content} />
			)}
		</ChatBubble>
	);
}

function ChatHeader({
	isTrackingUsage,
	isResetting,
	isLoading,
	isUsageLoading,
	usageCount,
	usageLimit,
	onClearHistory,
}: {
	isTrackingUsage: boolean;
	isResetting: boolean;
	isLoading: boolean;
	isUsageLoading: boolean;
	usageCount: number;
	usageLimit: number;
	onClearHistory: () => Promise<void>;
}) {
	return (
		<header
			className={cn(
				DS_GLASS.HEADER,
				"sticky top-0 z-20 flex items-center gap-3 border-b border-dotori-100/70 px-5 py-3.5 dark:border-dotori-800/50",
				"ring-1 ring-dotori-100/70",
			)}
		>
			<div className="flex min-w-0 items-center gap-2.5">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={BRAND.symbol}
					alt=""
					aria-hidden="true"
					className={cn("h-10 w-10 rounded-full bg-white p-1.5 shadow-sm", DS_GLASS.CARD)}
				/>
				<div className="min-w-0">
					<Heading
						level={3}
						className="text-h3 font-semibold text-dotori-900 dark:text-dotori-50"
					>
						토리
					</Heading>
					<div className="mt-1 flex items-center gap-1.5">
						<Badge
							color="forest"
							className="text-label rounded-full px-2 py-0.5"
						>
							<span className={cn("size-1.5 rounded-full", DS_STATUS.available.dot)} />
							온라인
						</Badge>
					</div>
				</div>
			</div>

			<div className="ml-auto flex items-center gap-2">
				{isTrackingUsage ? (
					<div
						className={cn(
							DS_GLASS.CARD,
							"min-h-11 rounded-2xl border border-dotori-100/70 px-3 py-2 shadow-sm ring-1 ring-dotori-100/70 dark:border-dotori-800/50",
						)}
					>
						<UsageCounter
							count={usageCount}
							limit={usageLimit}
							isLoading={isUsageLoading}
						/>
					</div>
				) : null}
				<motion.div {...tap.chip}>
						<Button
							plain={true}
							onClick={onClearHistory}
							disabled={isResetting || isLoading}
							className={cn(
								"text-body-sm",
								"min-h-11 min-w-24 rounded-2xl border border-dotori-100/70 bg-white/80 px-3 text-dotori-700 shadow-sm transition-all hover:bg-white/90 dark:border-dotori-800/50 dark:bg-dotori-950/60 dark:text-dotori-100 dark:hover:bg-dotori-950/80",
							)}
						>
						대화 초기화
					</Button>
				</motion.div>
			</div>
		</header>
	);
}

function ChatMessageArea({
	isHistoryLoading,
	messages,
	messagesEndRef,
	selectedPromptLabel,
	onSelectPrompt,
	onSuggestPrompt,
	onBlockAction,
	onQuickReply,
}: {
	isHistoryLoading: boolean;
	messages: ChatMessage[];
	messagesEndRef: React.RefObject<HTMLDivElement | null>;
	selectedPromptLabel: string;
	onSelectPrompt: (prompt: ChatPromptPanelItem) => void;
	onSuggestPrompt: (prompt: ChatPromptPanelItem) => void;
	onBlockAction: (actionId: string) => void;
	onQuickReply: (value: string) => void;
}) {
	return (
		<div className="flex-1 overflow-y-auto">
			{isHistoryLoading ? (
				<div className="px-5 py-4">
					<Skeleton variant="chat" count={3} />
				</div>
			) : messages.length === 0 ? (
				<div className="px-5 py-4">
					<ChatPromptPanel
						onSelectPrompt={onSelectPrompt}
						onSuggestPrompt={onSuggestPrompt}
						selectedPromptLabel={selectedPromptLabel}
						toriIcon={BRAND.symbol}
					/>
				</div>
			) : (
				<motion.ul
					{...stagger.container}
					className="space-y-4 px-5 py-4"
				>
					{messages.map((msg) => (
						<motion.li key={msg.id} {...stagger.item}>
							<MessageBubble
								msg={msg}
								onBlockAction={onBlockAction}
								onQuickReply={onQuickReply}
							/>
						</motion.li>
					))}
					<div ref={messagesEndRef} />
				</motion.ul>
			)}
		</div>
	);
}

function ChatComposer({
	input,
	isLoading,
	isUsageLoading,
	isUsageLimitReached,
	isTrackingUsage,
	inputRef,
	onInputChange,
	onSubmit,
	usageLimit,
}: {
	input: string;
	isLoading: boolean;
	isUsageLoading: boolean;
	isUsageLimitReached: boolean;
	isTrackingUsage: boolean;
	inputRef: React.RefObject<HTMLInputElement | null>;
	onInputChange: (value: string) => void;
	onSubmit: (value: string) => void;
	usageLimit: number;
}) {
	const isSendDisabled = !input.trim() || isLoading || isUsageLoading || isUsageLimitReached;

	return (
		<div
			className={cn(
				DS_GLASS.SHEET,
				"rounded-3xl border-t border-dotori-100/30 px-4 py-3.5 pb-[env(safe-area-inset-bottom)] shadow-sm shadow-[0_-10px_24px_rgba(200,149,106,0.1)] dark:border-dotori-800/40 dark:shadow-none",
				"ring-1 ring-dotori-100/70",
			)}
		>
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
							onChange={(event) => onInputChange(event.target.value)}
							placeholder="토리에게 물어보세요..."
							className={cn(
								"text-body-sm",
								DS_GLASS.CARD,
								"min-h-11 rounded-2xl border-0 bg-dotori-100/65 px-4 text-dotori-900 placeholder:text-dotori-400 shadow-sm dark:bg-dotori-800/60 dark:text-dotori-50 dark:placeholder:text-dotori-600",
							)}
							onKeyDown={(event) => {
								if (event.key === "Enter" && !isSendDisabled) {
									onSubmit(event.currentTarget.value);
								}
							}}
							disabled={isLoading || isUsageLoading || isUsageLimitReached}
						/>
					</Field>
				</Fieldset>
				<motion.div {...tap.button}>
					<Button
						color="dotori"
						type="button"
						onClick={() => onSubmit(input)}
						disabled={isSendDisabled}
						aria-label="메시지 전송"
						className={cn(
							"inline-flex min-h-11 min-w-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm",
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
				</motion.div>
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
			<ChatHeader
				isTrackingUsage={isTrackingUsage}
				isResetting={isResetting}
				isLoading={isLoading}
				isUsageLoading={isUsageLoading}
				usageCount={usageCount}
				usageLimit={usageLimit}
				onClearHistory={handleClearHistory}
			/>
			<ChatMessageArea
				isHistoryLoading={isHistoryLoading}
				messages={messages}
				messagesEndRef={messagesEndRef}
				selectedPromptLabel={selectedPromptLabel}
				onSelectPrompt={handleSelectPrompt}
				onSuggestPrompt={handleSuggestPrompt}
				onBlockAction={handleBlockAction}
				onQuickReply={sendMessage}
			/>
			<ChatComposer
				input={input}
				isLoading={isLoading}
				isUsageLoading={isUsageLoading}
				isUsageLimitReached={isUsageLimitReached}
				isTrackingUsage={isTrackingUsage}
				inputRef={inputRef}
				onInputChange={setInput}
				onSubmit={sendMessage}
				usageLimit={usageLimit}
			/>
		</div>
	);
}
