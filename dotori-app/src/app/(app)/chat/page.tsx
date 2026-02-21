"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { ChatBubble } from "@/components/dotori/ChatBubble";
import { Skeleton } from "@/components/dotori/Skeleton";
import { BRAND } from "@/lib/brand-assets";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MarkdownText } from "@/components/dotori/MarkdownText";
import type { ChatBlock, ChatMessage } from "@/types/dotori";
import { useSession } from "next-auth/react";

const FREE_PLAN_CHAT_LIMIT = 5;
const GUEST_CHAT_LIMIT = 3;
const MONTHLY_USAGE_API_URL = "/api/analytics/usage";
const PREMIUM_GATE_HINT = "업그레이드하면 무제한으로 대화해요";

const suggestedPrompts = [
	{
		label: "이동 고민",
		prompt: "지금 다니는 어린이집에서 이동하고 싶어요. 무엇부터 시작해야 할까요?",
		icon: "🔄",
	},
	{
			label: "반편성 불만",
		prompt:
			"3월 반편성 결과가 마음에 안 들어요. 이동할 만한 시설이 있을까요?",
		icon: "📋",
	},
	{
		label: "빈자리 탐색",
		prompt: "우리 동네 어린이집 중 지금 바로 입소 가능한 곳을 찾고 싶어요",
		icon: "🔍",
	},
	{
		label: "시설 비교",
		prompt: "국공립과 민간 어린이집의 실질적인 차이점을 알고 싶어요",
		icon: "⚖️",
	},
];

const RETRY_ACTION_ID = "chat:retry-last-message";
const QUICK_REPLIES_BY_INTENT: Record<string, string[]> = {
	transfer: ["근처 대안 시설 찾기", "전원 절차 안내", "서류 체크리스트"],
	recommend: ["더 보기", "지도에서 보기", "비교하기"],
	general: ["이동 고민", "빈자리 탐색", "입소 체크리스트"],
};

function getMonthKey(date = new Date()) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getGuestUsageStorageKey(monthKey: string): string {
	return `chat:guest-monthly-usage:${monthKey}`;
}

function getGuestUsageCount(monthKey: string): number {
	if (typeof window === "undefined") return 0;
	const raw = window.sessionStorage.getItem(getGuestUsageStorageKey(monthKey));
	if (!raw) return 0;

	const parsed = Number(raw);
	if (!Number.isFinite(parsed)) return 0;
	return Math.max(0, Math.floor(parsed));
}

function setGuestUsageCount(monthKey: string, count: number): void {
	if (typeof window === "undefined") return;
	window.sessionStorage.setItem(
		getGuestUsageStorageKey(monthKey),
		String(Math.max(0, Math.floor(count))),
	);
}

function parseToNumber(value: unknown, fallback: number): number {
	if (typeof value === "number" && Number.isFinite(value)) {
		return Math.max(0, Math.floor(value));
	}
	if (typeof value === "string") {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return Math.max(0, Math.floor(parsed));
		}
	}
	return fallback;
}

function parseUsageResponse(
	payload: unknown,
	fallbackLimit: number,
): { count: number; limit: number } {
	if (!payload || typeof payload !== "object") {
		return { count: 0, limit: fallbackLimit };
	}

	const record = payload as Record<string, unknown>;
	const data = record.data;
	const nested = data && typeof data === "object" ? (data as Record<string, unknown>) : null;

	return {
		count: parseToNumber(
			nested?.count ?? nested?.used ?? record.count ?? record.used,
			0,
		),
		limit: parseToNumber(
			nested?.limit ?? record.limit,
			fallbackLimit,
		),
	};
}

function UsageCounter({ count, limit, isLoading }: {
	count: number;
	limit: number;
	isLoading: boolean;
}) {
	const text = isLoading ? "이번 달 사용량을 확인하는 중" : `이번 달 ${count}/${limit}회 사용`;
	return <p className="text-[12px] text-dotori-500">{text}</p>;
}

function PremiumGate({
	usageLimit,
	message,
}: {
	usageLimit: number;
	message: string;
}) {
	return (
		<div className="mb-2 rounded-2xl border border-dotori-200 bg-dotori-50 px-4 py-3">
			<p className="text-[13px] font-semibold text-dotori-800">
				이번 달 무료 채팅 횟수를 모두 사용했어요
			</p>
			<p className="mt-1 text-[13px] text-dotori-700">
				<Badge color="dotori" className="text-[11px]">{usageLimit}회 제한</Badge>
				
				{` ${message}`}
			</p>
			<Button href="/landing" color="dotori" className="mt-2.5 w-full">
				프리미엄으로 업그레이드
			</Button>
		</div>
	);
}

function getStreamErrorPayload(
	response: Response,
): Promise<{ isQuotaExceeded: boolean; message: string }> {
	const fallback = "스트리밍 응답을 받을 수 없습니다.";
	if (!response.headers.get("content-type")?.includes("application/json")) {
		return response
			.text()
			.then((text) => ({
				isQuotaExceeded: false,
				message: text.trim() || fallback,
			}))
			.catch(() => ({
				isQuotaExceeded: false,
				message: fallback,
			}));
	}

	return response
		.json()
		.then((payload) => {
			if (!payload || typeof payload !== "object") {
				return { isQuotaExceeded: false, message: fallback };
			}
			const record = payload as Record<string, unknown>;
			const isQuotaExceeded = record.error === "quota_exceeded";
			const message =
				typeof record.message === "string" ? record.message : fallback;
			return { isQuotaExceeded, message };
		})
		.catch(() => ({ isQuotaExceeded: false, message: fallback }));
}

