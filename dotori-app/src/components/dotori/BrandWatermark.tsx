'use client'

import { BRAND } from '@/lib/brand-assets'
import { cn } from '@/lib/utils'

interface BrandWatermarkProps {
  className?: string
}

/**
 * 브랜드 워터마크 — 페이지 배경에 도토리 심볼을 은은하게 표시
 * opacity 0.04 기본, aria-hidden, pointer-events-none
 */
export function BrandWatermark({ className }: BrandWatermarkProps) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND.watermark}
        alt=""
        className="h-full w-full object-contain opacity-[0.04]"
      />
    </div>
  )
}
