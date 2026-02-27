'use client'

import { BRAND } from '@/lib/brand-assets'
import { copy } from '@/lib/brand-copy'
import {
  DS_LAYOUT,
  DS_STATUS,
  DS_TYPOGRAPHY,
} from '@/lib/design-system/tokens'
import { tap } from '@/lib/motion'
import { cn } from '@/lib/utils'
import {
  ChatBubbleLeftIcon as ChatOutline,
  UserGroupIcon as GroupOutline,
  HomeIcon as HomeOutline,
  MagnifyingGlassIcon as SearchOutline,
  UserCircleIcon as UserOutline,
} from '@heroicons/react/24/outline'
import {
  ChatBubbleLeftIcon as ChatSolid,
  UserGroupIcon as GroupSolid,
  HomeIcon as HomeSolid,
  MagnifyingGlassIcon as SearchSolid,
  UserCircleIcon as UserSolid,
} from '@heroicons/react/24/solid'
import { motion } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { memo } from 'react'

const tabs = [
  {
    id: 'home',
    label: copy.navigation.tabs.home,
    href: '/',
    icon: HomeOutline,
    activeIcon: HomeSolid,
  },
  {
    id: 'explore',
    label: copy.navigation.tabs.explore,
    href: '/explore',
    icon: SearchOutline,
    activeIcon: SearchSolid,
  },
  {
    id: 'chat',
    label: copy.navigation.tabs.chat,
    href: '/chat',
    icon: ChatOutline,
    activeIcon: ChatSolid,
  },
  {
    id: 'community',
    label: copy.navigation.tabs.community,
    href: '/community',
    icon: GroupOutline,
    activeIcon: GroupSolid,
  },
  {
    id: 'my',
    label: copy.navigation.tabs.my,
    href: '/my',
    icon: UserOutline,
    activeIcon: UserSolid,
  },
] as const

/* ── Precomputed class strings ── */

const navShellClass = cn(
  /* Fixed position floating bar */
  'fixed inset-x-3 bottom-2 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-md rounded-[1.35rem]',
  'border border-dotori-200/80',
  'bg-gradient-to-b from-white/95 via-dotori-50/86 to-dotori-100/78',
  'px-1 shadow-2xl shadow-dotori-900/20',
  'ring-1 ring-white/80',
  'backdrop-blur-xl backdrop-saturate-150',
  /* Dark */
  'dark:border-dotori-700/75 dark:from-dotori-900/96 dark:via-dotori-900/93 dark:to-dotori-950/95',
  'dark:shadow-black/35 dark:ring-dotori-700/55',
)

const navActivePillClass = cn(
  'bg-gradient-to-b from-white to-dotori-100/90',
  'ring-1 ring-dotori-300/70 shadow-sm shadow-dotori-500/20',
  'dark:from-dotori-800 dark:to-dotori-900 dark:ring-dotori-600/70 dark:shadow-black/25',
)

const navPillClass = cn(
  'pointer-events-none absolute inset-0.5 rounded-[0.8rem]',
  'ring-1 ring-white/80 shadow-inner shadow-white/35',
  'dark:ring-dotori-700/50 dark:shadow-dotori-900/45',
)

interface BottomTabBarProps {
  /** Badge counts per tab id */
  badges?: Partial<Record<string, number>>
}

export const BottomTabBar = memo(function BottomTabBar({ badges }: BottomTabBarProps) {
  const pathname = usePathname() || '/'

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <nav
      className={cn(navShellClass, DS_LAYOUT.SAFE_AREA_TABBAR)}
      role="navigation"
      aria-label="메인 내비게이션"
    >
      {/* Ambient glow blur blob */}
      <span
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-r from-dotori-200/24 via-white/22 to-forest-200/24 blur-xl dark:from-dotori-700/35 dark:via-dotori-900/10 dark:to-forest-700/30"
        aria-hidden="true"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND.symbol}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 opacity-[0.12]"
      />
      <div className="relative flex items-center justify-around px-1.5 py-1.5">
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          const Icon = active ? tab.activeIcon : tab.icon
          const isChat = tab.id === 'chat'

          return (
            <motion.div
              key={tab.id}
              className="flex-1 px-0.5"
              whileTap={tap.button.whileTap}
              transition={tap.button.transition}
            >
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                aria-label={tab.label}
                className={cn(
                  'relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[0.85rem] py-1',
                  'transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-dotori-50',
                  'dark:focus-visible:ring-dotori-500/80 dark:focus-visible:ring-offset-dotori-950',
                )}
              >
                {/* Background pill */}
                <span
                  className={cn(
                    navPillClass,
                    isChat && 'bg-dotori-100/55 dark:bg-dotori-900/45',
                    active ? navActivePillClass : 'opacity-0',
                  )}
                />
                {/* Icon wrapper */}
                <div
                  className={cn(
                    'relative z-10 grid h-7 w-7 place-items-center rounded-[0.72rem] transition-colors duration-200',
                    isChat && 'bg-dotori-100/55 dark:bg-dotori-900/45',
                    active && cn(
                      'bg-gradient-to-br from-white via-dotori-50 to-forest-100/90',
                      'ring-1 ring-dotori-300/75 shadow-sm shadow-dotori-500/20',
                      'dark:from-dotori-700 dark:via-dotori-800 dark:to-forest-900/45 dark:ring-dotori-600/75 dark:shadow-black/30',
                    ),
                  )}
                >
                <Icon
                    className={cn(
                      'h-4 w-4 transition-colors duration-200',
                      active
                        ? 'text-dotori-900 dark:text-dotori-50'
                        : 'text-dotori-600 dark:text-dotori-400',
                    )}
                  />
                </div>
                {/* Chat live dot */}
                {isChat ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'pointer-events-none absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full',
                      DS_STATUS.available.dot,
                    )}
                  />
                ) : null}
                {/* Notification badge dot */}
                {!isChat && (badges?.[tab.id] ?? 0) > 0 ? (
                  <span
                    aria-hidden="true"
                    className={cn('pointer-events-none absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-bold text-white ring-2 ring-white dark:ring-dotori-950', DS_TYPOGRAPHY.label)}
                  >
                    {(badges![tab.id]!) > 99 ? '99+' : badges![tab.id]}
                  </span>
                ) : null}
                {/* Label */}
                <span
                  className={cn(
                    DS_TYPOGRAPHY.label,
                    'relative z-10 tracking-tight transition-colors duration-200',
                    active
                      ? 'font-semibold text-dotori-900 dark:text-dotori-50'
                      : 'font-medium text-dotori-600 dark:text-dotori-400',
                  )}
                >
                  {tab.label}
                </span>
                {/* Bottom indicator */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full transition-all duration-300',
                    active
                      ? 'w-7 bg-dotori-500/90 opacity-100 shadow-sm shadow-dotori-500/45 dark:bg-dotori-300/95 dark:shadow-dotori-300/40'
                      : 'w-3 bg-dotori-300/35 opacity-35 dark:bg-dotori-700/35',
                  )}
                />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </nav>
  )
})
