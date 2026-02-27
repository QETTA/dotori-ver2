'use client'

/**
 * My Page — Warm Atelier profile hub (R50 design upgrade)
 *
 * TP5: 3-Layer Hover (menu), Premium Card (profile), Brand-tinted Shadow
 * 2026: Glassmorphism 2.0, brand-tinted shadows, directional depth
 */
import Link from 'next/link'
import {
  Cog6ToothIcon,
  DocumentTextIcon,
  BellIcon,
  HeartIcon,
  QuestionMarkCircleIcon,
  ClipboardDocumentListIcon,
  ChevronRightIcon,
  ArrowRightIcon,
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
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { gradientText } from '@/lib/motion'
import { cn } from '@/lib/utils'

const menuItems = [
  { href: '/my/documents', label: '서류함', Icon: DocumentTextIcon, desc: '입소 서류 관리' },
  { href: '/my/waitlist', label: '입소 대기', Icon: ClipboardDocumentListIcon, desc: '대기 현황 확인' },
  { href: '/my/interests', label: '관심 시설', Icon: HeartIcon, desc: '찜한 시설 목록' },
  { href: '/my/notifications', label: '알림', Icon: BellIcon, desc: '빈자리·서류 알림' },
  { href: '/my/settings', label: '설정', Icon: Cog6ToothIcon, desc: '계정·알림 관리' },
  { href: '/my/support', label: '고객 지원', Icon: QuestionMarkCircleIcon, desc: 'FAQ·1:1 문의' },
]

const statItems = [
  { href: '/my/interests', key: 'interestCount' as const, label: '관심 시설', accent: 'border-l-dotori-400' },
  { href: '/my/waitlist', key: 'waitlistCount' as const, label: '대기 중', accent: 'border-l-forest-400' },
  { href: '/my/notifications', key: 'alertCount' as const, label: '알림', accent: 'border-l-amber-400' },
]

export default function MyPage() {
  const { dashboard } = useHomeDashboard()
  const funnelStep = dashboard?.funnelStep ?? 0

  return (
    <div className="relative space-y-10">
      <BrandWatermark className="opacity-30" />

      {/* ══════ FUNNEL PROGRESS — 최상단 ══════ */}
      <FunnelProgressWidget step={funnelStep} />

      {/* ══════ PROFILE — Premium glassmorphism card ══════ */}
      <div>
        <FadeIn>
          <p className={DS_PAGE_HEADER.eyebrow}>
            마이페이지
          </p>
        </FadeIn>
        <FadeIn>
          <div className={cn(DS_CARD.premium.base, DS_CARD.premium.dark, 'relative mt-5 overflow-hidden rounded-2xl p-5')}>
            {/* Gradient accent bar — TP5 Pattern 5 */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-dotori-400 via-dotori-500 to-forest-400" />
            <div className="flex items-center gap-4 pt-1">
              <Avatar initials="도" className="h-14 w-14 bg-dotori-100 text-dotori-700 dark:bg-dotori-900 dark:text-dotori-300" square />
              <div className="flex-1 min-w-0">
                <Subheading level={2} className="text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">게스트</Subheading>
                <Text className="mt-0.5 text-xs/5 text-dotori-500 sm:text-xs/5 dark:text-dotori-400">로그인하면 맞춤 서비스를 받아요</Text>
              </div>
              <DsButton href="/login" className="shrink-0">
                로그인
              </DsButton>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ══════ STATS — accent bar + gradient text (or onboarding CTA if all zero) ══════ */}
      {(dashboard?.interestCount ?? 0) + (dashboard?.waitlistCount ?? 0) + (dashboard?.alertCount ?? 0) === 0 ? (
        <FadeIn>
          <Link href="/explore" className="group block">
            <div className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'relative overflow-hidden p-6 transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_24px_rgba(176,122,74,0.1)]')}>
              {/* Accent bar */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-dotori-400 via-amber-400 to-forest-400" />
              <div className="pt-1 text-center">
                <p className="text-sm/6 font-semibold text-dotori-950 dark:text-white">
                  아직 탐색 중이에요
                </p>
                <p className="mt-1.5 text-xs/5 text-dotori-500 dark:text-dotori-400">
                  관심 시설을 등록하면 대기 현황과 알림을 한눈에 볼 수 있어요
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs/5 font-semibold text-dotori-500 transition-colors group-hover:text-dotori-700">
                  시설 탐색하기
                  <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          </Link>
        </FadeIn>
      ) : (
        <FadeInStagger faster className="grid grid-cols-3 gap-2">
          {statItems.map((item) => {
            const count = dashboard?.[item.key] ?? 0
            return (
              <FadeIn key={item.href}>
                <Link href={item.href} className="group block">
                  <div className={cn(
                    DS_CARD.raised.base, DS_CARD.raised.dark,
                    'relative overflow-hidden border-l-3 p-4 transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_24px_rgba(176,122,74,0.1)]',
                    item.accent,
                  )}>
                    <div className={cn('text-2xl/8 font-bold tracking-tight', count > 0 ? gradientText : 'text-dotori-300 dark:text-dotori-600')}>
                      {count}건
                    </div>
                    <p className="mt-1 text-xs/5 text-dotori-600 dark:text-dotori-400">
                      {item.label}
                    </p>
                    <ArrowRightIcon className="absolute right-3 top-3 h-3.5 w-3.5 text-dotori-300 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              </FadeIn>
            )
          })}
        </FadeInStagger>
      )}

      <Divider soft />

      {/* ══════ MENU LIST — 3-Layer Hover (TP5 Pattern 1) ══════ */}
      <FadeInStagger className="space-y-1">
        {menuItems.map((item, i) => (
          <FadeIn key={item.href}>
            <div className="group/card relative rounded-xl">
              {/* Layer 0: Background — opacity transition on hover */}
              <div className="absolute -inset-px rounded-xl bg-dotori-50 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 dark:bg-white/5" />

              {/* Layer 1: Content — relative z-10 */}
              <div className="relative z-10 flex items-center gap-4 p-4">
                <div className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'grid h-10 w-10 shrink-0 place-items-center rounded-xl')}>
                  <item.Icon className="h-5 w-5 text-dotori-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <Subheading level={3} className="text-sm/6 font-medium text-dotori-950 sm:text-sm/6">{item.label}</Subheading>
                  <Text className="text-xs/5 text-dotori-500 sm:text-xs/5">{item.desc}</Text>
                </div>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-dotori-300 transition-all duration-300 group-hover/card:translate-x-0.5 group-hover/card:text-dotori-500" />
              </div>

              {/* Layer 2: Click zone — z-20 transparent overlay */}
              <Link href={item.href} className="absolute inset-0 z-20" />
            </div>
            {i < menuItems.length - 1 && <Divider soft className="mx-4" />}
          </FadeIn>
        ))}
      </FadeInStagger>

      {/* ══════ APP INFO ══════ */}
      <FadeIn>
        <div className="text-center pb-4">
          <Link href="/my/app-info" className="font-mono text-xs/5 text-dotori-400 hover:text-dotori-600 transition-colors">
            도토리 v2.0 · 앱 정보
          </Link>
        </div>
      </FadeIn>
    </div>
  )
}
