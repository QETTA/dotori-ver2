'use client'

import { Badge } from '@/components/catalyst/badge'
import { DsButton } from "@/components/ds/DsButton";
import { Field, Fieldset, Label } from '@/components/catalyst/fieldset'
import { Heading } from '@/components/catalyst/heading'
import { Input } from '@/components/catalyst/input'
import { Text } from '@/components/catalyst/text'
import { ChatPromptPanel, type ChatPromptPanelItem } from '@/components/dotori/chat/ChatPromptPanel'
import { useChatStream } from '@/components/dotori/chat/useChatStream'
import { ChatBubble } from '@/components/dotori/ChatBubble'
import EmptyStateFallback from '@/components/dotori/EmptyState'
import { MarkdownText } from '@/components/dotori/MarkdownText'
import { Skeleton } from '@/components/dotori/Skeleton'
import { apiFetch } from '@/lib/api'
import { BRAND } from '@/lib/brand-assets'
import { DS_GLASS, DS_STATUS, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { fadeIn, stagger, tap } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types/dotori'
import { motion } from 'motion/react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { LoadingSpinner } from './_components/LoadingSpinner'
import { PremiumGate } from './_components/PremiumGate'
import { UsageCounter } from './_components/UsageCounter'
import {
  FREE_PLAN_CHAT_LIMIT,
  getGuestUsageCount,
  getMonthKey,
  GUEST_CHAT_LIMIT,
  MONTHLY_USAGE_API_URL,
  parseUsageResponse,
  PREMIUM_GATE_HINT,
  RETRY_ACTION_ID,
  suggestedPrompts,
} from './_lib/chat-config'

const CHAT_WARM_ACCENT_CLASS =
  'pointer-events-none absolute right-3 top-3 h-11 w-11 rounded-full bg-forest-100/55 blur-xl dark:bg-forest-900/40'
const CHAT_PAGE_WRAP_CLASS =
  'relative flex min-h-0 flex-1 flex-col bg-dotori-50 dark:bg-dotori-900'
const CHAT_COMPOSER_SURFACE_CLASS =
  'rounded-3xl border-t border-dotori-100/30 px-4 py-3.5 pb-[env(safe-area-inset-bottom)]'
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
  if (actionId.startsWith('facility_')) {
    return true
  }

  return Boolean(CHAT_ACTION_ROUTES[actionId] || QUICK_ACTION_MAP[actionId])
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-0 flex-1 flex-col bg-dotori-50 dark:bg-dotori-900">
          <div className="px-5 pt-6">
            <Skeleton variant="card" count={2} />
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  )
}

function MessageBubble({
  msg,
  onBlockAction,
  onQuickReply,
}: {
  msg: ChatMessage
  onBlockAction: (actionId: string) => void
  onQuickReply: (value: string) => void
}) {
  return (
    <ChatBubble
      role={msg.role}
      timestamp={msg.timestamp}
      sources={msg.sources}
      isStreaming={msg.isStreaming}
      actions={msg.actions}
      blocks={msg.blocks}
      onBlockAction={onBlockAction}
      onQuickReply={onQuickReply}
      quickReplies={msg.quick_replies}
    >
      {msg.role === 'user' ? (
        <Text className="text-body text-white/95">{msg.content}</Text>
      ) : (
        <MarkdownText content={msg.content} />
      )}
    </ChatBubble>
  )
}

