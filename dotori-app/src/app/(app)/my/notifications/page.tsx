'use client'

/**
 * Notifications Page — Premium polish (Wave 10)
 *
 * Catalyst: Dropdown, DropdownButton, DropdownMenu, DropdownItem,
 *           Pagination, PaginationPrevious, PaginationNext
 * Studio:   FadeIn/FadeInStagger
 * Motion:   scrollFadeIn, hoverLift
 */
import { useState, useMemo } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  MoreHorizontal,
  Check,
  Trash2,
} from 'lucide-react'
import { Badge, BadgeButton } from '@/components/catalyst/badge'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
  DropdownLabel,
} from '@/components/catalyst/dropdown'
import {
  Pagination,
  PaginationPrevious,
  PaginationNext,
} from '@/components/catalyst/pagination'
import { DsButton } from '@/components/ds/DsButton'
import { BreadcrumbNav } from '@/components/dotori/BreadcrumbNav'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { Skeleton } from '@/components/dotori/Skeleton'
import { ErrorState } from '@/components/dotori/ErrorState'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { DS_PAGE_HEADER, DS_EMPTY_STATE } from '@/lib/design-system/page-tokens'
import { scrollFadeIn } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { BrandEmptyIllustration } from '@/components/dotori/BrandEmptyIllustration'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { useNotifications } from '@/hooks/use-notifications'
import { ToBadge } from '@/components/dotori/ToBadge'

const categories = ['전체', '빈자리', '서류', '커뮤니티']

const categoryBadgeColor = {
  빈자리: 'green' as const,
  서류: 'amber' as const,
  커뮤니티: 'zinc' as const,
}

