'use client'

/**
 * ExploreMapToggle — 리스트↔지도 뷰 토글 (pill + layoutId)
 */
import { motion } from 'motion/react'
import { ListBulletIcon, MapIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { spring } from '@/lib/motion'

type ExploreView = 'list' | 'map'

const VIEWS: { key: ExploreView; label: string; Icon: typeof ListBulletIcon }[] = [
  { key: 'list', label: '목록', Icon: ListBulletIcon },
  { key: 'map', label: '지도', Icon: MapIcon },
]

export function ExploreMapToggle({
  view,
  onToggle,
  className,
}: {
  view: ExploreView
  onToggle: (view: ExploreView) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex rounded-xl bg-dotori-100/60 p-1 dark:bg-dotori-800/40',
        className,
      )}
      role="tablist"
      aria-label="보기 전환"
    >
      {VIEWS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={view === key}
          className={cn(
            'relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            view === key
              ? 'text-dotori-950 dark:text-white'
              : 'text-dotori-500 hover:text-dotori-700 dark:text-dotori-400 dark:hover:text-dotori-200',
          )}
          onClick={() => onToggle(key)}
        >
          {view === key && (
            <motion.span
              layoutId="explore-view-pill"
              className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-dotori-700/60"
              transition={spring.chip}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
