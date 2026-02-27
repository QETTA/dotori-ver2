'use client'

import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { FadeIn } from '@/components/dotori/FadeIn'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  /** 아이브로 텍스트 (SMART CHILDCARE 등) */
  eyebrow?: string
  /** 페이지 제목 */
  title: string
  /** 보조 설명 */
  subtitle?: string
  /** 헤딩 레벨 (기본 2) */
  level?: 1 | 2 | 3
  /** 제목 추가 클래스 (font-wordmark 등) */
  titleClassName?: string
  /** 컨테이너 추가 클래스 */
  className?: string
  /** 시간 기반 텍스트 hydration 경고 억제 */
  suppressHydrationWarning?: boolean
}

/**
 * PageHeader — 12+ 페이지 반복 패턴 추출
 *
 * eyebrow (font-mono uppercase tracking-widest) → title → subtitle
 * 내부 FadeIn 적용, DS_PAGE_HEADER 토큰 사용
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  level = 2,
  titleClassName,
  className,
  suppressHydrationWarning,
}: PageHeaderProps) {
  return (
    <div className={cn(DS_PAGE_HEADER.spacing, className)}>
      {eyebrow && (
        <FadeIn>
          <p
            className={DS_PAGE_HEADER.eyebrow}
            suppressHydrationWarning={suppressHydrationWarning}
          >
            {eyebrow}
          </p>
        </FadeIn>
      )}
      <FadeIn>
        <Heading
          level={level}
          className={cn(DS_PAGE_HEADER.title, titleClassName)}
        >
          {title}
        </Heading>
      </FadeIn>
      {subtitle && (
        <FadeIn>
          <Text className={DS_PAGE_HEADER.subtitle}>{subtitle}</Text>
        </FadeIn>
      )}
    </div>
  )
}
