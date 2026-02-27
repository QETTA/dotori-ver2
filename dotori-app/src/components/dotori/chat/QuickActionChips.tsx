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
import { DS_SURFACE } from '@/lib/design-system/page-tokens'

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
    <div
      className={cn(DS_SURFACE.primary, 'flex flex-wrap gap-2', className)}
    >
      <AnimatePresence>
        {visible.map((chip) => (
          <motion.div
            key={chip}
            layout
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
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
                'bg-dotori-50 ring-1 ring-dotori-200/50',
                DS_SHADOW.sm,
                DS_TEXT.secondary,
                'hover:bg-dotori-100 hover:ring-dotori-300/60',
                'dark:bg-dotori-900/30 dark:ring-dotori-800/40 dark:hover:bg-dotori-800/50 dark:hover:ring-dotori-700/50',
              )}
            >
              {chip}
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
