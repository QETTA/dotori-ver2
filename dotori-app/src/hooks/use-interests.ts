'use client'

import { useMemo } from 'react'
import { useApi } from './use-api'

/** Matches the shape returned by GET /api/users/me/interests */
interface ApiFacility {
  id: string
  name: string
  type: string
  status: string
  address: string
  capacity: {
    total: number
    current: number
    waiting: number
  }
}

export interface InterestView {
  id: string
  name: string
  type: string
  address: string
  status: 'available' | 'full'
  capacity: number
  current: number
  vacancy: number
}

function toInterestView(facility: ApiFacility): InterestView {
  const hasVacancy = facility.capacity.total > facility.capacity.current

  return {
    id: facility.id,
    name: facility.name,
    type: facility.type,
    address: facility.address,
    status: hasVacancy ? 'available' : 'full',
    capacity: facility.capacity.total,
    current: facility.capacity.current,
    vacancy: Math.max(0, facility.capacity.total - facility.capacity.current),
  }
}

export function useInterests() {
  const { data, isLoading, error, refetch } = useApi<ApiFacility[]>(
    '/api/users/me/interests',
  )

  const interests = useMemo(() => (data ?? []).map(toInterestView), [data])

  return { interests, isLoading, error, refetch }
}
