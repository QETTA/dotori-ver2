'use client'

/**
 * SignaturePreview — Displays a captured signature image.
 */
import { DS_SHADOW } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'

export function SignaturePreview({
  dataUrl,
  className,
}: {
  dataUrl: string
  className?: string
}) {
  if (!dataUrl) return null

  return (
    <div className={cn('overflow-hidden rounded-xl ring-1 ring-dotori-200/50 dark:ring-dotori-700/50', DS_SHADOW.md, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt="서명 미리보기"
        className="w-full bg-white dark:bg-dotori-950"
      />
    </div>
  )
}
