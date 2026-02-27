'use client'

/**
 * ChatMessage — Individual message bubble (user/AI)
 * Warm Organic Premium: rounded organic shapes, natural tones
 */
import { memo } from 'react'
import { motion } from 'motion/react'
import { BRAND } from '@/lib/brand-assets'
import { cn, formatRelativeTime } from '@/lib/utils'
import { fadeUp } from '@/lib/motion'
import { DS_TEXT, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'

const USER_BUBBLE = cn(
  'rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%] shadow-md shadow-dotori-300/30 dark:shadow-dotori-950/50',
  'border border-dotori-300/45 bg-gradient-to-br from-dotori-500/95 via-dotori-500 to-dotori-600 text-white',
  'dark:border-dotori-500/35',
)
const AI_BUBBLE = cn(
  'rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%] shadow-md shadow-dotori-100/60 dark:shadow-dotori-950/50',
  'border border-dotori-200/85 bg-gradient-to-br from-white/95 via-dotori-50/95 to-dotori-100/80 text-dotori-900',
  'dark:border-dotori-700/70 dark:bg-dotori-900/88 dark:text-dotori-50',
)
const AVATAR_RING = 'h-8 w-8 shrink-0 rounded-full border border-dotori-100/70 p-1 shadow-sm dark:border-dotori-800/70'
const STREAM_DOT = 'h-2 w-2 rounded-full bg-dotori-400 dark:bg-dotori-500 origin-bottom'
const STREAMING_PHASES = [0, 0.25, 0.5] as const

export const ChatMessage = memo(function ChatMessage({
  role,
  content,
  timestamp,
  isStreaming,
}: {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
  isStreaming?: boolean
}) {
  const timeStr = timestamp ? formatRelativeTime(timestamp.toISOString()) : ''

  if (role === 'user') {
    return (
      <motion.div className="mb-3 flex justify-end" {...fadeUp} role="log" aria-label="사용자 메시지">
        <div className={cn(DS_TYPOGRAPHY.body, USER_BUBBLE)}>
          <p className="whitespace-pre-wrap">{content}</p>
          {timeStr && (
            <span className="mt-1 block text-right text-xs text-dotori-100/80" suppressHydrationWarning>
              {timeStr}
            </span>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div className="mb-3 flex justify-start gap-2.5" {...fadeUp} role="log" aria-label="어시스턴트 메시지">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND.symbol} alt="토리" className={AVATAR_RING} />
      <div className="flex max-w-[85%] flex-col gap-1.5">
        <span className={cn(DS_TYPOGRAPHY.caption, 'font-semibold text-dotori-600 dark:text-dotori-300')}>
          토리
        </span>
        <div className={cn(DS_TYPOGRAPHY.body, AI_BUBBLE)}>
          {isStreaming && !content ? (
            <div className="flex gap-1.5 py-1" role="status" aria-label="응답 생성 중">
              {STREAMING_PHASES.map((delay) => (
                <motion.span
                  key={delay}
                  className={STREAM_DOT}
                  initial={{ opacity: 0.4, scaleY: 0.35 }}
                  animate={{ opacity: [0.4, 1, 0.4], scaleY: [0.35, 1, 0.35] }}
                  transition={{ repeat: Infinity, duration: 0.72, delay, ease: 'easeInOut' }}
                />
              ))}
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
          {isStreaming && content && (
            <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-dotori-500" aria-hidden="true" />
          )}
        </div>
        {timeStr && (
          <span className={cn(DS_TYPOGRAPHY.caption, DS_TEXT.secondary, 'px-1')} suppressHydrationWarning>
            {timeStr}
          </span>
        )}
      </div>
    </motion.div>
  )
})
