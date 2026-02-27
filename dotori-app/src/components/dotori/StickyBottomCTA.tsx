'use client'

import { motion } from 'motion/react'
import { Phone, CalendarDays } from 'lucide-react'
import { Button } from '@/components/catalyst/button'
import { DS_STICKY_BAR, DS_ICON } from '@/lib/design-system/tokens'
import { stickyReveal } from '@/lib/motion'

interface StickyBottomCTAProps {
  facilityName: string
  phone?: string
  onVisitRequest?: () => void
  className?: string
}

export function StickyBottomCTA({
  facilityName,
  phone,
  onVisitRequest,
  className = '',
}: StickyBottomCTAProps) {
  return (
    <motion.div
      {...stickyReveal}
      className={`${DS_STICKY_BAR.base} ${DS_STICKY_BAR.light} ${DS_STICKY_BAR.dark} glass-float hairline-border-t safe-area-bottom ${className}`}
    >
      <div className="mx-auto flex max-w-md items-center gap-3">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dotori-200 bg-white text-dotori-700 transition-colors active:bg-dotori-50 dark:border-dotori-700 dark:bg-dotori-900 dark:text-dotori-200"
            aria-label={`${facilityName} 전화`}
          >
            <Phone className={DS_ICON.md} />
          </a>
        )}
        <Button
          color="dotori"
          className="flex-1"
          onClick={onVisitRequest}
        >
          <CalendarDays className={DS_ICON.md} />
          견학 신청하기
        </Button>
      </div>
    </motion.div>
  )
}
