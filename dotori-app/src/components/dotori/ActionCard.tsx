'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { hoverLift, fadeUp, gradientText } from '@/lib/motion'
import type { FunnelStep } from '@/types/dotori'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER, DS_SURFACE } from '@/lib/design-system/page-tokens'

interface ActionCardProps {
  step: FunnelStep
  className?: string
}

const STEPS: Record<FunnelStep, {
  title: string
  description: string
  cta: string
  href: string
  gradient: string
}> = {
  0: {
    title: '시설 탐색 시작하기',
    description: '내 주변 어린이집·유치원을 찾아보세요',
    cta: '시설 탐색',
    href: '/explore',
    gradient: 'from-dotori-400 via-dotori-300 to-amber-300',
  },
  1: {
    title: '관심 시설에 대기 신청',
    description: '빈자리가 나면 가장 먼저 알려드려요',
    cta: '대기 신청하기',
    href: '/my/interests',
    gradient: 'from-dotori-400 via-amber-400 to-amber-300',
  },
  2: {
    title: '대기 중이에요',
    description: '입소 서류를 미리 준비해 두세요',
    cta: '서류 준비하기',
    href: '/my/documents',
    gradient: 'from-forest-400 via-forest-500 to-forest-300',
  },
  3: {
    title: '서류 서명 완료하기',
    description: '남은 서류를 한번에 서명하세요',
    cta: '일괄 서명',
    href: '/my/documents/sign',
    gradient: 'from-forest-500 via-forest-400 to-dotori-400',
  },
}

export function ActionCard({ step, className = '' }: ActionCardProps) {
  const config = STEPS[step]

  return (
    <motion.div {...fadeUp} className={`group/card relative ${className}`}>
      {/* z-0: hover background (Spotlight) */}
      <div className={cn('absolute -inset-px rounded-2xl opacity-0 transition duration-200 group-hover/card:opacity-100', DS_SURFACE.sunken)} />
      {/* z-10: content */}
      <motion.div
        {...hoverLift}
        className={cn('relative z-10 overflow-hidden', DS_CARD.raised.base, DS_CARD.raised.dark)}
      >
        {/* TP5 Border Accent — gradient top bar */}
        <div className={cn('h-1 bg-gradient-to-r', config.gradient)} />
        <div className="p-5">
          <p className={DS_PAGE_HEADER.eyebrow}>
            다음 단계
          </p>
          <p className={cn('mt-3 text-base/7 font-bold tracking-tight', gradientText)}>
            {config.title}
          </p>
          <p className="mt-1 text-sm/6 text-dotori-600 dark:text-dotori-400">
            {config.description}
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-dotori-50 px-3 py-1.5 text-xs/5 font-semibold text-dotori-600 transition group-hover/card:bg-dotori-100 dark:bg-dotori-950/30 dark:text-dotori-400">
            {config.cta}
            <ArrowRightIcon className="h-3 w-3 transition-transform group-hover/card:translate-x-0.5" />
          </div>
        </div>
      </motion.div>
      {/* z-20: click zone */}
      <Link href={config.href} className="absolute inset-0 z-20" aria-label={config.title} />
    </motion.div>
  )
}
