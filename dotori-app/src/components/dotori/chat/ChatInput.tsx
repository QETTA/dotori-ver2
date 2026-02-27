'use client'

/**
 * ChatInput — Message input bar (extracted from chat/page.tsx)
 * Shift+Enter 줄바꿈, Enter 전송
 */
import { useState, useCallback, type KeyboardEvent } from 'react'
import { motion } from 'motion/react'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { copy } from '@/lib/brand-copy'
import { tap } from '@/lib/motion'
import { Input, InputGroup } from '@/components/catalyst/input'
import { DsButton } from '@/components/ds/DsButton'

export function ChatInput({
  onSend,
  disabled = false,
  placeholder,
}: {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [input, setInput] = useState('')
  const hasContent = input.trim().length > 0

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setInput('')
  }, [input, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  return (
    <div className="flex items-center gap-2 rounded-xl bg-white p-2 shadow-lg ring-1 ring-black/5 dark:bg-dotori-900 dark:ring-white/10">
      <div className="flex-1">
        <InputGroup>
          <Input
            type="text"
            placeholder={placeholder ?? copy.chat.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="border-0 shadow-none before:hidden focus-within:after:ring-0 sm:focus-within:after:ring-0"
            aria-label="메시지 입력"
          />
        </InputGroup>
      </div>
      <motion.div {...tap.button}>
        <DsButton
          onClick={handleSend}
          disabled={disabled || !hasContent}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg p-0"
          aria-label="전송"
        >
          <PaperAirplaneIcon className="h-4 w-4" />
        </DsButton>
      </motion.div>
    </div>
  )
}