export default function NotificationsPage() {
  const [activeCategory, setActiveCategory] = useState('전체')
  const { notifications, isLoading, error, refetch } = useNotifications()
  const [notifListRef] = useAutoAnimate({ duration: 200 })

  // Priority sort: 빈자리 > 서류 > 커뮤니티, unread first
  const sorted = useMemo(() => {
    const priorityMap: Record<string, number> = { '빈자리': 0, '서류': 1, '커뮤니티': 2 }
    return [...notifications].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1
      const pa = priorityMap[a.category] ?? 3
      const pb = priorityMap[b.category] ?? 3
      return pa - pb
    })
  }, [notifications])

  const filtered = useMemo(
    () =>
      activeCategory === '전체'
        ? sorted
        : sorted.filter((n) => n.category === activeCategory),
    [sorted, activeCategory],
  )

  return (
    <div className="relative space-y-6">
      <BrandWatermark className="opacity-30" />
      <BreadcrumbNav
        parent={{ label: '마이페이지', href: '/my' }}
        current="알림"
        action={
          <DsButton variant="ghost" className={DS_TYPOGRAPHY.bodySm}>
            <Check className="h-4 w-4" />
            전체 읽음
          </DsButton>
        }
      />

      {/* ══════ INTRO ══════ */}
      <FadeIn>
        <div>
          <p className={DS_PAGE_HEADER.eyebrow}>
            알림
          </p>
          <Heading className={cn('mt-3 font-wordmark font-bold', DS_PAGE_HEADER.title)}>
            알림 센터
          </Heading>
          <Text className={cn('mt-2', DS_TYPOGRAPHY.body, DS_PAGE_HEADER.subtitle)}>
            빈자리 발생, 서류 마감 등 중요 소식을 확인하세요.
          </Text>
        </div>
      </FadeIn>

      {/* ══════ CATEGORY CHIPS ══════ */}
      <FadeIn>
        <div className="hide-scrollbar flex gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <BadgeButton
              key={cat}
              color={activeCategory === cat ? 'dotori' : 'zinc'}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </BadgeButton>
          ))}
        </div>
      </FadeIn>

      {/* ══════ CONTENT ══════ */}
      {isLoading ? (
        <Skeleton variant="list" count={4} />
      ) : error ? (
        <ErrorState
          message="알림을 불러오지 못했어요"
          variant="network"
          action={{ label: '다시 시도', onClick: refetch }}
        />
      ) : filtered.length === 0 ? (
        <motion.div {...scrollFadeIn}>
          <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'flex flex-col items-center rounded-2xl py-14 text-center')}>
            <BrandEmptyIllustration variant="empty" size={96} className="mb-2" />
            <Text className={cn('mt-5', DS_EMPTY_STATE.title)}>
              알림이 없어요
            </Text>
            <Text className={cn('mt-1.5', DS_EMPTY_STATE.description)}>
              새로운 알림이 오면 여기에 표시됩니다
            </Text>
            <div className="mt-5 flex gap-2">
              <DsButton href="/my/settings" variant="secondary">
                알림 설정하기
              </DsButton>
              <DsButton href="/explore" variant="ghost">
                시설 탐색하기
              </DsButton>
            </div>
          </div>
        </motion.div>
      ) : (
        <div ref={notifListRef}>
        <FadeInStagger faster className="space-y-2">
          {filtered.map((notif) => {
            const badgeColor =
              categoryBadgeColor[notif.category as keyof typeof categoryBadgeColor] ?? ('zinc' as const)
            return (
              <FadeIn key={notif.id}>
                <div
                  className={`group/card flex items-start gap-3 rounded-2xl p-4 transition-colors ring-1 ${
                    notif.read
                      ? 'bg-white/60 ring-dotori-100/60 dark:bg-white/[0.02] dark:ring-dotori-800/30'
                      : 'bg-dotori-50/60 ring-dotori-200/40 shadow-sm dark:bg-dotori-950/40 dark:ring-dotori-700/30'
                  }`}
                >
                  {/* Unread dot */}
                  <div className="mt-2 shrink-0">
                    {!notif.read && (
                      <span className="block h-2 w-2 rounded-full bg-dotori-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge color={badgeColor}>{notif.category}</Badge>
                      <Text className={cn(DS_TYPOGRAPHY.caption, 'text-dotori-400')} suppressHydrationWarning>
                        {notif.time}
                      </Text>
                    </div>
                    <p className={cn('mt-1 font-semibold text-dotori-950 dark:text-dotori-50', DS_TYPOGRAPHY.bodySm)}>
                      {notif.title}
                      {notif.category === '빈자리' && (
                        <ToBadge status="available" compact className="ml-2" />
                      )}
                    </p>
                    <Text className={cn('mt-0.5', DS_TYPOGRAPHY.bodySm, 'text-dotori-600 dark:text-dotori-400')}>
                      {notif.body}
                    </Text>
                    {notif.category === '빈자리' && notif.facilityId && (
                      <Link
                        href={`/facility/${notif.facilityId}`}
                        className={cn('mt-1.5 inline-block font-semibold text-dotori-500 hover:text-dotori-700', DS_TYPOGRAPHY.caption)}
                      >
                        시설 상세보기 &rarr;
                      </Link>
                    )}
                  </div>

                  {/* ══════ DROPDOWN MENU ══════ */}
                  <Dropdown>
                    <DropdownButton
                      plain={true}
                      aria-label="알림 메뉴"
                      className="shrink-0"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </DropdownButton>
                    <DropdownMenu anchor="bottom end">
                      <DropdownItem>
                        <Check className="h-4 w-4" data-slot="icon" />
                        <DropdownLabel>읽음 처리</DropdownLabel>
                      </DropdownItem>
                      <DropdownItem>
                        <Trash2 className="h-4 w-4" data-slot="icon" />
                        <DropdownLabel>삭제</DropdownLabel>
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </FadeIn>
            )
          })}
        </FadeInStagger>
        </div>
      )}

      {/* ══════ PAGINATION ══════ */}
      {filtered.length > 10 && (
        <FadeIn>
          <Pagination aria-label="알림 페이지">
            <PaginationPrevious href={undefined}>이전</PaginationPrevious>
            <PaginationNext href={undefined}>다음</PaginationNext>
          </Pagination>
        </FadeIn>
      )}
    </div>
  )
}
