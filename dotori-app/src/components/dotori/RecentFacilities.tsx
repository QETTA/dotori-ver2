'use client'

/**
 * RecentFacilities — Horizontal snap scroll of recently viewed facilities
 * TP Snap-Scroll Carousel pattern
 */
import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { hoverLift } from '@/lib/motion'
import { Badge } from '@/components/catalyst/badge'
import { Text } from '@/components/catalyst/text'
import { FadeIn } from '@/components/dotori/FadeIn'
import { SparkLine } from '@/components/dotori/charts/SparkLine'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { DS_PAGE_HEADER } from '@/lib/design-system/page-tokens'
import { DS_TYPOGRAPHY } from '@/lib/design-system/tokens'

const STORAGE_KEY = 'dotori:recent-facilities'

export interface RecentFacilityItem {
  id: string
  name: string
  type: string
  toScore?: number
  trend?: number[]
}

/* ── useSyncExternalStore-safe localStorage store ── */
let _snapshot: RecentFacilityItem[] = []
let _snapshotRaw: string | null = '__uninit__'
const _listeners = new Set<() => void>()

function _read(): RecentFacilityItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === _snapshotRaw) return _snapshot
    _snapshotRaw = raw
    _snapshot = raw ? JSON.parse(raw) : []
    return _snapshot
  } catch { return _snapshot }
}

function _emit() {
  const prev = _snapshot
  _read()
  if (prev !== _snapshot) _listeners.forEach(l => l())
}

function subscribeStorage(cb: () => void) {
  _listeners.add(cb)
  _read()
  const handler = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) _emit()
  }
  window.addEventListener('storage', handler)
  return () => { _listeners.delete(cb); window.removeEventListener('storage', handler) }
}

function getStorageSnapshot(): RecentFacilityItem[] {
  if (_snapshotRaw === '__uninit__' && typeof window !== 'undefined') _read()
  return _snapshot
}

const _serverSnapshot: RecentFacilityItem[] = []
function getServerSnapshot() { return _serverSnapshot }

export function notifyRecentFacilitiesChange() { _emit() }

export function RecentFacilities({ className }: { className?: string }) {
  const facilities = useSyncExternalStore(subscribeStorage, getStorageSnapshot, getServerSnapshot)

  if (facilities.length === 0) {
    return (
      <FadeIn className={className}>
        <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'flex flex-col items-center px-6 py-8 text-center')}>
          <p className={cn(DS_TYPOGRAPHY.body, 'font-semibold text-dotori-900 dark:text-dotori-50')}>아직 본 시설이 없어요</p>
          <Text className="mt-1.5 text-sm/6 text-dotori-500 dark:text-dotori-400">탐색에서 시설을 확인해보세요</Text>
        </div>
      </FadeIn>
    )
  }

  return (
    <div className={className}>
      <p className={cn(DS_PAGE_HEADER.eyebrow, 'mb-3')}>
        최근 본 시설
      </p>
      {/* Snap-Scroll Carousel (TP5 Pattern 4) */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent dark:from-dotori-950" />
        <div
          className={cn(
            'flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2',
            '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
          )}
        >
          {facilities.slice(0, 5).map((f) => (
            <motion.div key={f.id} {...hoverLift} className="shrink-0 snap-start">
              <Link
                href={`/facility/${f.id}`}
                className={cn(
                  DS_CARD.flat.base, DS_CARD.flat.dark, DS_CARD.flat.hover,
                  'block w-40 p-3',
                )}
              >
                <div className="flex items-center justify-between">
                  <Badge color="forest" className="text-xs">{f.type}</Badge>
                  {f.toScore && (
                    <span className="font-wordmark text-xs font-bold text-forest-600 dark:text-forest-400">
                      {f.toScore}%
                    </span>
                  )}
                </div>
                <p className={cn(DS_TYPOGRAPHY.bodySm, 'mt-2 truncate font-medium text-dotori-900 dark:text-dotori-50')}>
                  {f.name}
                </p>
                {f.trend && f.trend.length > 1 && (
                  <div className="mt-2">
                    <SparkLine
                      data={f.trend}
                      width={120}
                      height={24}
                      color="var(--color-forest-500)"
                      showDot={false}
                    />
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
