'use client'

/**
 * StatList — Studio StatList.tsx 직접 포팅
 * 원본: tailwind-plus-studio/studio-ts/src/components/StatList.tsx
 * 변경: framer-motion → motion/react, Border 인라인, neutral → dotori
 */
import { FadeIn, FadeInStagger } from './FadeIn'
import { DS_TEXT } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'

export function StatList({
  children,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof FadeInStagger>, 'children'> & {
  children: React.ReactNode
}) {
  return (
    <FadeInStagger {...props}>
      <dl className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none">
        {children}
      </dl>
    </FadeInStagger>
  )
}

export function StatListItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <FadeIn className="flex flex-col-reverse border-l border-dotori-300 pl-8 dark:border-dotori-600">
      <dt className={cn('mt-2 text-base', DS_TEXT.muted)}>{label}</dt>
      <dd className="font-wordmark text-3xl font-semibold text-dotori-950 sm:text-4xl dark:text-white">
        {value}
      </dd>
    </FadeIn>
  )
}
