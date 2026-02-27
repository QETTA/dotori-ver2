'use client'

/**
 * RecentFacilities — Horizontal snap scroll of recently viewed facilities
 * 홈, 탐색 (로컬스토리지 기반)
 */
import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { hoverLift } from '@/lib/motion'
import { DS_CARD } from '@/lib/design-system/card-tokens'
import { Badge } from '@/components/catalyst/badge'
import { Text } from '@/components/catalyst/text'
import { Subheading } from '@/components/catalyst/heading'
import { SparkLine } from '@/components/dotori/charts/SparkLine'
import { FadeIn } from '@/components/dotori/FadeIn'

const STORAGE_KEY = 'dotori:recent-facilities'

export interface RecentFacilityItem {
  id: string
  name: string
  type: string
  toScore?: number
  trend?: number[]
}

/* ── useSyncExternalStore-safe localStorage store ──
 * getSnapshot은 순수 함수여야 함 — localStorage 직접 읽기 금지.
 * snapshot은 subscribe 콜백 또는 초기화 시에만 갱신. */
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
  _read() // 최초 subscribe 시 동기화
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

/** 같은 탭에서 localStorage 쓴 뒤 호출 — 구독자에게 변경 알림 */
export function notifyRecentFacilitiesChange() { _emit() }

export function RecentFacilities({ className }: { className?: string }) {
  const facilities = useSyncExternalStore(subscribeStorage, getStorageSnapshot, getServerSnapshot)

  if (facilities.length === 0) {
    return (
      <FadeIn className={className}>
        <div className={cn(DS_CARD.flat.base, DS_CARD.flat.dark, 'flex flex-col items-center px-6 py-8 text-center')}>
          <BuildingOffice2Icon className="h-8 w-8 text-dotori-300 dark:text-dotori-600" />
          <Text className="mt-3 text-sm text-dotori-500">아직 본 시설이 없어요</Text>
          <Text className="mt-1 text-xs text-dotori-400">탐색에서 시설을 확인해보세요</Text>
        </div>
      </FadeIn>
    )
  }

  return (
    <div className={className}>
      <Subheading level={3} className="mb-3 text-sm/6 font-semibold text-dotori-950 sm:text-sm/6">
        최근 본 시설
      </Subheading>
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
              className={cn(DS_CARD.raised.base, DS_CARD.raised.dark, 'block w-40 p-3 transition-colors hover:bg-dotori-50/50')}
            >
              <div className="flex items-center justify-between">
                <Badge color="forest" className="text-xs">{f.type}</Badge>
                {f.toScore && (
                  <span className="font-wordmark text-xs font-bold text-forest-600 dark:text-forest-400">
                    {f.toScore}%
                  </span>
                )}
              </div>
              <p className="mt-2 truncate text-sm font-medium text-dotori-950 dark:text-dotori-50">
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
  )
}
