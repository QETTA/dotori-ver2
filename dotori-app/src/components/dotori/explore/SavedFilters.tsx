'use client'

/**
 * SavedFilters — Saved filter presets for explore page
 * 로컬스토리지 기반, 최대 5개
 */
import { useCallback, useSyncExternalStore } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { DS_TEXT } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'
import { DsButton } from '@/components/ds/DsButton'
import { FadeIn } from '@/components/dotori/FadeIn'

const STORAGE_KEY = 'dotori:saved-filters'
const MAX_FILTERS = 5

export interface SavedFilter {
  id: string
  name: string
  params: Record<string, string>
}

/* ── useSyncExternalStore-safe localStorage store ── */
let _snapshot: SavedFilter[] = []
let _snapshotRaw: string | null = '__uninit__'
const _listeners = new Set<() => void>()

function _read(): SavedFilter[] {
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

function getStorageSnapshot(): SavedFilter[] {
  if (_snapshotRaw === '__uninit__' && typeof window !== 'undefined') _read()
  return _snapshot
}

const _serverSnapshot: SavedFilter[] = []
function getServerSnapshot() { return _serverSnapshot }

export function SavedFilters({
  onApply,
  className,
}: {
  onApply: (filter: SavedFilter) => void
  className?: string
}) {
  const filters = useSyncExternalStore(subscribeStorage, getStorageSnapshot, getServerSnapshot)

  const updateStorage = useCallback((next: SavedFilter[]) => {
    const raw = JSON.stringify(next)
    _snapshotRaw = raw
    _snapshot = next
    localStorage.setItem(STORAGE_KEY, raw)
    _listeners.forEach(l => l())
  }, [])

  const handleDelete = useCallback((id: string) => {
    updateStorage(filters.filter((f) => f.id !== id))
  }, [filters, updateStorage])

  const handleSaveCurrent = useCallback(() => {
    const newFilter: SavedFilter = {
      id: `filter-${Date.now()}`,
      name: `필터 ${filters.length + 1}`,
      params: {},
    }
    updateStorage([...filters, newFilter].slice(-MAX_FILTERS))
  }, [filters, updateStorage])

  return (
    <FadeIn className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        {filters.map((filter) => (
          <div
            key={filter.id}
            className="flex items-center gap-1 rounded-full bg-dotori-950/[0.025] pl-3 pr-1.5 py-1 dark:bg-white/5"
          >
            <button
              type="button"
              className={cn('text-xs font-medium hover:text-dotori-950 dark:hover:text-white', DS_TEXT.secondary)}
              onClick={() => onApply(filter)}
            >
              {filter.name}
            </button>
            <button
              type="button"
              className="grid h-5 w-5 place-items-center rounded-full text-dotori-400 hover:bg-dotori-200/60 hover:text-dotori-700 dark:hover:bg-dotori-700/40"
              onClick={() => handleDelete(filter.id)}
              aria-label={`${filter.name} 삭제`}
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </div>
        ))}
        {filters.length < MAX_FILTERS && (
          <DsButton
            variant="ghost"
            onClick={handleSaveCurrent}
            className="rounded-full px-3 py-1 text-xs text-dotori-500 hover:text-dotori-700 dark:text-dotori-400"
          >
            + 현재 필터 저장
          </DsButton>
        )}
      </div>
    </FadeIn>
  )
}
