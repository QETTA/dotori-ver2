'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { gradientText, spring, fadeUp } from '@/lib/motion'
import type { FunnelStep } from '@/types/dotori'
import {
  MagnifyingGlassIcon,
  HeartIcon,
  ClockIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline'

interface ActionCardProps {
  step: FunnelStep
  className?: string
}

const STEPS: Record<FunnelStep, {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  cta: string
  href: string
}> = {
  0: {
    icon: MagnifyingGlassIcon,
    title: '시설 탐색 시작하기',
    description: '내 주변 어린이집·유치원을 찾아보세요',
    cta: '시설 탐색',
    href: '/explore',
  },
  1: {
    icon: HeartIcon,
    title: '관심 시설에 대기 신청',
    description: '빈자리가 나면 가장 먼저 알려드려요',
    cta: '대기 신청하기',
    href: '/my/interests',
  },
  2: {
    icon: ClockIcon,
    title: '대기 중이에요',
    description: '입소 서류를 미리 준비해 두세요',
    cta: '서류 준비하기',
    href: '/my/documents',
  },
  3: {
    icon: DocumentCheckIcon,
    title: '서류 서명 완료하기',
    description: '남은 서류를 한번에 서명하세요',
    cta: '일괄 서명',
    href: '/my/documents/sign',
  },
}

export function ActionCard({ step, className = '' }: ActionCardProps) {
  const config = STEPS[step]
  const Icon = config.icon

  return (
    <motion.div {...fadeUp} className={`group/card relative ${className}`}>
      {/* Border Accent — gradient top bar */}
      <div className={`${DS_CARD.raised.base} ${DS_CARD.raised.dark} relative overflow-hidden p-5 transition-all duration-200 group-hover/card:-translate-y-0.5 group-hover/card:shadow-[0_8px_32px_rgba(176,122,74,0.12)]`}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-dotori-400 via-amber-400 to-dotori-500" />
        {/* Layer 1: Content — z-10 */}
        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dotori-100 dark:bg-dotori-800">
              <Icon className="h-6 w-6 text-dotori-600 dark:text-dotori-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-body font-bold ${gradientText}`}>{config.title}</p>
              <p className="mt-0.5 text-body-sm text-dotori-600 dark:text-dotori-400">
                {config.description}
              </p>
            </div>
          </div>
          <motion.div
            className="mt-3 flex items-center justify-end"
            whileTap={{ scale: 0.97 }}
            transition={spring.chip}
          >
            <span className="rounded-full bg-dotori-500 px-4 py-1.5 text-body-sm font-semibold text-white">
              {config.cta}
            </span>
          </motion.div>
        </div>
      </div>
      {/* Layer 2: Click zone — z-20 */}
      <Link href={config.href} className="absolute inset-0 z-20" aria-label={config.title} />
    </motion.div>
  )
}
