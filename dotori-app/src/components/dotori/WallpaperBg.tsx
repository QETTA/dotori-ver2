'use client'

import { cn } from '@/lib/utils'

type WallpaperVariant = 'warm' | 'forest'

const VARIANT_GRADIENT: Record<WallpaperVariant, string> = {
  warm: 'bg-gradient-to-br from-dotori-100/60 via-dotori-50/40 to-dotori-100/30 dark:from-dotori-950/80 dark:via-dotori-950/60 dark:to-dotori-900/40',
  forest: 'bg-gradient-to-br from-dotori-50/60 via-forest-50/30 to-dotori-100/30 dark:from-dotori-950/80 dark:via-forest-950/20 dark:to-dotori-900/40',
}

export function WallpaperBg({
  variant = 'warm',
  className,
}: {
  variant?: WallpaperVariant
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 noise-overlay',
        VARIANT_GRADIENT[variant],
        className,
      )}
    />
  )
}
