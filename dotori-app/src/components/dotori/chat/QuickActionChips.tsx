'use client'

/**
 * QuickActionChips — Fast action chips (extracted from chat/page.tsx)
 * Horizontal scroll, spring exit on select
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { tap } from '@/lib/motion'
import { DsButton } from '@/components/ds/DsButton'

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
      className={`flex flex-wrap gap-2 ${className ?? ''}`}
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
            <DsButton
              variant="ghost"
              onClick={() => handleSelect(chip)}
              className="rounded-full bg-dotori-950/[0.025] px-3.5 py-1.5 text-sm font-medium text-dotori-700 hover:bg-dotori-950/[0.05] dark:bg-white/5 dark:text-dotori-300 dark:hover:bg-white/10"
            >
              {chip}
            </DsButton>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
