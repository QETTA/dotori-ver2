'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { Text } from '@/components/catalyst/text'
import { Subheading } from '@/components/catalyst/heading'
import { scrollFadeIn } from '@/lib/motion'
import { getSeasonalBriefing } from '@/lib/seasonal-config'
import { cn } from '@/lib/utils'

const TONE_STYLES = {
  dotori: {
    bg: 'bg-dotori-50/80 dark:bg-dotori-950/30',
    icon: 'text-dotori-500',
    eyebrow: 'text-dotori-600 dark:text-dotori-400',
  },
  forest: {
    bg: 'bg-forest-50 dark:bg-forest-950/30',
    icon: 'text-forest-600 dark:text-forest-400',
    eyebrow: 'text-forest-600 dark:text-forest-400',
  },
  amber: {
    bg: 'bg-amber-50/80 dark:bg-amber-950/20',
    icon: 'text-amber-600 dark:text-amber-400',
    eyebrow: 'text-amber-700 dark:text-amber-400',
  },
} as const

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export function SeasonalBriefing() {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!mounted) {
    return <div className="h-24 animate-pulse rounded-2xl bg-dotori-50/50 dark:bg-dotori-900/20" />
  }

  const briefing = getSeasonalBriefing()
  const style = TONE_STYLES[briefing.tone]

  return (
    <motion.div {...scrollFadeIn}>
      <Link href={briefing.action.href} className="group block">
        <div className={cn('rounded-2xl p-5', style.bg)}>
          <div className="flex items-start gap-4">
            <CalendarDaysIcon className={cn('mt-0.5 h-6 w-6 shrink-0', style.icon)} />
            <div className="min-w-0 flex-1">
              <p className={cn('font-mono text-xs/5 font-semibold uppercase tracking-wider', style.eyebrow)}>
                {briefing.eyebrow}
              </p>
              <Subheading level={3} className="mt-1.5 text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
                {briefing.title}
              </Subheading>
              <Text className="mt-1 text-xs/5 text-dotori-600 sm:text-xs/5 dark:text-dotori-400">
                {briefing.description}
              </Text>
            </div>
            <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-dotori-400 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
