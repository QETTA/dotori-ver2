'use client'

/**
 * BreadcrumbNav — Compass Breadcrumbs 모바일 최적화
 * sticky 뒤로가기 헤더, FadeIn, 터치 44px min
 */
import type React from 'react'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { Link } from '@/components/catalyst/link'
import { FadeIn } from '@/components/dotori/FadeIn'
import { cn } from '@/lib/utils'

export function BreadcrumbNav({
  parent,
  current,
  action,
  className,
}: {
  parent: { label: string; href: string }
  current: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <FadeIn>
      <nav
        aria-label="뒤로가기"
        className={cn(
          'sticky top-0 z-40 -mx-6 -mt-6 mb-6 flex min-h-11 items-center gap-2 bg-white/80 px-4 py-2 backdrop-blur-sm dark:bg-dotori-950/80',
          className,
        )}
      >
        <Link
          href={parent.href}
          className="inline-flex min-h-11 min-w-11 items-center gap-1 rounded-lg text-sm/6 font-medium text-dotori-600 transition-colors hover:text-dotori-900 dark:text-dotori-400 dark:hover:text-dotori-200"
        >
          <ChevronLeftIcon className="h-4 w-4 shrink-0" />
          <span className="sr-only sm:not-sr-only">{parent.label}</span>
        </Link>

        <span className="truncate text-sm/6 font-semibold text-dotori-950 dark:text-white">
          {current}
        </span>

        {action && <div className="ml-auto shrink-0">{action}</div>}
      </nav>
    </FadeIn>
  )
}
