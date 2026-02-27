"use client";

import { DsButton } from "@/components/ds/DsButton";
import { BRAND } from "@/lib/brand-assets";
import { DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
import { fadeUp, tap } from "@/lib/motion";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ActionButton, ChatBlock, ChatRole, SourceInfo } from "@/types/dotori";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { isValidElement, memo } from "react";
import { BlockRenderer } from "./blocks/BlockRenderer";
import { SourceChip } from "./SourceChip";

const USER_BUBBLE_CLASS = cn(
	/* Base bubble shape */
	'rounded-2xl px-4 py-3 max-w-[85%] transition-colors duration-150 shadow-md shadow-dotori-300/30 dark:shadow-dotori-950/50',
	/* User tone — brand gradient */
	'rounded-br-sm border border-dotori-300/45',
	'bg-gradient-to-br from-dotori-500/95 via-dotori-500 to-dotori-600 text-white',
	'dark:border-dotori-500/35',
);
const ASSISTANT_BUBBLE_CLASS = cn(
	/* Base bubble shape */
	'rounded-2xl px-4 py-3 max-w-[85%] transition-colors duration-150 shadow-md shadow-dotori-100/60 dark:shadow-dotori-950/50',
	/* Assistant tone — warm white-to-cream */
	'rounded-bl-sm border border-dotori-200/85',
	'bg-gradient-to-br from-white/95 via-dotori-50/95 to-dotori-100/80 text-dotori-900',
	'dark:border-dotori-700/70 dark:bg-dotori-900/88 dark:via-dotori-900/86 dark:to-dotori-800/86 dark:text-dotori-50',
);
const CHAT_BUBBLE_ACTION_BUTTON = cn(
	'min-h-10 rounded-2xl px-3.5',
	'border border-dotori-200/90 bg-white/85 text-dotori-700',
	'transition-all duration-150 hover:bg-dotori-50',
	'dark:border-dotori-700/80 dark:bg-dotori-900/60 dark:text-dotori-100 dark:hover:bg-dotori-900/80',
);
const CHAT_QUICK_REPLY_BUTTON = cn(
	'min-h-10 rounded-2xl px-3.5',
	'border border-dotori-200/90 bg-dotori-100/80 text-dotori-700',
	'transition-all duration-150 hover:bg-dotori-100',
	'dark:border-dotori-700/80 dark:bg-dotori-900/60 dark:text-dotori-100 dark:hover:bg-dotori-900/80',
);
const STREAM_DOT = 'h-2 w-2 rounded-full bg-dotori-400 dark:bg-dotori-500 origin-bottom';
const AVATAR_RING = 'h-8 w-8 shrink-0 rounded-full border border-dotori-100/70 p-1 shadow-sm dark:border-dotori-800/70';

const STREAMING_DOT_PHASES = [0, 0.25, 0.5] as const;

