'use client'

/**
 * Explore Page — TP Studio editorial pattern
 *
 * Design: Typography-driven, ring-1 ring-black/5, no ambient glows
 */
import { Suspense, useState } from 'react'
import { MapIcon } from '@heroicons/react/24/outline'
import { Text } from '@/components/catalyst/text'
import { cn } from '@/lib/utils'
import { DS_EMPTY_STATE, DS_SURFACE } from '@/lib/design-system/page-tokens'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { FadeIn } from '@/components/dotori/FadeIn'
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
    <div className={cn(DS_SURFACE.primary, 'relative min-h-screen')}>
      {/* Warm gradient background */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-dotori-50/60 via-dotori-50/30 to-transparent dark:from-dotori-950/30 dark:via-transparent" />
      <BrandWatermark className="opacity-20" />
      {/* ══════ SEARCH HEADER ══════ */}
      <ExploreSearchHeader state={headerState} actions={headerActions} />

      {/* ══════ VIEW TOGGLE ══════ */}
      <FadeIn className="px-4 py-3">
        <ExploreMapToggle view={view} onToggle={setView} />
      </FadeIn>

      {/* ── Section accent divider ── */}
      <div className="h-1.5 bg-gradient-to-r from-dotori-500/0 via-dotori-400/80 to-dotori-500/0" />

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
          <div className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'flex h-72 items-center justify-center')}>
            <div className="text-center">
              <MapIcon className={cn(DS_EMPTY_STATE.illustration, 'mx-auto h-8 w-8 text-gray-400')} />
              <Text className={cn(DS_EMPTY_STATE.title, 'mt-3')}>카카오맵 준비 중</Text>
              <Text className={DS_EMPTY_STATE.description}>
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
