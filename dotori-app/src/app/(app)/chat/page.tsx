"use client";

import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/catalyst/badge";
import { ChatBubble } from "@/components/dotori/ChatBubble";
import { Skeleton } from "@/components/dotori/Skeleton";
import { BRAND } from "@/lib/brand-assets";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ChatBlock, ChatMessage } from "@/types/dotori";

const suggestedPrompts = [
	{ label: "동네 추천", prompt: "우리 동네 어린이집 추천해주세요" },
	{ label: "입소 전략", prompt: "입소 확률 높이는 전략 알려줘" },
	{ label: "시설 비교", prompt: "해피어린이집이랑 사랑어린이집 비교해줘" },
	{ label: "서류 준비", prompt: "입소 서류 체크리스트 알려줘" },
];

interface ChatResponse {
	data: {
		role: "assistant";
		content: string;
		blocks?: ChatBlock[];
		timestamp: string;
	};
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
	const router = useRouter();
	const searchParams = useSearchParams();
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const promptHandled = useRef(false);

	const handleBlockAction = useCallback(
		(actionId: string) => {
			// Map action IDs to navigation or secondary actions
			const actionRoutes: Record<string, string> = {
				explore: "/explore",
				waitlist: "/my/waitlist",
				interests: "/my/interests",
				community: "/community",
				onboarding: "/onboarding",
				settings: "/my/settings",
				login: "/login",
				import: "/my/import",
			};

			const route = actionRoutes[actionId];
			if (route) {
				router.push(route);
				return;
			}

			// Facility-specific: "facility_<id>" → navigate to detail
			if (actionId.startsWith("facility_")) {
				const fId = actionId.replace("facility_", "");
				router.push(`/facility/${fId}`);
				return;
			}

			// Fallback: treat as a follow-up prompt
			sendMessage(actionId);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[router],
	);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Load history on mount
	useEffect(() => {
		apiFetch<{ data: { messages: ChatMessage[] } }>("/api/chat/history")
			.then((res) => {
				if (res.data.messages.length > 0) {
					setMessages(res.data.messages);
				}
			})
			.catch(() => {
				// Not logged in or no history — that's fine
			});
	}, []);

	// Auto-send ?prompt= parameter from deep links (e.g. quick action chips)
	useEffect(() => {
		if (promptHandled.current) return;
		const prompt = searchParams.get("prompt");
		if (prompt) {
			promptHandled.current = true;
			// Small delay to let history load first
			const timer = setTimeout(() => sendMessage(prompt), 300);
			return () => clearTimeout(timer);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	async function sendMessage(text: string) {
		if (!text.trim() || isLoading) return;

		const userMsg: ChatMessage = {
			id: `user-${Date.now()}`,
			role: "user",
			content: text,
			timestamp: new Date().toISOString(),
		};

		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setIsLoading(true);

		// Add streaming indicator
		const streamingMsg: ChatMessage = {
			id: `assistant-streaming`,
			role: "assistant",
			content: "",
			timestamp: new Date().toISOString(),
			isStreaming: true,
		};
		setMessages((prev) => [...prev, streamingMsg]);

		try {
			const res = await apiFetch<ChatResponse>("/api/chat", {
				method: "POST",
				body: JSON.stringify({ message: text }),
			});

			const assistantMsg: ChatMessage = {
				id: `assistant-${Date.now()}`,
				role: "assistant",
				content: res.data.content,
				timestamp: res.data.timestamp,
				blocks: res.data.blocks,
			};

			// Replace streaming indicator with actual response
			setMessages((prev) =>
				prev
					.filter((m) => m.id !== "assistant-streaming")
					.concat(assistantMsg),
			);
		} catch {
			// Remove streaming indicator and show error
			setMessages((prev) =>
				prev
					.filter((m) => m.id !== "assistant-streaming")
					.concat({
						id: `error-${Date.now()}`,
						role: "assistant",
						content: "죄송해요, 응답을 생성하지 못했어요. 다시 시도해주세요.",
						timestamp: new Date().toISOString(),
					}),
			);
		} finally {
			setIsLoading(false);
		}
	}

	function handleSuggest(prompt: string) {
		sendMessage(prompt);
	}

	return (
		<div className="flex h-[calc(100dvh-8rem)] flex-col">
			{/* ── Header ── */}
			<header className="flex items-center gap-3 border-b border-dotori-100/30 bg-white/80 px-5 py-3.5 backdrop-blur-xl">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={BRAND.appIconWarm} alt="" className="h-8 w-8" />
				<h1 className="text-xl font-bold">토리</h1>
				<Badge color="forest" className="text-[12px]">
					<span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-forest-500" />
					온라인
				</Badge>
			</header>

			{/* ── Messages ── */}
			<div className="flex-1 overflow-y-auto">
				{/* 웰컴 영역 — messages가 없을 때만 */}
				{messages.length === 0 && (
					<div className="relative flex flex-col items-center px-6 pb-4 pt-10 text-center">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={BRAND.symbolMonoWhite} alt="" className="absolute top-6 left-1/2 -translate-x-1/2 h-28 w-28 opacity-[0.04]" />
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.appIconWarm}
							alt=""
							className="relative mb-4 h-14 w-14"
						/>
						<h2 className="text-lg font-bold text-dotori-800">
							무엇을 도와드릴까요?
						</h2>
						<p className="mt-1.5 text-[15px] text-dotori-400">
							어린이집 검색, 입소 전략, 서류 준비까지
						</p>

						{/* 추천 프롬프트 카드 */}
						<div className="mt-6 grid w-full grid-cols-2 gap-3">
							{suggestedPrompts.map((sp) => (
								<button
									key={sp.label}
									onClick={() => handleSuggest(sp.prompt)}
									className={cn(
										"rounded-3xl bg-white px-5 py-4 text-left shadow-sm transition-all",
										"active:scale-[0.97] hover:bg-dotori-100",
									)}
								>
									<span className="block text-[14px] font-semibold text-dotori-700">
										{sp.label}
									</span>
									<span className="mt-1 block text-[12px] text-dotori-400 line-clamp-1">
										{sp.prompt}
									</span>
								</button>
							))}
						</div>
					</div>
				)}

				{/* 대화 메시지 */}
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
						>
							<p className="text-[15px]">{msg.content}</p>
						</ChatBubble>
					))}
					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* ── Input area ── */}
			<div className="border-t border-dotori-100/30 bg-white/80 px-5 py-3.5 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
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
						disabled={isLoading}
					/>
					<button
						onClick={() => sendMessage(input)}
						disabled={!input.trim() || isLoading}
						aria-label="메시지 전송"
						className={cn(
							"flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-[0.97]",
							input.trim() && !isLoading
								? "bg-dotori-900 text-white"
								: "bg-dotori-100 text-dotori-400",
						)}
					>
						<PaperAirplaneIcon className="h-5 w-5" />
					</button>
				</div>
			</div>
		</div>
	);
}
