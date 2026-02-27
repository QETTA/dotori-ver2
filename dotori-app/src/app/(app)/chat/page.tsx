'use client'

/**
 * Chat Page — Full streaming UX (Wave 7)
 *
 * Catalyst: Heading, Text, Navbar
 * Chat: ChatMessage, ChatStreamRenderer, ChatInput, QuickActionChips
 * API: /api/chat/stream (SSE, Anthropic Claude)
 */
import { useState, useCallback, useRef } from 'react'
import {
  SparklesIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'motion/react'
import { copy } from '@/lib/brand-copy'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Navbar, NavbarSection, NavbarItem, NavbarSpacer } from '@/components/catalyst/navbar'
import { glowCard, gradientText } from '@/lib/motion'
import { FadeIn } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { CircleBackground } from '@/components/dotori/CircleBackground'
import { ChatStreamRenderer, type StreamMessage } from '@/components/dotori/chat/ChatStreamRenderer'
import { ChatInput } from '@/components/dotori/chat/ChatInput'
import { QuickActionChips } from '@/components/dotori/chat/QuickActionChips'
import { getContextualPrompts } from '@/lib/engine/keyword-registry'

export const CHAT_ACTION_ROUTES: Record<string, string> = {
  explore: '/explore',
  waitlist: '/my/waitlist',
  interests: '/my/interests',
  community: '/community',
  settings: '/my/settings',
  login: '/login',
  import: '/my/import',
}

export const QUICK_ACTION_MAP: Record<string, string> = {
  recommend: '동네 추천해줘',
  compare: '시설 비교해줘',
  strategy: '입소 전략 정리해줘',
  generate_report: '동네 추천해줘',
  generate_checklist: '입소 체크리스트 정리해줘',
  checklist: '입소 체크리스트 정리해줘',
  broaden: '다른 시설을 더 찾아줘',
}

export function isKnownBlockAction(actionId: string): boolean {
  if (actionId.startsWith('facility_')) return true
  return Boolean(CHAT_ACTION_ROUTES[actionId] || QUICK_ACTION_MAP[actionId])
}

let msgCounter = 0

export default function ChatPage() {
  const [messages, setMessages] = useState<StreamMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const hasMessages = messages.length > 0

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
            const event = JSON.parse(data)
            if (event.type === 'text') {
              accumulated += event.text
              setStreamContent(accumulated)
            }
          } catch {
            // partial JSON, skip
          }
        }
      }

      // Finalize assistant message
      if (accumulated) {
        const aiMsg: StreamMessage = {
          id: `msg-${++msgCounter}`,
          role: 'assistant',
          content: accumulated,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMsg])
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      // Add error message
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
      <BrandWatermark className="opacity-30" />
      {/* ══════ NAVBAR ══════ */}
      <div className="sticky top-0 z-30 -mx-6 -mt-6 px-4 glass-header">
        <Navbar>
          <NavbarSection>
            <NavbarItem current>
              <span className="font-wordmark text-base/6 font-bold text-dotori-950 dark:text-white">
                토리챗
              </span>
            </NavbarItem>
          </NavbarSection>
          <NavbarSpacer />
          <NavbarSection>
            <NavbarItem href="/my">
              <UserIcon className="h-5 w-5" data-slot="icon" />
            </NavbarItem>
          </NavbarSection>
        </Navbar>
      </div>

      {/* ══════ EMPTY STATE or MESSAGES ══════ */}
      <AnimatePresence mode="wait">
        {!hasMessages ? (
          <FadeIn key="empty" className="flex flex-1 flex-col space-y-10 pt-10">
            {/* Header */}
            <div className="relative">
              <CircleBackground
                color="var(--color-dotori-400)"
                className="absolute -right-2 -top-2 h-72 w-72 opacity-[0.15]"
              />
              <FadeIn>
                <p className={DS_PAGE_HEADER.eyebrow}>
                  AI 이동 전략 상담
                </p>
              </FadeIn>
              <FadeIn>
                <h1 className={`mt-4 font-wordmark text-4xl/[1.15] font-bold tracking-tight sm:text-4xl/[1.15] ${gradientText}`}>
                  토리 톡
                </h1>
              </FadeIn>
              <FadeIn>
                <Text className="mt-4 text-base/7 text-dotori-700 dark:text-dotori-400">
                  {copy.chat.panelDescription}
                </Text>
              </FadeIn>
            </div>

            {/* Empty state icon — multi-layer depth */}
            <div className="flex flex-col items-center py-4">
              <div className="relative">
                {/* Ambient glow layer */}
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-dotori-400/20 via-amber-300/15 to-dotori-300/10 blur-xl dark:from-dotori-500/10 dark:via-amber-500/8 dark:to-dotori-400/5" />
                <motion.div
                  {...glowCard}
                  className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-dotori-300/80 via-dotori-200/60 to-amber-100/50 shadow-[0_8px_32px_rgba(176,122,74,0.2)] ring-2 ring-dotori-300/50 ring-offset-2 ring-offset-white dark:from-dotori-600/60 dark:via-dotori-700/50 dark:to-amber-800/30 dark:shadow-[0_8px_32px_rgba(176,122,74,0.15)] dark:ring-dotori-500/30 dark:ring-offset-dotori-950"
                >
                  {/* Inner highlight */}
                  <div className="absolute inset-0.5 rounded-[22px] bg-gradient-to-b from-white/40 to-transparent dark:from-white/10" />
                  <SparklesIcon className="relative h-9 w-9 text-dotori-600 dark:text-dotori-200" />
                </motion.div>
              </div>
              <Heading level={2} className="mt-6 text-center text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
                {copy.chat.emptyGuide}
              </Heading>
              <Text className="mt-2 text-center text-xs/5 text-dotori-600 sm:text-xs/5 dark:text-dotori-400">
                아래 질문을 선택하거나 직접 입력해보세요
              </Text>
              <div className="mt-6 h-0.5 w-10 rounded-full bg-dotori-400 dark:bg-dotori-500" />
            </div>

            {/* Quick action chips — seasonal rotation */}
            <div className="pb-16">
              <QuickActionChips
                chips={getContextualPrompts().map((p) => p.label)}
                onSelect={handleChipSelect}
              />
            </div>
          </FadeIn>
        ) : (
          <div key="messages" className="flex-1 py-6">
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