function ChatHeader({
  isTrackingUsage,
  isResetting,
  isLoading,
  isUsageLoading,
  usageCount,
  usageLimit,
  onClearHistory,
}: {
  isTrackingUsage: boolean
  isResetting: boolean
  isLoading: boolean
  isUsageLoading: boolean
  usageCount: number
  usageLimit: number
  onClearHistory: () => Promise<void>
}) {
  return (
    <header
      className={cn(
        DS_GLASS.HEADER,
        'sticky top-0 z-20 flex items-center gap-3 border-b border-dotori-100/70 px-5 py-3.5 dark:border-dotori-800/50',
        'ring-1 ring-dotori-100/70',
      )}
    >
      <div className={CHAT_WARM_ACCENT_CLASS} aria-hidden="true" />
      <div className="flex min-w-0 items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND.symbol}
          alt=""
          aria-hidden="true"
          className={cn(
            'h-10 w-10 rounded-full bg-white p-1.5 shadow-sm',
            DS_GLASS.CARD,
            'ring-1 ring-dotori-200/65 dark:ring-dotori-700/65',
          )}
        />
        <div className="min-w-0">
          <Heading level={3} className="text-h3 font-semibold text-dotori-900 dark:text-dotori-50">
            토리
          </Heading>
          <div className="mt-1 flex items-center gap-1.5">
            <Badge color="forest" className="rounded-full px-2 py-0.5 text-label">
              <span className={cn('size-1.5 rounded-full', DS_STATUS.available.dot)} />
              <span className={cn('ml-1', DS_TYPOGRAPHY.caption)}>온라인</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {isTrackingUsage ? (
          <div
            className={cn(
              DS_GLASS.CARD,
              'min-h-11 rounded-2xl border border-dotori-100/70 px-3 py-2 shadow-sm ring-1 ring-dotori-100/70 dark:border-dotori-800/50',
            )}
          >
            <UsageCounter count={usageCount} limit={usageLimit} isLoading={isUsageLoading} />
          </div>
        ) : null}
        <motion.div {...tap.chip}>
          <DsButton
            variant="ghost"
            onClick={onClearHistory}
            disabled={isResetting || isLoading}
            className={cn(
              'text-body-sm',
              'min-h-11 min-w-24 rounded-2xl border border-dotori-100/70 bg-white/80 px-3 text-dotori-700 shadow-sm transition-all hover:bg-white/90 dark:border-dotori-800/50 dark:bg-dotori-950/60 dark:text-dotori-100 dark:hover:bg-dotori-950/80',
            )}
          >
            대화 초기화
          </DsButton>
        </motion.div>
      </div>
    </header>
  )
}

