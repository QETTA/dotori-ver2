'use client'

/**
 * My Page — Premium profile with accent bars + brand-tinted shadows
 *
 * Design: Gradient accent bar on profile, colored stat pills,
 * 3-layer hover menu, icon-led navigation
 */
import Link from 'next/link'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { motion } from 'motion/react'
import {
  ArrowRight,
  FileText,
  Clock,
  Heart,
  Bell,
  Settings,
  MessageSquare,
  Search,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import { Subheading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Divider } from '@/components/catalyst/divider'
import { Avatar } from '@/components/catalyst/avatar'
import { DsButton } from '@/components/ds/DsButton'
import { FadeIn, FadeInStagger } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { NoiseTexture } from '@/components/dotori/NoiseTexture'
import { AnimatedNumber } from '@/components/dotori/AnimatedNumber'
import { FunnelProgressWidget } from '@/components/dotori/FunnelProgressWidget'
import { useHomeDashboard } from '@/hooks/use-home-dashboard'
import { cn } from '@/lib/utils'
import { DS_TYPOGRAPHY, DS_TEXT, DS_ICON } from '@/lib/design-system/tokens'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER, DS_SURFACE } from '@/lib/design-system/page-tokens'
import { scrollFadeIn, hoverLift, gradientTextHero } from '@/lib/motion'

type MenuItem = {
  href: string
  label: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  tint: string
}

const menuItems: MenuItem[] = [
  { href: '/my/documents', label: '서류함', desc: '입소 서류 관리', icon: FileText, tint: 'dotori' },
  { href: '/my/waitlist', label: '입소 대기', desc: '대기 현황 확인', icon: Clock, tint: 'amber' },
  { href: '/my/interests', label: '관심 시설', desc: '찜한 시설 목록', icon: Heart, tint: 'dotori' },
  { href: '/my/notifications', label: '알림', desc: '빈자리·서류 알림', icon: Bell, tint: 'forest' },
  { href: '/my/settings', label: '설정', desc: '계정·알림 관리', icon: Settings, tint: 'dotori' },
  { href: '/my/support', label: '고객 지원', desc: 'FAQ·1:1 문의', icon: MessageSquare, tint: 'forest' },
]

const ICON_TINT: Record<string, string> = {
  dotori: 'bg-dotori-100 text-dotori-700 ring-1 ring-dotori-200/40 dark:bg-dotori-950/40 dark:text-dotori-400 dark:ring-dotori-800/30',
  amber: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200/40 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800/30',
  forest: 'bg-forest-100 text-forest-700 ring-1 ring-forest-200/40 dark:bg-forest-950/40 dark:text-forest-400 dark:ring-forest-800/30',
}

const statItems = [
  { href: '/my/interests', key: 'interestCount' as const, label: '관심 시설', color: 'text-dotori-600 dark:text-dotori-400' },
  { href: '/my/waitlist', key: 'waitlistCount' as const, label: '대기 중', color: 'text-forest-600 dark:text-forest-400' },
  { href: '/my/notifications', key: 'alertCount' as const, label: '알림', color: 'text-violet-600 dark:text-violet-400' },
]

