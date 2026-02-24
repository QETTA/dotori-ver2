'use client'

import { DsButton } from "@/components/ds/DsButton";
import { BRAND } from '@/lib/brand-assets'
import { DS_GLASS, DS_LAYOUT, DS_STATUS, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { fadeUp, tap } from '@/lib/motion'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { ActionButton, ChatBlock, ChatRole, SourceInfo } from '@/types/dotori'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { isValidElement, memo } from 'react'
import { BlockRenderer } from './blocks/BlockRenderer'
import { SourceChip } from './SourceChip'

const BUBBLE_CONTENT_CLASS =
  'rounded-2xl px-4 py-3 max-w-[85%] transition-colors duration-150 shadow-sm shadow-dotori-100/50 dark:shadow-dotori-950/40'
const USER_BUBBLE_CLASS = cn(
  DS_LAYOUT.CARD_SOFT,
  DS_GLASS.CARD,
  BUBBLE_CONTENT_CLASS,
  'rounded-br-sm border border-dotori-300/45 bg-gradient-to-br from-dotori-500/95 via-dotori-500 to-dotori-600 text-white dark:border-dotori-500/35',
)
const ASSISTANT_BUBBLE_CLASS = cn(
  DS_LAYOUT.CARD_SOFT,
  DS_GLASS.CARD,
  BUBBLE_CONTENT_CLASS,
  'rounded-bl-sm border border-dotori-200/85 bg-gradient-to-br from-white/95 via-dotori-50/95 to-dotori-100/80 text-dotori-900 dark:border-dotori-700/70 dark:bg-dotori-900/88 dark:via-dotori-900/86 dark:to-dotori-800/86 dark:text-dotori-50',
)
const ACTION_BUTTON_CLASS =
  'min-h-10 rounded-2xl border border-dotori-200/90 bg-white/85 px-3.5 text-dotori-700 transition-all duration-150 hover:bg-dotori-50 dark:border-dotori-700/80 dark:bg-dotori-900/60 dark:text-dotori-100 dark:hover:bg-dotori-900/80'
const QUICK_REPLY_CLASS =
  'min-h-10 rounded-2xl border border-dotori-200/90 bg-dotori-100/80 px-3.5 text-dotori-700 transition-all duration-150 hover:bg-dotori-100 dark:border-dotori-700/80 dark:bg-dotori-900/60 dark:text-dotori-100 dark:hover:bg-dotori-900/80'
const AVATAR_RING_CLASS =
  'rounded-full bg-white p-1.5 shadow-sm ring-1 ring-dotori-200/55 transition-shadow duration-150 dark:bg-dotori-950/70 dark:ring-dotori-700/60'

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
  role: ChatRole
  children?: ReactNode
  timestamp: string
  sources?: SourceInfo[]
  isStreaming?: boolean
  actions?: ActionButton[]
  blocks?: ChatBlock[]
  onBlockAction?: (actionId: string) => void
  onQuickReply?: (value: string) => void
  quickReplies?: string[]
  isRead?: boolean
}) {
  const childProps = isValidElement(children) ? (children.props as Record<string, unknown>) : null
  const relativeTime = formatRelativeTime(timestamp)
  const hasStreamingContent =
    typeof childProps?.['content'] === 'string'
      ? (childProps['content'] as string).trim().length > 0
      : Boolean(childProps?.['children'])
  const normalizedQuickReplies = quickReplies?.slice(0, 4)
  const showQuickReplies =
    normalizedQuickReplies && normalizedQuickReplies.length > 0 && !isStreaming

  if (role === 'user') {
    return (
      <motion.div
        role="log"
        aria-label="사용자 메시지"
        className={cn('mb-3 flex justify-end')}
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
    )
  }

  return (
    <motion.div
      role="log"
      aria-label="어시스턴트 메시지"
      className={cn('mb-3 flex justify-start gap-2.5')}
      {...fadeUp}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND.symbol}
        alt="토리"
        className={cn(
          AVATAR_RING_CLASS,
          'border border-dotori-100/70 p-0.5 dark:border-dotori-800/70',
          DS_STATUS.available.dot,
        )}
      />
      <div className="flex max-w-[85%] flex-col gap-2">
        <div className={cn(DS_GLASS.CARD, DS_TYPOGRAPHY.body, ASSISTANT_BUBBLE_CLASS)}>
          {isStreaming && !hasStreamingContent ? (
            <div className="flex gap-1.5 py-1">
              {[0, 250, 500].map((delay) => (
                <span
                  key={delay}
                  className="h-2 w-2 animate-bounce rounded-full bg-dotori-400 dark:bg-dotori-500"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          ) : blocks && blocks.length > 0 ? (
            <BlockRenderer blocks={blocks} onAction={onBlockAction} />
          ) : (
            children
          )}

          {isStreaming ? (
            <span
              className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-dotori-500"
              aria-hidden="true"
            />
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
              a.variant === 'outline' ? (
                <motion.div key={a.id} {...tap.button}>
                  <DsButton
                    variant="ghost"
                    onClick={() => onBlockAction?.(a.id)}
                    className={cn(DS_TYPOGRAPHY.bodySm, ACTION_BUTTON_CLASS)}
                  >
                    {a.label}
                  </DsButton>
                </motion.div>
              ) : (
                <motion.div key={a.id} {...tap.button}>
                  <DsButton
                   
                    onClick={() => onBlockAction?.(a.id)}
                    className={cn(DS_TYPOGRAPHY.bodySm, 'min-h-10 rounded-2xl px-3.5')}
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
                  className={cn(DS_TYPOGRAPHY.bodySm, QUICK_REPLY_CLASS)}
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
    </motion.div>
  )
})
