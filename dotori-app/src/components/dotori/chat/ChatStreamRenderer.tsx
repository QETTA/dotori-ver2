'use client'

/**
 * ChatStreamRenderer — SSE stream receiver + real-time rendering
 * Scrolls to bottom on new messages, AnimatePresence for list
 */
import { useRef, useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import { ChatMessage } from './ChatMessage'

export interface StreamMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
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
    <div className="flex-1 space-y-1 overflow-y-auto">
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
          />
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
