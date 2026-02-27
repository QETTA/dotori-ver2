'use client'

/**
 * QuickActionChips — Branded action chips with tinted fill + ring + subtle shadow
 * Horizontal wrap, spring exit on select
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { tap } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { DS_SHADOW, DS_TEXT } from '@/lib/design-system/tokens'

export function QuickActionChips({
  chips,
  onSelect,
  className,
}: {
  chips: string[]
  onSelect: (chip: string) => void
  className?: string
}) {
  const [visible, setVisible] = useState(chips)

  const handleSelect = (chip: string) => {
    setVisible((prev) => prev.filter((c) => c !== chip))
    onSelect(chip)
  }

  return (
    <div className={cn('relative', className)}>
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent dark:from-dotori-950" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent dark:from-dotori-950" />
      <div className={cn(
        'flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 py-1',
        '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
      )}>
      <AnimatePresence>
        {visible.map((chip) => (
          <motion.div
            key={chip}
            layout
            className="shrink-0 snap-start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
            {...tap.chip}
          >
            <motion.button
              type="button"
              onClick={() => handleSelect(chip)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200',
                'bg-white ring-1 ring-dotori-300/60',
                DS_SHADOW.md,
                DS_TEXT.primary,
                'hover:bg-dotori-50 hover:ring-dotori-400/70 hover:-translate-y-0.5',
                'dark:bg-dotori-900/50 dark:ring-dotori-700/50 dark:hover:bg-dotori-800/60 dark:hover:ring-dotori-600/60',
              )}
            >
              {chip}
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
      </div>
    </div>
  )
}
