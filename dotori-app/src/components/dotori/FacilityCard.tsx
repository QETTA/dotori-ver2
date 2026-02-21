'use client'

import { memo, useMemo } from 'react'
import { Badge } from '@/components/catalyst/badge'
import { Button } from '@/components/catalyst/button'
import { motion } from 'motion/react'
import { cn, facilityTypeBadgeColor, formatRelativeTime } from '@/lib/utils'
import type { ActionType, Facility, SourceInfo } from '@/types/dotori'
import { SourceChip } from './SourceChip'

export const FacilityCard = memo(function FacilityCard({
  facility,
  sources,
  onAction,
  compact = false,
}: {
  facility: Facility
  sources?: SourceInfo[]
  onAction?: (action: ActionType, facilityId: string) => void
  compact?: boolean
}) {
  const availableSeats = facility.capacity.total - facility.capacity.current
  const hasRecentUpdate = useMemo(() => {
    const lastSyncedAtTime = new Date(facility.lastSyncedAt).getTime()
    // eslint-disable-next-line react-hooks/purity
    return Number.isFinite(lastSyncedAtTime) && Date.now() - lastSyncedAtTime <= 7 * 24 * 60 * 60 * 1000
  }, [facility.lastSyncedAt])

  const statusColor = {
    available: 'border-l-4 border-l-forest-500/90',
    waiting: 'border-l-4 border-l-warning/90',
    full: 'border-l-4 border-l-danger/90',
  }

  const statusDot = {
    available: 'bg-forest-500',
    waiting: 'bg-warning',
    full: 'bg-danger',
  }

	const motionCardProps = {
		whileHover: { scale: 1.01, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
		whileTap: { scale: 0.98 },
	transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
	}

  if (compact) {
    return (
      <motion.div
        role="article"
        aria-label={facility.name}
        {...motionCardProps}
        className={cn(
          'relative flex items-center gap-3.5 rounded-3xl bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md',
          'motion-safe:animate-in motion-safe:fade-in duration-300',
          facility.isPremium ? 'ring-1 ring-dotori-200' : ''
        )}
      >
        {facility.isPremium ? (
          <span className="absolute right-3 top-3 rounded-full bg-dotori-100 px-2 py-0.5 text-[11px] text-dotori-700">
            파트너
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', statusDot[facility.status])} />
            <span className="block truncate font-semibold">{facility.name}</span>
          </div>
          <span className="text-[13px] text-dotori-500">
            {facility.distance ? `${facility.distance} · ` : ''}{facility.type}
          </span>
        </div>
        <div className="text-right">
          {facility.status === 'available' ? (
            <span className="inline-flex items-center rounded-full bg-forest-100 px-2.5 py-0.5 text-[12px] font-bold uppercase tracking-wide text-forest-500">
              TO 있음
            </span>
          ) : (
            <span className="block text-[15px] font-bold">
              {facility.status === 'waiting' ? `대기 ${facility.capacity.waiting}` : '마감'}
            </span>
          )
          }
          {facility.status === 'available' && (
            <span className="mt-1 block text-[11px] text-forest-500">자리 {availableSeats}석</span>
          )}
          {hasRecentUpdate && (
            <span className="mt-0.5 block text-[11px] text-forest-600">최근 업데이트</span>
          )}
          <span className="text-[11px] text-dotori-500" suppressHydrationWarning>{formatRelativeTime(facility.lastSyncedAt)}</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      role="article"
      aria-label={facility.name}
      {...motionCardProps}
      className={cn(
        'group relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md',
        'motion-safe:animate-in motion-safe:fade-in duration-300',
        statusColor[facility.status],
        facility.isPremium ? 'ring-1 ring-dotori-200' : ''
      )}
    >
      {facility.isPremium ? (
        <span className="absolute right-3 top-3 rounded-full bg-dotori-100 px-2 py-0.5 text-[11px] text-dotori-700">
          파트너
        </span>
      ) : null}
      <div className="flex items-center justify-between">
        <span className="text-[17px] font-semibold">{facility.name}</span>
        <Badge color={facilityTypeBadgeColor(facility.type)}>{facility.type}</Badge>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <span className="block text-xl font-bold">{facility.capacity.total}</span>
          <span className="text-[13px] text-dotori-500">정원</span>
        </div>
        <div>
          <span
            className={cn(
              'block text-xl font-bold',
              facility.capacity.current >= facility.capacity.total
                ? 'text-danger'
                : 'text-dotori-900'
            )}
          >
            {facility.capacity.current}
          </span>
          <span className="text-[13px] text-dotori-500">현원</span>
        </div>
        <div>
          <span
            className={cn(
              'block text-xl font-bold',
              facility.capacity.waiting > 0 ? 'text-warning' : 'text-dotori-900'
            )}
          >
            {facility.capacity.waiting}
          </span>
          <span className="text-[13px] text-dotori-500">대기</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {sources ? (
          <div className="flex flex-wrap gap-1">
            {sources.map((s, i) => (
              <SourceChip key={`${s.source}-${i}`} {...s} />
            ))}
          </div>
        ) : (
          <SourceChip source="아이사랑" updatedAt={facility.lastSyncedAt} freshness="realtime" />
        )}
        <div className="flex gap-2">
					<Button plain onClick={() => onAction?.('register_interest', facility.id)} aria-label="관심 시설 추가/제거">
						관심등록
					</Button>
          {facility.status !== 'full' && (
            <Button color="dotori" onClick={() => onAction?.('apply_waiting', facility.id)} aria-label="대기 신청">
              {facility.status === 'available' ? '입소신청' : '대기신청'}
            </Button>
          )}
        </div>
        </div>
      </motion.div>
    )
})
