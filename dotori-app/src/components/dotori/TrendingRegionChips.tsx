'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { stagger, tap } from '@/lib/motion'
import { FireIcon } from '@heroicons/react/24/solid'

interface TrendingRegionChipsProps {
  className?: string
}

const TRENDING_REGIONS = [
  { label: '서초구', sido: '서울특별시', sigungu: '서초구' },
  { label: '강남구', sido: '서울특별시', sigungu: '강남구' },
  { label: '성남시', sido: '경기도', sigungu: '성남시' },
  { label: '용인시', sido: '경기도', sigungu: '용인시' },
  { label: '송파구', sido: '서울특별시', sigungu: '송파구' },
]

export function TrendingRegionChips({ className = '' }: TrendingRegionChipsProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 text-caption font-semibold text-dotori-500">
        <FireIcon className="h-3.5 w-3.5" />
        <span>인기 지역</span>
      </div>
      <motion.div
        {...stagger.fast.container}
        className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide"
      >
        {TRENDING_REGIONS.map((region) => (
          <motion.div key={region.label} variants={stagger.fast.item.variants}>
            <Link
              href={`/explore?sido=${encodeURIComponent(region.sido)}&sigungu=${encodeURIComponent(region.sigungu)}`}
            >
              <motion.span
                {...tap.chip}
                className="inline-block whitespace-nowrap rounded-full border border-dotori-200 bg-white px-3 py-1.5 text-body-sm font-medium text-dotori-700 transition-colors hover:bg-dotori-50 dark:border-dotori-700 dark:bg-dotori-900 dark:text-dotori-200 dark:hover:bg-dotori-800"
              >
                {region.label}
              </motion.span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
