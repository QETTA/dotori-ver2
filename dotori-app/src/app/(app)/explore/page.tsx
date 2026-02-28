'use client'

/**
 * Explore Page — Premium editorial with hero + 3-layer hover
 *
 * TP5: Pattern 1 (3-layer hover), Pattern 2 (gradient text),
 *       Pattern 3 (card.eyebrow compound), Pattern 5 (border accent + noise)
 */
import { Suspense, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { scrollFadeIn, hoverLift, gradientTextHero } from '@/lib/motion'
import { DS_SURFACE, DS_HERO, DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_GRADIENT } from '@/lib/design-system/tokens'
import { FadeIn } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { NoiseTexture } from '@/components/dotori/NoiseTexture'
import { ToRiFAB } from '@/components/dotori/ToRiFAB'
import { MapEmbed } from '@/components/dotori/MapEmbed'
import { ExploreSearchHeader } from '@/components/dotori/explore/ExploreSearchHeader'
import { ExploreResultList } from '@/components/dotori/explore/ExploreResultList'
import { ExploreMapToggle } from '@/components/dotori/explore/ExploreMapToggle'
import { useExploreSearch } from '@/components/dotori/explore/useExploreSearch'

function ExploreContent() {
  const { headerState, resultState, headerActions, resultActions, resultInteraction, mapState } =
    useExploreSearch()
  const [view, setView] = useState<'list' | 'map'>('list')
  const router = useRouter()
  const handleMarkerClick = useCallback((id: string) => {
    router.push(`/facility/${id}`)
  }, [router])

  return (
    <div className={cn(DS_SURFACE.primary, 'relative min-h-screen')}>
      <BrandWatermark className="opacity-20" />

      {/* ══════ HERO — TP5 Pattern 2 (gradient text) + Pattern 3 (eyebrow compound) ══════ */}
      <div className={cn(DS_HERO.container, DS_HERO.dark, 'rounded-b-3xl border-b border-dotori-200/70 ring-1 ring-dotori-100/70 dark:border-dotori-900/60 dark:ring-dotori-900/40')}>
        <NoiseTexture opacity={0.03} />
        <div className={cn('absolute inset-x-0 top-0 h-1.5', DS_GRADIENT.accentBar)} />
        <FadeIn>
          <p className={DS_PAGE_HEADER.eyebrow}>EXPLORE</p>
        </FadeIn>
        <FadeIn>
          <h1 className={cn('mt-3 font-wordmark text-4xl/[1.1] font-extrabold tracking-tight sm:text-5xl/[1.06]', gradientTextHero)}>
            시설 탐색
          </h1>
        </FadeIn>
        <FadeIn>
          <p className={cn(DS_HERO.subtitle, 'mt-3')}>
            우리 아이에게 딱 맞는 시설을 찾아보세요
          </p>
        </FadeIn>
      </div>

      {/* ══════ SEARCH HEADER ══════ */}
      <ExploreSearchHeader state={headerState} actions={headerActions} />

      {/* ══════ VIEW TOGGLE ══════ */}
      <FadeIn className="px-4 py-3">
        <ExploreMapToggle view={view} onToggle={setView} />
      </FadeIn>

      {/* ── Section accent divider — TP5 Pattern 5 ── */}
      <div className="mx-4 h-1 rounded-full bg-gradient-to-r from-dotori-500/0 via-dotori-400/80 to-dotori-500/0" />

      {/* ══════ ToRI FAB ══════ */}
      <ToRiFAB prompt="주변 시설 추천해줘" />

      {/* ══════ RESULTS / MAP ══════ */}
      <motion.div {...scrollFadeIn} className="space-y-6">
        {view === 'list' ? (
          <ExploreResultList
            state={resultState}
            actions={resultActions}
            interaction={resultInteraction}
          />
        ) : (
          <FadeIn className="px-4 pb-28">
            {/* TP5 Pattern 1: 3-layer hover on map card */}
            <div className="group/card relative">
              {/* z-0 — hover background */}
              <div className={cn(
                'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover/card:opacity-100',
                DS_SURFACE.sunken,
              )} />
              {/* z-10 — content */}
              <motion.div {...hoverLift} className={cn(DS_CARD.glass.base, DS_CARD.glass.dark, 'relative z-10 overflow-hidden p-1')}>
                <NoiseTexture opacity={0.03} />
                <div className={cn('absolute inset-x-0 top-0 h-1', DS_GRADIENT.accentBar)} />
                <MapEmbed
                  facilities={mapState.facilities}
                  center={mapState.center}
                  height="h-72"
                  onMarkerClick={handleMarkerClick}
                  userLocation={mapState.userLocation}
                />
              </motion.div>
              {/* z-20 — click zone (map is interactive, so no overlay link) */}
            </div>
          </FadeIn>
        )}
      </motion.div>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreContent />
    </Suspense>
  )
}
