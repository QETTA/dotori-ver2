'use client'

/**
 * ActionBlockRenderer — AI response structured block wrapper
 * Wraps existing blocks/ sub-components with FadeIn
 */
import { memo } from 'react'
import { FadeIn } from '@/components/dotori/FadeIn'
import { BlockRenderer } from '@/components/dotori/blocks/BlockRenderer'
import type { ChatBlock } from '@/types/dotori'

export const ActionBlockRenderer = memo(function ActionBlockRenderer({
  blocks,
  onAction,
}: {
  blocks: ChatBlock[]
  onAction?: (actionId: string) => void
}) {
  if (blocks.length === 0) return null

  return (
    <FadeIn>
      <BlockRenderer blocks={blocks} onAction={onAction} />
    </FadeIn>
  )
})