function parseQuickReplies(intent?: string): string[] {
	if (!intent || !QUICK_REPLIES_BY_INTENT[intent]) return [];
	return QUICK_REPLIES_BY_INTENT[intent];
}

function LoadingSpinner() {
	return (
		<div
			aria-hidden="true"
			className="h-5 w-5 animate-spin rounded-full border-2 border-dotori-200 border-t-dotori-50"
		/>
	);
}

interface StreamEvent {
	type: "start" | "block" | "text" | "done" | "error";
	intent?: string;
	block?: ChatBlock;
	text?: string;
	timestamp?: string;
	error?: string;
	quick_replies?: string[];
}

function parseSseEvent(rawEvent: string): StreamEvent | null {
	const lines = rawEvent.split("\n");
	const dataLines = lines.filter((line) => line.startsWith("data:"));
	if (dataLines.length === 0) return null;

	const data = dataLines.map((line) => line.replace(/^data:\s?/, "")).join("\n");
	let payload: unknown;
	try {
		payload = JSON.parse(data);
	} catch {
		return null;
	}

	if (typeof payload !== "object" || payload === null || !("type" in payload)) {
		return null;
	}

	const typed = payload as { type: string; [key: string]: unknown };
	if (
		typed.type !== "start" &&
		typed.type !== "block" &&
		typed.type !== "text" &&
		typed.type !== "done" &&
		typed.type !== "error"
	) {
		return null;
	}

	return {
		type: typed.type,
		...(typed as Record<string, unknown>),
	} as StreamEvent;
}

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
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const promptHandled = useRef(false);
	const lastPromptRef = useRef("");
	const messagesRef = useRef<ChatMessage[]>([]);
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
		[router],
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
	}, [searchParams]);

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
	}, [status, session?.user?.id, session?.user?.plan]);

	messagesRef.current = messages;

	async function sendMessage(text: string) {
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
				body: JSON.stringify({ message: text }),
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
	}

	function handleSuggest(prompt: string) {
		sendMessage(prompt);
	}

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
				<img src={BRAND.appIconWarm} alt="" aria-hidden="true" className="h-8 w-8" />
				<h1 className="text-xl font-bold">토리</h1>
				<Badge color="forest" className="text-[12px]">
					<span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-forest-500" />
					온라인
				</Badge>
				<button
					onClick={handleClearHistory}
					disabled={isResetting || isLoading}
					className={cn(
						"ml-auto inline-flex min-h-[34px] min-w-[102px] items-center justify-center rounded-full px-3 text-xs font-medium transition-all",
						isResetting
							? "bg-dotori-100 text-dotori-300"
						: "bg-dotori-50 text-dotori-600 hover:bg-dotori-100",
					)}
				>
					대화 초기화
				</button>
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
						<div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-3xl border border-dotori-100 bg-white/90 p-6 shadow-sm">
							<div className="absolute -left-10 -top-8 h-24 w-24 rounded-full bg-dotori-100/80 blur-2xl" />
							<div className="absolute -right-8 -bottom-8 h-20 w-20 rounded-full bg-dotori-100/70 blur-3xl" />
							<div className="relative">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={BRAND.appIconWarm}
									alt=""
									className="mx-auto mb-4 h-14 w-14"
								/>
								<h2 className="text-center text-lg font-bold text-dotori-800">
									우리 아이에게 맞는 어린이집을 찾을 때까지 토리가 함께해요
								</h2>
								<p className="mt-1.5 text-center text-[14px] text-dotori-500">
									어린이집 검색부터 입소 전략, 서류 준비까지 도와드릴게요.
								</p>
							</div>

							<div className="relative mt-6 space-y-2.5">
								{suggestedPrompts.map((sp) => (
									<button
										key={sp.label}
										onClick={() => handleSuggest(sp.prompt)}
										className={cn(
											"flex w-full items-center gap-3 rounded-2xl bg-dotori-50 px-4 py-3 text-left transition-all",
											"active:scale-[0.99] hover:bg-dotori-100",
										)}
									>
										<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[18px]">
											{sp.icon}
										</span>
										<div className="min-w-0">
											<span className="block text-[14px] font-semibold text-dotori-700">
												{sp.label}
											</span>
											<span className="mt-0.5 block text-[12px] text-dotori-500 line-clamp-1">
												{sp.prompt}
											</span>
										</div>
									</button>
								))}
							</div>
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
									<p className="text-[15px]">{msg.content}</p>
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
					<input
						ref={inputRef}
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="토리에게 물어보세요..."
						className="min-w-0 flex-1 rounded-3xl bg-dotori-100/60 px-5 py-3.5 text-[15px] outline-none transition-all focus:ring-2 focus:ring-dotori-300"
						onKeyDown={(e) => {
							if (e.key === "Enter" && input.trim()) {
								sendMessage(input);
							}
						}}
						disabled={
							isLoading || isUsageLoading || isUsageLimitReached
						}
					/>
					<button
						onClick={() => sendMessage(input)}
						disabled={
							!input.trim() || isLoading || isUsageLoading || isUsageLimitReached
						}
						aria-label="메시지 전송"
						className={cn(
							"flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-[0.97]",
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
					</button>
				</div>
			</div>
		</div>
	);
}
