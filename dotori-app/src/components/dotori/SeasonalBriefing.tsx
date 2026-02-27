'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { Text } from '@/components/catalyst/text'
import { Subheading } from '@/components/catalyst/heading'
import { scrollFadeIn, hoverLift } from '@/lib/motion'
import { getSeasonalBriefing } from '@/lib/seasonal-config'
import { cn } from '@/lib/utils'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER, DS_SURFACE } from '@/lib/design-system/page-tokens'

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function SeasonalBriefing() {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!mounted) {
    return <div className={cn('h-24 animate-pulse rounded-2xl', DS_SURFACE.sunken)} />
  }

  const briefing = getSeasonalBriefing()

  return (
    <motion.div {...scrollFadeIn} className="group/card relative">
      {/* z-0: hover background */}
      <div className={cn(
        'absolute -inset-px rounded-2xl opacity-0 transition duration-200 group-hover/card:opacity-100',
        DS_SURFACE.sunken,
      )} />
      {/* z-10: content */}
      <motion.div
        {...hoverLift}
        className={cn(
          'relative z-10 overflow-hidden transition',
          DS_CARD.raised.base, DS_CARD.raised.dark,
          'bg-amber-50/60 dark:bg-amber-950/10 ring-amber-200/40 dark:ring-amber-800/20',
        )}
      >
        {/* Warm accent bar */}
        <div className="h-1 bg-gradient-to-r from-amber-400 via-dotori-400 to-dotori-300" />
        <div className="p-5">
          <p className={cn(DS_PAGE_HEADER.eyebrow, 'text-amber-600 dark:text-amber-400')}>
            {briefing.eyebrow}
          </p>
          <Subheading level={3} className="mt-2 text-sm/6 font-semibold text-dotori-900 dark:text-dotori-50 sm:text-sm/6">
            {briefing.title}
          </Subheading>
          <Text className="mt-1 text-sm/6 text-dotori-600 dark:text-dotori-400">
            {briefing.description}
          </Text>
          <div className="mt-3 flex items-center text-xs/5 font-medium text-dotori-500">
            자세히 보기
            <ArrowRightIcon className="ml-1 h-3 w-3 transition-transform group-hover/card:translate-x-0.5" />
          </div>
        </div>
      </motion.div>
      {/* z-20: click zone */}
      <Link href={briefing.action.href} className="absolute inset-0 z-20 rounded-2xl" aria-label={briefing.title}>
        <span className="sr-only">{briefing.title}</span>
      </Link>
    </motion.div>
  )
}