export default function MyPage() {
  const { dashboard } = useHomeDashboard()
  const funnelStep = dashboard?.funnelStep ?? 0
  const [menuRef] = useAutoAnimate({ duration: 200 })

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
          <h1 className={cn('mt-3 font-wordmark text-3xl/[1.2] font-extrabold tracking-tight', gradientTextHero)}>
            나의 도토리
          </h1>
        </FadeIn>
        <FadeIn>
          <div className={cn(DS_CARD.glass.base, DS_CARD.glass.dark, 'relative mt-5 overflow-hidden')}>
            <NoiseTexture />
            {/* Gradient accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-dotori-500 via-amber-400 to-dotori-400" />
            <div className="p-5">
              <div className="flex items-center gap-4">
                <Avatar initials="도" className="h-14 w-14 bg-dotori-50 text-dotori-600 ring-2 ring-dotori-400/30 shadow-[0_4px_12px_rgba(176,122,74,0.12)] dark:bg-dotori-950/30 dark:text-dotori-400 dark:ring-dotori-700/40" square />
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
        <>
        <FadeIn>
          <Link href="/explore" className="group block">
            <div className={cn(DS_CARD.premium.base, DS_CARD.premium.dark, 'relative overflow-hidden p-6 text-center transition hover:bg-dotori-50/30 dark:hover:bg-white/5')}>
              <NoiseTexture />
              <div className="h-1.5 absolute inset-x-0 top-0 bg-gradient-to-r from-dotori-500 via-amber-400 to-forest-500" />
              <h2 className={cn('font-wordmark text-xl/[1.2] font-bold tracking-tight text-dotori-800 dark:text-dotori-100')}>
                아직 탐색 중이에요
              </h2>
              <Text className={cn('mt-2', DS_TYPOGRAPHY.bodySm, DS_TEXT.muted)}>
                관심 시설을 등록하면 대기 현황과 알림을 한눈에 볼 수 있어요
              </Text>
              <div className={cn('mt-4 inline-flex items-center gap-1.5 rounded-full bg-dotori-50 px-3 py-1.5 font-semibold text-dotori-600 transition group-hover:bg-dotori-100 dark:bg-dotori-950/30 dark:text-dotori-400', DS_TYPOGRAPHY.caption)}>
                시설 탐색하기
                <ArrowRight className={cn(DS_ICON.xs, 'transition-transform group-hover:translate-x-0.5')} />
              </div>
            </div>
          </Link>
        </FadeIn>
        {/* Quick start guide — fills empty viewport */}
        <FadeInStagger faster className="grid grid-cols-3 gap-2.5">
          {[
            { href: '/explore', icon: Search, label: '시설 탐색', tint: 'dotori' as const },
            { href: '/chat', icon: Sparkles, label: 'AI 상담', tint: 'amber' as const },
            { href: '/community', icon: BookOpen, label: '이웃 이야기', tint: 'forest' as const },
          ].map((action) => (
            <FadeIn key={action.href}>
              <Link href={action.href} className="group/card block">
                <motion.div {...hoverLift} className={cn(DS_CARD.glass.base, DS_CARD.glass.dark, 'relative overflow-hidden p-4 text-center transition group-hover/card:ring-dotori-300/70')}>
                  <NoiseTexture opacity={0.02} />
                  <div className={cn('mx-auto mb-2 grid h-11 w-11 place-items-center rounded-xl', ICON_TINT[action.tint])}>
                    <action.icon className={DS_ICON.lg} />
                  </div>
                  <p className={cn(DS_TYPOGRAPHY.caption, 'font-medium', DS_TEXT.secondary)}>{action.label}</p>
                </motion.div>
              </Link>
            </FadeIn>
          ))}
        </FadeInStagger>
        </>
      ) : (
        <motion.div {...scrollFadeIn}>
          <FadeInStagger faster className="grid grid-cols-3 gap-3">
            {statItems.map((item) => {
              const count = dashboard?.[item.key] ?? 0
              return (
                <FadeIn key={item.href}>
                  <Link href={item.href} className="group/card block">
                    <motion.div {...hoverLift} className={cn(DS_CARD.glass.base, DS_CARD.glass.dark, 'relative overflow-hidden p-4 transition group-hover/card:ring-dotori-300/70')}>
                      <div className="absolute left-0 top-0 h-full w-0.5 bg-dotori-400/60" />
                      <div className={cn(DS_TYPOGRAPHY.h2, 'font-wordmark font-bold tabular-nums tracking-tight', item.color)}>
                        <AnimatedNumber end={count} suffix="" className="" /><span className={cn(DS_TYPOGRAPHY.bodySm, 'font-medium', DS_TEXT.muted)}>건</span>
                      </div>
                      <p className={cn('mt-1', DS_TYPOGRAPHY.caption, DS_TEXT.muted)}>{item.label}</p>
                    </motion.div>
                  </Link>
                </FadeIn>
              )
            })}
          </FadeInStagger>
        </motion.div>
      )}

      <Divider soft />

      {/* ══════ MENU LIST — 3-layer hover + icon tint ══════ */}
      <motion.div {...scrollFadeIn} ref={menuRef}>
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
                {/* z-10 — content layer (resting ring + shadow for depth in static view) */}
                <div className="relative z-10 flex items-center gap-3.5 rounded-xl bg-white px-3.5 py-3.5 ring-1 ring-dotori-300/50 shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.16),0_6px_18px_rgba(176,122,74,0.12)] transition-all duration-200 group-hover/card:-translate-y-1 group-hover/card:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_2px_6px_rgba(0,0,0,0.18),0_14px_32px_rgba(176,122,74,0.18)] group-hover/card:ring-dotori-400/60 dark:bg-dotori-950/50 dark:ring-dotori-700/40 dark:shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.4),0_6px_18px_rgba(0,0,0,0.4)] dark:group-hover/card:shadow-[0_0_0_1px_rgba(0,0,0,0.25),0_2px_6px_rgba(0,0,0,0.4),0_14px_32px_rgba(0,0,0,0.5)]">
                  <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', ICON_TINT[item.tint])}>
                    <Icon className={DS_ICON.md} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn(DS_TYPOGRAPHY.body, 'font-semibold', DS_TEXT.primary)}>{item.label}</p>
                    <p className={cn(DS_TYPOGRAPHY.caption, DS_TEXT.muted)}>{item.desc}</p>
                  </div>
                  <ArrowRight className={cn(DS_ICON.sm, 'shrink-0 transition-transform duration-200 group-hover/card:translate-x-0.5', DS_TEXT.muted)} />
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
      </motion.div>

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
