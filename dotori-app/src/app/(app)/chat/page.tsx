'use client'

/**
 * Chat Page — Premium editorial + glassmorphism
 *
 * Design: Glassmorphism navbar, prompt-panel empty state,
 * streaming messages + sticky input bar
 */
import { useState, useCallback, useRef } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { AnimatePresence } from 'motion/react'
import { Navbar, NavbarSection, NavbarItem, NavbarSpacer } from '@/components/catalyst/navbar'
import { FadeIn } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { ChatStreamRenderer, type StreamMessage } from '@/components/dotori/chat/ChatStreamRenderer'
import { ChatInput } from '@/components/dotori/chat/ChatInput'
import { ChatPromptPanel, type ChatPromptPanelItem } from '@/components/dotori/chat/ChatPromptPanel'
import { suggestedPrompts, TORI_ICON } from '@/app/(app)/chat/_lib/chat-config'
import { cn } from '@/lib/utils'
import { DS_TYPOGRAPHY, DS_GLASS, DS_STATUS } from '@/lib/design-system/tokens'
import type { ChatBlock } from '@/types/dotori'

let msgCounter = 0

export default function ChatPage() {
  const [messages, setMessages] = useState<StreamMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const hasMessages = messages.length > 0
  const [messageListRef] = useAutoAnimate({ duration: 200 })
  const [selectedPromptLabel, setSelectedPromptLabel] = useState<string>(suggestedPrompts[0].label)

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: StreamMessage = {
      id: `msg-${++msgCounter}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsStreaming(true)
    setStreamContent('')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error(`Stream failed: ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let assistantBlocks: ChatBlock[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const event = JSON.parse(data) as {
              type?: string
              text?: string
              block?: ChatBlock
            }
            if (event.type === 'block' && event.block) {
              assistantBlocks = [...assistantBlocks, event.block]
              continue
            }
            if (event.type === 'text' && typeof event.text === 'string') {
              accumulated += event.text
              setStreamContent(accumulated)
            }
          } catch {
            // partial JSON, skip
          }
        }
      }

      if (accumulated) {
        const aiMsg: StreamMessage = {
          id: `msg-${++msgCounter}`,
          role: 'assistant',
          content: accumulated,
          timestamp: new Date(),
          blocks: assistantBlocks.length > 0 ? assistantBlocks : undefined,
        }
        setMessages((prev) => [...prev, aiMsg])
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const errMsg: StreamMessage = {
        id: `msg-${++msgCounter}`,
        role: 'assistant',
        content: '죄송해요, 응답 생성 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsStreaming(false)
      setStreamContent('')
      abortRef.current = null
    }
  }, [])

  const handlePromptSelect = useCallback(
    (prompt: ChatPromptPanelItem) => {
      setSelectedPromptLabel(prompt.label)
      sendMessage(prompt.prompt)
    },
    [sendMessage],
  )

  return (
    <div className="relative flex min-h-[70vh] flex-col">
      <BrandWatermark className="opacity-20" />

      {/* ══════ NAVBAR — glassmorphism ══════ */}
      <div
        className={cn(
          'sticky top-0 z-30 -mx-6 -mt-6 border-b border-dotori-200/70 px-4 dark:border-dotori-800/70',
          DS_GLASS.nav,
          DS_GLASS.dark.nav,
        )}
      >
        <Navbar>
          <NavbarSection>
            <NavbarItem current>
              <div className="flex items-center gap-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={TORI_ICON}
                  alt=""
                  aria-hidden="true"
                  className={cn(
                    'h-8 w-8 shrink-0 rounded-full border border-dotori-200/80 bg-white shadow-sm',
                    'dark:border-dotori-700 dark:bg-dotori-900 dark:shadow-none',
                  )}
                />
                <div className="flex items-center gap-0.5">
                  <span
                    className={cn(
                      DS_TYPOGRAPHY.h3,
                      'font-wordmark font-bold tracking-tight text-dotori-900 dark:text-dotori-50',
                    )}
                  >
                    토리
                  </span>
                  <span
                    className={cn(
                      DS_TYPOGRAPHY.label,
                      'inline-flex items-center gap-0.5 whitespace-nowrap rounded-full border border-forest-200/70 bg-forest-50 px-1.5 py-0.5 font-semibold text-forest-800',
                      'dark:border-forest-700/40 dark:bg-forest-900/20 dark:text-forest-100',
                    )}
                  >
                    <span
                      className={cn('h-1.5 w-1.5 rounded-full', DS_STATUS.available.dot)}
                      aria-hidden="true"
                    />
                    온라인
                  </span>
                </div>
              </div>
            </NavbarItem>
          </NavbarSection>
          <NavbarSpacer />
        </Navbar>
      </div>

      {/* ══════ EMPTY STATE or MESSAGES ══════ */}
      <AnimatePresence mode="wait">
        {!hasMessages ? (
          <FadeIn key="empty" className="flex flex-1 flex-col pb-16 pt-6">
            <ChatPromptPanel
              selectedPromptLabel={selectedPromptLabel}
              onSelectPrompt={handlePromptSelect}
              onSuggestPrompt={handlePromptSelect}
              toriIcon={TORI_ICON}
            />
          </FadeIn>
        ) : (
          <div key="messages" ref={messageListRef} className="flex-1 py-6">
            <ChatStreamRenderer
              messages={messages}
              isStreaming={isStreaming}
              streamContent={streamContent}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ══════ INPUT BAR ══════ */}
      <div className="sticky bottom-20 mt-auto pt-2">
        <ChatInput
          onSend={sendMessage}
          disabled={isStreaming}
          placeholder="예) 반편성이 바뀌었는데, 지금 옮겨도 될까요?"
        />
      </div>
    </div>
  )
}
