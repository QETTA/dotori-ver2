'use client'

/**
 * My Page — Premium profile with accent bars + brand-tinted shadows
 *
 * Design: Gradient accent bar on profile, colored stat pills,
 * 3-layer hover menu, icon-led navigation
 */
import Link from 'next/link'
import {
  ArrowRightIcon,
  DocumentTextIcon,
  ClockIcon,
  HeartIcon,
  BellIcon,
  Cog6ToothIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline'
import { Subheading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Divider } from '@/components/catalyst/divider'
import { Avatar } from '@/components/catalyst/avatar'
import { DsButton } from '@/components/ds/DsButton'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { FunnelProgressWidget } from '@/components/dotori/FunnelProgressWidget'
import { useHomeDashboard } from '@/hooks/use-home-dashboard'
import { cn } from '@/lib/utils'
import { gradientTextHero } from '@/lib/motion'
import { DS_TYPOGRAPHY, DS_TEXT } from '@/lib/design-system/tokens'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER, DS_SURFACE } from '@/lib/design-system/page-tokens'

type MenuItem = {
  href: string
  label: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  tint: string
}

const menuItems: MenuItem[] = [
  { href: '/my/documents', label: '서류함', desc: '입소 서류 관리', icon: DocumentTextIcon, tint: 'dotori' },
  { href: '/my/waitlist', label: '입소 대기', desc: '대기 현황 확인', icon: ClockIcon, tint: 'amber' },
  { href: '/my/interests', label: '관심 시설', desc: '찜한 시설 목록', icon: HeartIcon, tint: 'dotori' },
  { href: '/my/notifications', label: '알림', desc: '빈자리·서류 알림', icon: BellIcon, tint: 'forest' },
  { href: '/my/settings', label: '설정', desc: '계정·알림 관리', icon: Cog6ToothIcon, tint: 'dotori' },
  { href: '/my/support', label: '고객 지원', desc: 'FAQ·1:1 문의', icon: ChatBubbleLeftIcon, tint: 'forest' },
]

const ICON_TINT: Record<string, string> = {
  dotori: 'bg-dotori-50 text-dotori-600 dark:bg-dotori-950/30 dark:text-dotori-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
  forest: 'bg-forest-50 text-forest-600 dark:bg-forest-950/30 dark:text-forest-400',
}

const statItems = [
  { href: '/my/interests', key: 'interestCount' as const, label: '관심 시설', color: 'text-dotori-600 dark:text-dotori-400' },
  { href: '/my/waitlist', key: 'waitlistCount' as const, label: '대기 중', color: 'text-forest-600 dark:text-forest-400' },
  { href: '/my/notifications', key: 'alertCount' as const, label: '알림', color: 'text-violet-600 dark:text-violet-400' },
]

