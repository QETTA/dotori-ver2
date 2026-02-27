'use client'

import { BRAND } from '@/lib/brand-assets'
import { DS_SHADOW } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'

type IllustrationVariant = 'empty' | 'error'

interface BrandEmptyIllustrationProps {
  /** 'empty' = 자는 도토리 (빈 목록), 'error' = 당황한 도토리 (에러) */
  variant?: IllustrationVariant
  className?: string
  /** 일러스트레이션 크기 (px), 기본 120 */
  size?: number
}

const VARIANT_SRC: Record<IllustrationVariant, string> = {
  empty: BRAND.emptyState,
  error: BRAND.errorState,
}

/**
 * 브랜드 빈 상태 / 에러 상태 일러스트레이션
 * 모든 empty state, error state 화면에서 일관된 브랜드 이미지 제공
 */
export function BrandEmptyIllustration({
  variant = 'empty',
  className,
  size = 120,
}: BrandEmptyIllustrationProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={VARIANT_SRC[variant]}
      alt=""
      width={size}
      height={size}
      className={cn('mx-auto', DS_SHADOW.sm, className)}
      aria-hidden="true"
    />
  )
}
