'use client'

import { memo, isValidElement } from 'react'
import { Button } from '@/components/catalyst/button'
import { BRAND } from '@/lib/brand-assets'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { ActionButton, ChatBlock, ChatRole, SourceInfo } from '@/types/dotori'
import type { ReactNode } from 'react'
import { BlockRenderer } from './blocks/BlockRenderer'
import { SourceChip } from './SourceChip'

export const ChatBubble = memo(function ChatBubble({
	role,
	children,
	timestamp,
	sources,
	isStreaming,
	actions,
	blocks,
	onBlockAction,
}: {
	role: ChatRole
	children?: ReactNode
	timestamp: string
	sources?: SourceInfo[]
	isStreaming?: boolean
	actions?: ActionButton[]
	blocks?: ChatBlock[]
	onBlockAction?: (actionId: string) => void
}) {
	const childProps = isValidElement(children) ? (children.props as Record<string, unknown>) : null;
	const relativeTime = formatRelativeTime(timestamp);
	const hasStreamingContent =
		typeof childProps?.['content'] === 'string'
			? (childProps['content'] as string).trim().length > 0
			: Boolean(childProps?.['children']);

	if (role === 'user') {
		return (
			<div
				role="log"
				aria-label="사용자 메시지"
				className={cn(
					'mb-3 flex justify-end',
					'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 duration-300'
				)}
			>
				<div
					className={cn(
						'max-w-[85%] rounded-2xl rounded-br-sm bg-dotori-500 px-4 py-3 text-white shadow-none'
					)}
				>
					{children}
					<span
						className="mt-1 block text-right text-[12px] text-dotori-200"
						suppressHydrationWarning
					>
						{relativeTime}
					</span>
				</div>
			</div>
		)
	}

	return (
		<div
			role="log"
			aria-label="어시스턴트 메시지"
			className={cn(
				'mb-3 flex justify-start gap-2.5',
				'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 duration-300'
			)}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.symbol}
				alt="토리"
				className="mt-1 h-9 w-9 shrink-0 rounded-full"
			/>
			<div className="flex max-w-[85%] flex-col gap-2">
				<div
					className={cn(
						'rounded-2xl rounded-bl-sm border-none bg-dotori-50 px-4 py-3 shadow-none'
					)}
				>
					{isStreaming && !hasStreamingContent ? (
						<div className="flex gap-1.5 py-1">
							{[0, 150, 300].map((delay) => (
								<span
									key={delay}
									className="h-2 w-2 rounded-full bg-dotori-300 animate-bounce"
									style={{ animationDelay: `${delay}ms` }}
								/>
							))}
						</div>
					) : blocks && blocks.length > 0 ? (
						<BlockRenderer blocks={blocks} onAction={onBlockAction} />
					) : (
						children
					)}
				</div>
				{sources && sources.length > 0 && (
					<div className="flex flex-wrap gap-1.5 px-1">
						{sources.map((s, i) => (
							<SourceChip key={`${s.source}-${i}`} {...s} />
						))}
					</div>
				)}
				{actions && actions.length > 0 && (
					<div className="flex flex-wrap gap-2 px-1">
						{actions.map((a) =>
							a.variant === 'outline' ? (
								<Button key={a.id} plain={true} onClick={() => onBlockAction?.(a.id)}>
									{a.label}
								</Button>
							) : (
								<Button key={a.id} color="dotori" onClick={() => onBlockAction?.(a.id)}>
									{a.label}
								</Button>
							)
						)}
					</div>
				)}
				<span className="px-1 text-[12px] text-dotori-400" suppressHydrationWarning>
					{relativeTime}
				</span>
			</div>
		</div>
	)
})
