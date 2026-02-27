/**
 * NoiseTexture — SVG feTurbulence noise overlay for premium cards
 * TP5 Pattern 5: Border Accent + Noise
 *
 * Usage: Place inside a relative container.
 * <div className="relative overflow-hidden ...">
 *   <NoiseTexture />
 *   {children}
 * </div>
 */
import { cn } from '@/lib/utils'
import { DS_TEXT } from '@/lib/design-system/tokens'

export function NoiseTexture({
  opacity = 0.03,
  className,
}: {
  opacity?: number
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', DS_TEXT.primary, className)}
      style={{ opacity }}
    >
      <filter id="dotori-noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.80"
          numOctaves="4"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#dotori-noise)" />
    </svg>
  )
}
