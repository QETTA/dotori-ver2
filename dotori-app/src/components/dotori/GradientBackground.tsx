'use client'

/**
 * GradientBackground — Radiant gradient.tsx 직접 포팅
 * 원본: tailwind-plus-radiant/radiant-ts/src/components/gradient.tsx
 * 변경: 컬러를 도토리 팔레트로 변환 (warm brown → forest green)
 */
import { cn } from '@/lib/utils'
import { DS_TEXT } from '@/lib/design-system/tokens'

export function Gradient({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={cn(
        className,
        'bg-[linear-gradient(115deg,var(--color-dotori-200)_28%,var(--color-forest-300)_70%,var(--color-dotori-400))]',
        'sm:bg-[linear-gradient(145deg,var(--color-dotori-200)_28%,var(--color-forest-300)_70%,var(--color-dotori-400))]',
      )}
    />
  )
}

export function GradientBackground() {
  return (
    <div className={cn('relative mx-auto max-w-7xl', DS_TEXT.primary)}>
      <div
        className={cn(
          'absolute -top-44 -right-60 h-60 w-[36rem] transform-gpu md:right-0',
          'bg-[linear-gradient(115deg,var(--color-dotori-200)_28%,var(--color-forest-200)_70%,var(--color-dotori-300))]',
          'rotate-[-10deg] rounded-full blur-3xl',
        )}
      />
    </div>
  )
}
