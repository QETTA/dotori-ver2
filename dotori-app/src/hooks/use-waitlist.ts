'use client'

import { useMemo } from 'react'
import { useApi } from './use-api'

/** Populated facility DTO from /api/waitlist aggregate $lookup */
interface ApiFacilityRef {
  id: string
  name: string
  type: string
  status?: string
  address?: string
}

/** Matches the shape returned by GET /api/waitlist */
interface ApiWaitlistEntry {
  _id: string
  facilityId: ApiFacilityRef | string | null
  position: number
  status: string
  appliedAt: string
  childName?: string
}

export interface WaitlistView {
  id: string
  facilityName: string
  rank: number
  appliedAt: string
  status: 'waiting' | 'accepted' | 'cancelled'
  type: string
  estimatedDate?: string
}

const VALID_STATUSES = new Set(['waiting', 'accepted', 'cancelled'])

function toWaitlistView(entry: ApiWaitlistEntry): WaitlistView {
  const facility =
    typeof entry.facilityId === 'object' && entry.facilityId !== null
      ? entry.facilityId
      : null

  const status = VALID_STATUSES.has(entry.status) ? entry.status : 'waiting'

  // Estimate entry month based on rank (rough: 1~3 months per position)
  let estimatedDate: string | undefined
  if (entry.position <= 3) {
    const now = new Date()
    const estMonth = new Date(now.getFullYear(), now.getMonth() + entry.position, 1)
    const monthNames = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    estimatedDate = `${estMonth.getFullYear()}년 ${monthNames[estMonth.getMonth()]}월 예상`
  }

  return {
    id: entry._id,
    facilityName: facility?.name ?? '시설명 없음',
    rank: entry.position,
    appliedAt: entry.appliedAt
      ? new Date(entry.appliedAt).toISOString().slice(0, 10)
      : '',
    status: status as WaitlistView['status'],
    type: facility?.type ?? '',
    estimatedDate,
  }
}

export function useWaitlist() {
  const { data, isLoading, error, refetch } = useApi<ApiWaitlistEntry[]>('/api/waitlist')

  const waitlist = useMemo(() => (data ?? []).map(toWaitlistView), [data])

  return { waitlist, isLoading, error, refetch }
}
