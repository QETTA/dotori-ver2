'use client'

/**
 * Explore Page — TP Studio editorial pattern
 *
 * Design: Typography-driven, ring-1 ring-black/5, no ambient glows
 */
import { Suspense, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { DS_SURFACE } from '@/lib/design-system/page-tokens'
import { FadeIn } from '@/components/dotori/FadeIn'
import { BrandWatermark } from '@/components/dotori/BrandWatermark'
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
          <MapEmbed
            facilities={mapState.facilities}
            center={mapState.center}
            height="h-72"
            onMarkerClick={handleMarkerClick}
            userLocation={mapState.userLocation}
          />
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
