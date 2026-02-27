'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * GridPattern — Protocol 템플릿 포팅
 * SVG 패턴 기반 배경 그리드 + 하이라이트 셀
 */
export function GridPattern({
  width = 48,
  height = 48,
  x = 0,
  y = 0,
  squares = [],
  strokeClass = 'stroke-dotori-200/40 dark:stroke-dotori-700/25',
  fillClass = 'fill-dotori-300/15 dark:fill-dotori-600/10',
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<'svg'>, 'width' | 'height'> & {
  width?: number
  height?: number
  x?: number | string
  y?: number | string
  squares?: Array<[x: number, y: number]>
  strokeClass?: string
  fillClass?: string
}) {
  const patternId = useId()

  return (
    <svg
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      {...props}
    >
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            className={strokeClass}
          />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares.length > 0 && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([sx, sy]) => (
            <rect
              key={`${sx}-${sy}`}
              strokeWidth="0"
              width={width - 1}
              height={height - 1}
              x={sx * width + 1}
              y={sy * height + 1}
              className={fillClass}
            />
          ))}
        </svg>
      )}
    </svg>
  )
}