export const ChatBubble = memo(function ChatBubble({
	role,
	children,
	timestamp,
	sources,
	isStreaming,
	actions,
	blocks,
	onBlockAction,
	onQuickReply,
	quickReplies,
	isRead = true,
}: {
	role: ChatRole;
	children?: ReactNode;
	timestamp: string;
	sources?: SourceInfo[];
	isStreaming?: boolean;
	actions?: ActionButton[];
	blocks?: ChatBlock[];
	onBlockAction?: (actionId: string) => void;
	onQuickReply?: (value: string) => void;
	quickReplies?: string[];
	isRead?: boolean;
}) {
	const childProps = isValidElement(children) ? (children.props as Record<string, unknown>) : null;
	const relativeTime = formatRelativeTime(timestamp);
	const hasStreamingContent =
		typeof childProps?.["content"] === "string"
			? (childProps["content"] as string).trim().length > 0
			: Boolean(childProps?.["children"]);
	const normalizedQuickReplies = quickReplies?.slice(0, 4);
	const showQuickReplies =
		normalizedQuickReplies && normalizedQuickReplies.length > 0 && !isStreaming;

	if (role === "user") {
		return (
			<motion.div
				role="log"
				aria-label="사용자 메시지"
				className="mb-3 flex justify-end"
				{...fadeUp}
			>
				<div className={cn(DS_TYPOGRAPHY.body, USER_BUBBLE_CLASS)}>
					<div className="space-y-1">
						{children}
						<span
							className={cn(
								DS_TYPOGRAPHY.caption,
								'mt-1 flex items-center justify-end gap-1.5 text-dotori-100/90',
							)}
							suppressHydrationWarning
						>
							{isRead ? (
								<>
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
								</>
							) : null}
							{relativeTime}
						</span>
					</div>
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			role="log"
			aria-label="어시스턴트 메시지"
			className="mb-3 flex justify-start gap-2.5"
			{...fadeUp}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.symbol}
				alt="토리"
				className={cn(AVATAR_RING)}
			/>
			<div className="flex max-w-[85%] gap-1.5">
				<div className="mt-6 w-0.5 shrink-0 self-stretch rounded-full bg-dotori-300/60 dark:bg-dotori-600/40" />
				<div className="flex flex-col gap-1.5">
				<span className={cn(DS_TYPOGRAPHY.caption, 'font-semibold text-dotori-600 dark:text-dotori-300')}>
					토리
				</span>
				<div className={cn(DS_TYPOGRAPHY.body, ASSISTANT_BUBBLE_CLASS)}>
					{isStreaming && !hasStreamingContent ? (
						<div className="flex gap-1.5 py-1">
							{STREAMING_DOT_PHASES.map((delay) => (
								<motion.span
									key={delay}
									className={STREAM_DOT}
									initial={{ opacity: 0.4, scaleY: 0.35, y: 0 }}
									animate={{ opacity: [0.4, 1, 0.4], scaleY: [0.35, 1, 0.35], y: [0, -3, 0] }}
									transition={{
										repeat: Infinity,
										duration: 0.72,
										delay,
										ease: "easeInOut",
									}}
									role="status"
								/>
							))}
						</div>
					) : blocks && blocks.length > 0 ? (
						<BlockRenderer blocks={blocks} onAction={onBlockAction} />
					) : (
						children
					)}

					{isStreaming ? (
						<span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-dotori-500" aria-hidden="true" />
					) : null}
				</div>
				{sources && sources.length > 0 && (
					<div className="flex flex-wrap gap-1.5 px-1">
						{sources.map((s, i) => (
							<SourceChip key={`${s.source}-${i}`} {...s} />
						))}
					</div>
				)}
				{actions && actions.length > 0 ? (
					<div className="flex flex-wrap gap-2 px-1">
						{actions.map((a) =>
							a.variant === "outline" ? (
								<motion.div key={a.id} {...tap.button}>
									<DsButton
										variant="ghost"
										onClick={() => onBlockAction?.(a.id)}
										className={cn(DS_TYPOGRAPHY.bodySm, CHAT_BUBBLE_ACTION_BUTTON)}
									>
										{a.label}
									</DsButton>
								</motion.div>
							) : (
								<motion.div key={a.id} {...tap.button}>
									<DsButton
										onClick={() => onBlockAction?.(a.id)}
										className={cn(
											DS_TYPOGRAPHY.bodySm,
											'min-h-10 rounded-2xl px-3.5',
										)}
									>
										{a.label}
									</DsButton>
								</motion.div>
							),
						)}
					</div>
				) : null}
				{showQuickReplies ? (
					<div className="flex flex-wrap gap-2 px-1">
						{normalizedQuickReplies?.map((text) => (
							<motion.div key={text} {...tap.chip}>
								<DsButton
									variant="ghost"
									onClick={() => onQuickReply?.(text)}
									className={cn(
										DS_TYPOGRAPHY.bodySm,
										CHAT_QUICK_REPLY_BUTTON,
									)}
								>
									{text}
								</DsButton>
							</motion.div>
						))}
					</div>
				) : null}
				<span
					className={cn(DS_TYPOGRAPHY.caption, 'px-1 text-dotori-600 dark:text-dotori-300')}
					suppressHydrationWarning
				>
					{relativeTime}
				</span>
				</div>
			</div>
		</motion.div>
	);
});