export default function MyPage() {
  const { dashboard } = useHomeDashboard()
  const funnelStep = dashboard?.funnelStep ?? 0

  return (
    <div className="relative space-y-8">
      <BrandWatermark className="opacity-20" />

      {/* ══════ FUNNEL PROGRESS ══════ */}
      <FunnelProgressWidget step={funnelStep} />

      {/* ══════ HEADER + PROFILE — premium card ══════ */}
      <div>
        <FadeIn>
          <p className={DS_PAGE_HEADER.eyebrow}>
            마이페이지
          </p>
        </FadeIn>
        <FadeIn>
          <div className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'mt-5 overflow-hidden')}>
            {/* Gradient accent bar */}
            <div className="h-1 bg-gradient-to-r from-dotori-400 via-dotori-300 to-amber-300" />
            <div className="p-5">
              <div className="flex items-center gap-4">
                <Avatar initials="도" className="h-14 w-14 bg-dotori-50 text-dotori-600 ring-2 ring-dotori-200/50 dark:bg-dotori-950/30 dark:text-dotori-400 dark:ring-dotori-800/30" square />
                <div className="min-w-0 flex-1">
                  <Subheading level={2} className={cn(DS_TYPOGRAPHY.bodySm, 'font-semibold text-dotori-950 dark:text-dotori-50')}>게스트</Subheading>
                  <Text className={cn('mt-0.5', DS_TYPOGRAPHY.caption, DS_TEXT.muted)}>로그인하면 맞춤 서비스를 받아요</Text>
                </div>
                <DsButton href="/login" className="shrink-0">
                  로그인
                </DsButton>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ══════ STATS — colored accent numbers ══════ */}
      {(dashboard?.interestCount ?? 0) + (dashboard?.waitlistCount ?? 0) + (dashboard?.alertCount ?? 0) === 0 ? (
        <FadeIn>
          <Link href="/explore" className="group block">
            <div className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'relative overflow-hidden p-6 text-center transition hover:bg-dotori-50/30 dark:hover:bg-white/5')}>
              <div className="h-1 absolute inset-x-0 top-0 bg-gradient-to-r from-dotori-400/60 via-transparent to-forest-400/60" />
              <p className={cn(DS_TYPOGRAPHY.body, 'font-bold tracking-tight', gradientTextHero)}>
                아직 탐색 중이에요
              </p>
              <Text className={cn('mt-2', DS_TYPOGRAPHY.bodySm, DS_TEXT.muted)}>
                관심 시설을 등록하면 대기 현황과 알림을 한눈에 볼 수 있어요
              </Text>
              <div className={cn('mt-4 inline-flex items-center gap-1.5 rounded-full bg-dotori-50 px-3 py-1.5 font-semibold text-dotori-600 transition group-hover:bg-dotori-100 dark:bg-dotori-950/30 dark:text-dotori-400', DS_TYPOGRAPHY.caption)}>
                시설 탐색하기
                <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        </FadeIn>
      ) : (
        <FadeInStagger faster className="grid grid-cols-3 gap-3">
          {statItems.map((item) => {
            const count = dashboard?.[item.key] ?? 0
            return (
              <FadeIn key={item.href}>
                <Link href={item.href} className="group block">
                  <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'p-4 transition hover:bg-dotori-50/50 dark:hover:bg-white/5')}>
                    <div className={cn(DS_TYPOGRAPHY.h2, 'font-wordmark font-bold tabular-nums tracking-tight', item.color)}>
                      {count}<span className={cn(DS_TYPOGRAPHY.bodySm, 'font-medium', DS_TEXT.muted)}>건</span>
                    </div>
                    <p className={cn('mt-1', DS_TYPOGRAPHY.caption, DS_TEXT.muted)}>{item.label}</p>
                  </div>
                </Link>
              </FadeIn>
            )
          })}
        </FadeInStagger>
      )}

      <Divider soft />

      {/* ══════ MENU LIST — 3-layer hover + icon tint ══════ */}
      <FadeInStagger faster className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <FadeIn key={item.href}>
              <div className="group/card relative">
                {/* z-0 — hover background layer */}
                <div className={cn(
                  'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover/card:opacity-100',
                  DS_SURFACE.sunken,
                )} />
                {/* z-10 — content layer */}
                <div className="relative z-10 flex items-center gap-3.5 rounded-xl px-3 py-3 transition-transform duration-200 group-hover/card:-translate-y-px">
                  <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', ICON_TINT[item.tint])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn(DS_TYPOGRAPHY.body, 'font-semibold', DS_TEXT.primary)}>{item.label}</p>
                    <p className={cn(DS_TYPOGRAPHY.caption, DS_TEXT.muted)}>{item.desc}</p>
                  </div>
                  <ArrowRightIcon className={cn('h-4 w-4 shrink-0 transition-transform duration-200 group-hover/card:translate-x-0.5', DS_TEXT.muted)} />
                </div>
                {/* z-20 — click zone */}
                <Link href={item.href} className="absolute inset-0 z-20" aria-label={item.label}>
                  <span className="sr-only">{item.label} 열기</span>
                </Link>
              </div>
            </FadeIn>
          )
        })}
      </FadeInStagger>

      {/* ══════ APP INFO ══════ */}
      <FadeIn>
        <div className="pb-4 text-center">
          <Link href="/my/app-info" className={cn('font-mono transition-colors hover:text-dotori-600 dark:hover:text-dotori-300', DS_TYPOGRAPHY.caption, DS_TEXT.muted)}>
            도토리 v2.0 · 앱 정보
          </Link>
        </div>
      </FadeIn>
    </div>
  )
}
