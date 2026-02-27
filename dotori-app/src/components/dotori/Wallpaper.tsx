'use client'

/**
 * Wallpaper — shared elements wallpaper.tsx 직접 포팅
 * 원본: tailwind plus/components/elements/wallpaper.tsx
 * 변경: olive 팔레트 → dotori/forest, 4색 유지
 */
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

const html = String.raw

const noisePattern = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  html`
    <svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 100 100">
      <filter id="n">
        <feTurbulence
          type="turbulence"
          baseFrequency="1.4"
          numOctaves="1"
          seed="2"
          stitchTiles="stitch"
          result="n"
        />
        <feComponentTransfer result="g">
          <feFuncR type="linear" slope="4" intercept="1" />
          <feFuncG type="linear" slope="4" intercept="1" />
          <feFuncB type="linear" slope="4" intercept="1" />
        </feComponentTransfer>
        <feColorMatrix type="saturate" values="0" in="g" />
      </filter>
      <rect width="100%" height="100%" filter="url(#n)" />
    </svg>
  `.replace(/\s+/g, ' '),
)}")`

export function Wallpaper({
  children,
  color,
  className,
  ...props
}: { color: 'forest' | 'dotori' | 'cream' | 'dark' } & ComponentProps<'div'>) {
  return (
    <div
      data-color={color}
      className={cn(
        'relative overflow-hidden bg-gradient-to-b',
        'data-[color=forest]:from-[#596352] data-[color=forest]:to-[#4a5a3a]',
        'data-[color=dotori]:from-[#8d7359] data-[color=dotori]:to-[#765959]',
        'data-[color=cream]:from-[#f5ede0] data-[color=cream]:to-[#e8d5be]',
        'data-[color=dark]:from-[#2d2418] data-[color=dark]:to-[#1a1510]',
        'dark:data-[color=forest]:from-[#26361b] dark:data-[color=forest]:to-[#1a2a15]',
        'dark:data-[color=dotori]:from-[#382d23] dark:data-[color=dotori]:to-[#3d2323]',
        'dark:data-[color=cream]:from-[#2d2418] dark:data-[color=cream]:to-[#1a1510]',
        'dark:data-[color=dark]:from-[#1a1510] dark:data-[color=dark]:to-[#0d0a08]',
        className,
      )}
      {...props}
    >
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay dark:opacity-25"
        style={{
          backgroundPosition: 'center',
          backgroundImage: noisePattern,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}