function ChatBubbleArea({
  isHistoryLoading,
  messages,
  messagesEndRef,
  onBlockAction,
  onQuickReply,
}: {
  isHistoryLoading: boolean
  messages: ChatMessage[]
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onBlockAction: (actionId: string) => void
  onQuickReply: (value: string) => void
}) {
  if (!isHistoryLoading && messages.length === 0) {
    return (
      <div className="flex-1 px-5 py-4">
        <EmptyStateFallback
          title="아직 대화가 없어요"
          message="토리에게 이동 고민이나 시설 추천이 필요하면 첫 질문을 남겨보세요."
        />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-0.5">
      {isHistoryLoading ? (
        <div className="px-5 py-4">
          <Skeleton variant="chat" count={3} />
        </div>
      ) : (
        <motion.ul {...stagger.container} className="space-y-4 px-5 py-4">
          {messages.map((msg) => (
            <motion.li key={msg.id} {...stagger.item}>
              <MessageBubble msg={msg} onBlockAction={onBlockAction} onQuickReply={onQuickReply} />
            </motion.li>
          ))}
          <div ref={messagesEndRef} />
        </motion.ul>
      )}
    </div>
  )
}

function ChatPromptSection({
  isHistoryLoading,
  messages,
  selectedPromptLabel,
  onSelectPrompt,
  onSuggestPrompt,
}: {
  isHistoryLoading: boolean
  messages: ChatMessage[]
  selectedPromptLabel: string
  onSelectPrompt: (prompt: ChatPromptPanelItem) => void
  onSuggestPrompt: (prompt: ChatPromptPanelItem) => void
}) {
  if (isHistoryLoading || messages.length > 0) {
    return null
  }

  return (
    <motion.section
      {...fadeIn}
      className={cn(
        DS_GLASS.CARD,
        'rounded-3xl px-4 pt-4 pb-3 shadow-sm ring-1 ring-dotori-100/70',
      )}
    >
      <ChatPromptPanel
        onSelectPrompt={onSelectPrompt}
        onSuggestPrompt={onSuggestPrompt}
        selectedPromptLabel={selectedPromptLabel}
        toriIcon={BRAND.symbol}
      />
    </motion.section>
  )
}

function ChatComposer({
  input,
  isLoading,
  isUsageLoading,
  isUsageLimitReached,
  isTrackingUsage,
  inputRef,
  onInputChange,
  onSubmit,
  usageLimit,
}: {
  input: string
  isLoading: boolean
  isUsageLoading: boolean
  isUsageLimitReached: boolean
  isTrackingUsage: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  onInputChange: (value: string) => void
  onSubmit: (value: string) => void
  usageLimit: number
}) {
  const isSendDisabled = !input.trim() || isLoading || isUsageLoading || isUsageLimitReached

  return (
    <motion.footer
      {...fadeIn}
      className={cn(
        DS_GLASS.SHEET,
        CHAT_COMPOSER_SURFACE_CLASS,
        'dark:border-dotori-800/40',
        DS_GLASS.CARD,
        'ring-1 ring-dotori-100/70',
      )}
    >
      {isTrackingUsage && isUsageLimitReached ? (
        <PremiumGate usageLimit={usageLimit} message={PREMIUM_GATE_HINT} />
      ) : null}
      <div className="flex items-center gap-2.5">
        <Fieldset className="min-w-0 flex-1">
          <Field>
            <Label className="sr-only">메시지 입력</Label>
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="토리에게 물어보세요..."
              className={cn(
                'text-body-sm',
                DS_GLASS.CARD,
                'min-h-11 rounded-2xl border-0 bg-dotori-100/65 px-4 text-dotori-900 shadow-sm placeholder:text-dotori-400 dark:bg-dotori-800/70 dark:text-dotori-50 dark:placeholder:text-dotori-600',
              )}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !isSendDisabled) {
                  onSubmit(event.currentTarget.value)
                }
              }}
              disabled={isLoading || isUsageLoading || isUsageLimitReached}
            />
          </Field>
        </Fieldset>
        <motion.div {...tap.button}>
          <DsButton
           
            type="button"
            onClick={() => onSubmit(input)}
            disabled={isSendDisabled}
            aria-label="메시지 전송"
            className={cn(
              'inline-flex min-h-11 w-11 min-w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-dotori-200/70 transition-all hover:bg-dotori-100 dark:ring-dotori-700/70 dark:hover:bg-dotori-950',
            )}
          >
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M3.9 2.6L22 11.4L3.9 20.2V13.7L15 11.4L3.9 9.1V2.6Z" fill="currentColor" />
              </svg>
            )}
          </DsButton>
        </motion.div>
      </div>
    </motion.footer>
  )
}

function ChatContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)
  const [usageCount, setUsageCount] = useState(0)
  const [usageLimit, setUsageLimit] = useState(0)
  const [isUsageLoading, setIsUsageLoading] = useState(false)
  const [selectedPromptLabel, setSelectedPromptLabel] = useState<string>(
    suggestedPrompts[0]?.label ?? '',
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const promptHandled = useRef(false)
  const monthKey = getMonthKey()
  const isPremiumUser = status === 'authenticated' && session?.user?.plan === 'premium'
  const isTrackingUsage = status !== 'loading' && !isPremiumUser
  const isUsageLimitReached = isTrackingUsage && usageLimit > 0 && usageCount >= usageLimit

  const { isLoading, retryLastMessage, sendMessage } = useChatStream({
    isTrackingUsage,
    isUsageLoading,
    isUsageLimitReached,
    messages,
    monthKey,
    setInput,
    setMessages,
    setUsageCount,
    status,
    usageCount,
    usageLimit,
  })

  const handleBlockAction = useCallback(
    (actionId: string) => {
      if (actionId === RETRY_ACTION_ID) {
        retryLastMessage()
        return
      }

      const route = CHAT_ACTION_ROUTES[actionId]
      if (route) {
        router.push(route)
        return
      }

      if (actionId.startsWith('facility_')) {
        const fId = actionId.replace('facility_', '')
        router.push(`/facility/${fId}`)
        return
      }

      if (QUICK_ACTION_MAP[actionId]) {
        sendMessage(QUICK_ACTION_MAP[actionId])
        return
      }

      console.warn(`Unhandled chat action: ${actionId}`)
    },
    [retryLastMessage, router, sendMessage],
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (status !== 'authenticated') {
      setMessages([])
      setIsHistoryLoading(false)
      return
    }

    let isMounted = true
    setIsHistoryLoading(true)
    apiFetch<{ data: { messages: ChatMessage[] } }>('/api/chat/history')
      .then((res) => {
        if (!isMounted) return
        if (res.data.messages.length > 0) {
          setMessages(res.data.messages)
        }
      })
      .catch(() => {
        if (!isMounted) return
        // Logged-in user with empty/expired history
        setMessages([])
      })
      .finally(() => {
        if (isMounted) {
          setIsHistoryLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [status])

  useEffect(() => {
    if (promptHandled.current) return
    const prompt = searchParams.get('prompt')
    if (prompt) {
      promptHandled.current = true
      const timer = setTimeout(() => sendMessage(prompt), 300)
      return () => clearTimeout(timer)
    }
  }, [searchParams, sendMessage])

  useEffect(() => {
    if (status === 'loading') return
    let isActive = true
    setIsUsageLoading(true)

    if (status !== 'authenticated') {
      const count = getGuestUsageCount(monthKey)
      if (isActive) {
        setUsageCount(Math.min(count, GUEST_CHAT_LIMIT))
        setUsageLimit(GUEST_CHAT_LIMIT)
        setIsUsageLoading(false)
      }
      return
    }

    if (session?.user?.plan === 'premium') {
      if (isActive) {
        setUsageCount(0)
        setUsageLimit(0)
        setIsUsageLoading(false)
      }
      return
    }

    ;(async () => {
      try {
        const res = await fetch(MONTHLY_USAGE_API_URL, {
          cache: 'no-store',
        })
        if (!res.ok) {
          throw new Error('usage-load-failed')
        }
        const payload = await res.json().catch(() => null)
        if (!isActive) return
        const data = parseUsageResponse(payload, FREE_PLAN_CHAT_LIMIT)
        setUsageCount(Math.min(data.count, data.limit))
        setUsageLimit(Math.max(1, data.limit))
      } catch {
        if (!isActive) return
        setUsageCount(0)
        setUsageLimit(FREE_PLAN_CHAT_LIMIT)
      } finally {
        if (isActive) {
          setIsUsageLoading(false)
        }
      }
    })()

    return () => {
      isActive = false
    }
  }, [status, session?.user?.id, session?.user?.plan, monthKey])

  const handleSuggestPrompt = useCallback(
    (prompt: ChatPromptPanelItem) => {
      setSelectedPromptLabel(prompt.label)
      sendMessage(prompt.prompt)
    },
    [sendMessage],
  )

  const handleSelectPrompt = useCallback((prompt: ChatPromptPanelItem) => {
    setSelectedPromptLabel(prompt.label)
    setInput(prompt.prompt)
    inputRef.current?.focus()
  }, [])

  const handleClearHistory = async () => {
    setIsResetting(true)
    try {
      await apiFetch('/api/chat/history', { method: 'DELETE' })
      setMessages([])
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className={cn(CHAT_PAGE_WRAP_CLASS, 'bg-gradient-to-b from-dotori-50 via-white to-dotori-50')}>
      <ChatHeader
        isTrackingUsage={isTrackingUsage}
        isResetting={isResetting}
        isLoading={isLoading}
        isUsageLoading={isUsageLoading}
        usageCount={usageCount}
        usageLimit={usageLimit}
        onClearHistory={handleClearHistory}
      />
      <ChatBubbleArea
        isHistoryLoading={isHistoryLoading}
        messages={messages}
        messagesEndRef={messagesEndRef}
        onBlockAction={handleBlockAction}
        onQuickReply={sendMessage}
      />
      <ChatPromptSection
        isHistoryLoading={isHistoryLoading}
        messages={messages}
        selectedPromptLabel={selectedPromptLabel}
        onSelectPrompt={handleSelectPrompt}
        onSuggestPrompt={handleSuggestPrompt}
      />
      <ChatComposer
        input={input}
        isLoading={isLoading}
        isUsageLoading={isUsageLoading}
        isUsageLimitReached={isUsageLimitReached}
        isTrackingUsage={isTrackingUsage}
        inputRef={inputRef}
        onInputChange={setInput}
        onSubmit={sendMessage}
        usageLimit={usageLimit}
      />
    </div>
  )
}
