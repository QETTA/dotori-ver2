'use client'

import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { DsButton } from '@/components/ds/DsButton'
import { motion } from 'motion/react'
import { BrandEmptyIllustration } from '@/components/dotori/BrandEmptyIllustration'
import { FadeIn } from '@/components/dotori/FadeIn'
import { cn } from '@/lib/utils'
import { gradientText } from '@/lib/motion'

interface SuccessPanelProps {
  title?: string
  description?: string
  className?: string
}

export function SuccessPanel({
  title = '서명이 완료되었습니다',
  description = '서류가 정상적으로 제출되었습니다. 서류함에서 확인하세요.',
  className,
}: SuccessPanelProps) {
  return (
    <FadeIn>
      <div className={cn('flex flex-col items-center py-10 text-center', className)}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <BrandEmptyIllustration variant="empty" size={120} />
        </motion.div>
        <Heading className={`mt-6 font-wordmark text-2xl/9 font-bold tracking-tight sm:text-2xl/9 ${gradientText}`}>
          {title}
        </Heading>
        <Text className="mt-2 text-base/7 text-dotori-600 dark:text-dotori-400">
          {description}
        </Text>
        <div className="mt-8 flex gap-3">
          <DsButton variant="secondary" href="/my/documents">
            서류함으로 이동
          </DsButton>
          <DsButton href="/">
            홈으로
          </DsButton>
        </div>
      </div>
    </FadeIn>
  )
}
