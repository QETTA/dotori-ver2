'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { pulse, fadeUp } from '@/lib/motion'
import { DocumentCheckIcon } from '@heroicons/react/24/solid'

interface BundleSignCTAProps {
  pendingCount: number
  className?: string
}

export function BundleSignCTA({ pendingCount, className = '' }: BundleSignCTAProps) {
  if (pendingCount <= 0) return null

  return (
    <motion.div {...fadeUp} className={className}>
      <Link href="/my/documents/sign" className="block">
        <div
          className={`${DS_CARD.flat.base} ${DS_CARD.flat.dark} ${DS_CARD.flat.hover} flex items-center gap-4 p-4`}
        >
          <motion.div {...pulse}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dotori-100 dark:bg-dotori-800">
              <DocumentCheckIcon className="h-5 w-5 text-dotori-600 dark:text-dotori-300" />
            </div>
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-body font-semibold text-dotori-900 dark:text-dotori-50">
              {pendingCount}건 일괄 서명
            </p>
            <p className="text-caption text-dotori-600 dark:text-dotori-400">
              남은 서류를 한번에 서명하세요
            </p>
          </div>
          <span className="shrink-0 text-body-sm font-medium text-dotori-500">
            서명하기 &rarr;
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
