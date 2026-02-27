'use client'

/**
 * ChatStreamRenderer — SSE stream receiver + real-time rendering
 * Scrolls to bottom on new messages, AnimatePresence for list
 */
import { useRef, useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import { ChatMessage } from './ChatMessage'
import { ActionBlockRenderer } from './ActionBlockRenderer'
import type { ChatBlock } from '@/types/dotori'
import { DS_SURFACE } from '@/lib/design-system/page-tokens'
import { cn } from '@/lib/utils'

export interface StreamMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  blocks?: ChatBlock[]
}

export function ChatStreamRenderer({
  messages,
  isStreaming,
  streamContent,
}: {
  messages: StreamMessage[]
  isStreaming: boolean
  streamContent: string
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamContent])

  return (
    <div className={cn(DS_SURFACE.primary, 'flex-1 space-y-1 overflow-y-auto')}>
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            <ChatMessage role={msg.role} content={msg.content} timestamp={msg.timestamp} />
            {msg.role === 'assistant' && msg.blocks && msg.blocks.length > 0 ? (
              <div className="ml-10">
                <ActionBlockRenderer blocks={msg.blocks} />
              </div>
            ) : null}
          </div>
        ))}
      </AnimatePresence>

      {/* Active streaming message */}
      {isStreaming && (
        <ChatMessage
          role="assistant"
          content={streamContent}
          isStreaming
        />
      )}

      <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
}
