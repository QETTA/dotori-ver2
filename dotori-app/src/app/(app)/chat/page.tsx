'use client'

/**
 * Chat Page — Premium editorial + glassmorphism
 *
 * Design: Gradient text hero, brand-tinted shadow empty card,
 * glassmorphism navbar, contextual color chips
 */
import { useState, useCallback, useRef } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { AnimatePresence, motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { copy } from '@/lib/brand-copy'
import { hoverLift, gradientTextHero } from '@/lib/motion'
import { Subheading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Navbar, NavbarSection, NavbarItem, NavbarSpacer } from '@/components/catalyst/navbar'
import { FadeIn } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { NoiseTexture } from '@/components/dotori/NoiseTexture'
import { ChatStreamRenderer, type StreamMessage } from '@/components/dotori/chat/ChatStreamRenderer'
import { ChatInput } from '@/components/dotori/chat/ChatInput'
import { QuickActionChips } from '@/components/dotori/chat/QuickActionChips'
import { getContextualPrompts } from '@/lib/engine/keyword-registry'
import { cn } from '@/lib/utils'
import { DS_TYPOGRAPHY, DS_GLASS } from '@/lib/design-system/tokens'
import { DS_PAGE_HEADER, DS_EMPTY_STATE } from '@/lib/design-system/page-tokens'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import type { ChatBlock } from '@/types/dotori'

let msgCounter = 0

export default function ChatPage() {
  const [messages, setMessages] = useState<StreamMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const hasMessages = messages.length > 0
  const [messageListRef] = useAutoAnimate({ duration: 200 })

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

  const handleChipSelect = useCallback(
    (chip: string) => {
      sendMessage(chip)
    },
    [sendMessage],
  )

  return (
    <div className="relative flex min-h-[70vh] flex-col">
      <BrandWatermark className="opacity-20" />

      {/* ══════ NAVBAR — glassmorphism ══════ */}
      <div className={cn("sticky top-0 z-30 -mx-6 -mt-6 border-b border-gray-950/5 px-4 dark:border-white/10", DS_GLASS.nav, DS_GLASS.dark.nav)}>
        <Navbar>
          <NavbarSection>
            <NavbarItem current>
              <span className={cn(DS_TYPOGRAPHY.h3, 'font-wordmark font-bold text-dotori-900 dark:text-dotori-50')}>
                토리챗
              </span>
            </NavbarItem>
          </NavbarSection>
          <NavbarSpacer />
        </Navbar>
      </div>

      {/* ══════ EMPTY STATE or MESSAGES ══════ */}
      <AnimatePresence mode="wait">
        {!hasMessages ? (
          <FadeIn key="empty" className="flex flex-1 flex-col space-y-8 pt-10">
            {/* Header — gradient text hero */}
            <div>
              <FadeIn>
                <p className={DS_PAGE_HEADER.eyebrow}>
                  AI 이동 전략 상담
                </p>
              </FadeIn>
              <FadeIn>
                <h1 className={cn('mt-4 font-wordmark text-3xl/[1.2] font-extrabold tracking-tight', gradientTextHero)}>
                  {copy.chat.panelDescription}
                </h1>
              </FadeIn>
              <FadeIn>
                <Text className={cn(DS_PAGE_HEADER.subtitle, 'mt-3 text-base/7')}>
                  아래 질문을 선택하거나 직접 입력해보세요
                </Text>
              </FadeIn>
            </div>

            {/* Empty state card — glass + gradient mesh cool */}
            <FadeIn>
              <motion.div
                {...hoverLift}
                className={cn('relative overflow-hidden gradient-mesh-cool', DS_CARD.glass.base, DS_CARD.glass.dark)}
              >
                <NoiseTexture />
                <div className="h-1.5 bg-gradient-to-r from-violet-500 via-dotori-500 to-amber-400" />
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <Sparkles className="h-8 w-8 text-dotori-400" />
                  <Subheading level={2} className={cn(DS_EMPTY_STATE.title, 'sm:text-sm/6')}>
                    {copy.chat.emptyGuide}
                  </Subheading>
                  <Text className={DS_EMPTY_STATE.description}>
                    입소 전략, 시설 추천, 서류 준비까지 도와드려요
                  </Text>
                </div>
              </motion.div>
            </FadeIn>

            {/* Quick action chips */}
            <div className="pb-16">
              <QuickActionChips
                chips={getContextualPrompts().map((p) => p.label)}
                onSelect={handleChipSelect}
              />
            </div>
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
        />
      </div>
    </div>
  )
}
