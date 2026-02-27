'use client'

/**
 * Explore Page — Premium redesign (Wave 10)
 *
 * Design: Warm organic + confident efficiency
 * Header: Glass morphism with ambient glow
 * Results: Status-first cards with accent bars
 * Motion: scrollFadeIn, stagger, hoverLift presets
 */
import { Suspense, useState } from 'react'
import { MapIcon } from '@heroicons/react/24/outline'
import { Text } from '@/components/catalyst/text'
import { FadeIn } from '@/components/dotori/FadeIn'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { cn } from '@/lib/utils'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
import { ToRiFAB } from '@/components/dotori/ToRiFAB'
import { ExploreSearchHeader } from '@/components/dotori/explore/ExploreSearchHeader'
import { ExploreResultList } from '@/components/dotori/explore/ExploreResultList'
import { ExploreMapToggle } from '@/components/dotori/explore/ExploreMapToggle'
import { useExploreSearch } from '@/components/dotori/explore/useExploreSearch'

function ExploreContent() {
  const { headerState, resultState, headerActions, resultActions, resultInteraction } =
    useExploreSearch()
  const [view, setView] = useState<'list' | 'map'>('list')

  return (
    <div className="relative min-h-screen">
      <BrandWatermark className="opacity-30" />
      {/* ══════ SEARCH HEADER ══════ */}
      <ExploreSearchHeader state={headerState} actions={headerActions} />

      {/* ══════ VIEW TOGGLE ══════ */}
      <FadeIn className="px-4 py-3">
        <ExploreMapToggle view={view} onToggle={setView} />
      </FadeIn>

      {/* ══════ ToRI FAB ══════ */}
      <ToRiFAB prompt="주변 시설 추천해줘" />

      {/* ══════ RESULTS / MAP ══════ */}
      {view === 'list' ? (
        <ExploreResultList
          state={resultState}
          actions={resultActions}
          interaction={resultInteraction}
        />
      ) : (
        <FadeIn className="px-4 pb-28">
          <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'flex h-72 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-dotori-200/40 dark:ring-dotori-700/40')}>
            <div className="text-center">
              <MapIcon className="mx-auto h-8 w-8 text-dotori-300 dark:text-dotori-600" />
              <Text className="mt-3 text-sm text-dotori-500">카카오맵 준비 중</Text>
              <Text className="mt-1 text-xs text-dotori-400">
                지역을 선택하면 지도에 시설이 표시돼요
              </Text>
            </div>
          </div>
        </FadeIn>
      )}
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
