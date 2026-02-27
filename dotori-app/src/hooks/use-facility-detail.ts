'use client'

import { useMemo } from 'react'
import { useApi } from './use-api'
import type { Facility, FacilityStatus, FacilityType, FacilityCategory, TOConfidenceLevel } from '@/types/dotori'

interface ApiFacilityDetail {
  id: string
  name: string
  type: string
  facilityCategory?: string
  status: string
  address: string
  lat: number
  lng: number
  phone?: string
  capacity: { total: number; current: number; waiting: number }
  ageClasses?: { className: string; capacity: number; current: number; waiting: number }[]
  features: string[]
  rating: number
  reviewCount: number
  premium?: Facility['premium']
  premiumProfile?: Facility['premiumProfile']
  roomCount?: number
  teacherCount?: number
  establishmentYear?: number
  homepage?: string
  images?: string[]
  region?: { sido: string; sigungu: string; dong: string }
  programs?: string[]
  evaluationGrade?: string | null
  operatingHours?: { open: string; close: string; extendedCare: boolean }
  lastSyncedAt: string
  toScore?: number
  toConfidence?: string
  createdAt?: string
  updatedAt?: string
}

function toFacilityView(data: ApiFacilityDetail): Facility {
  return {
    ...data,
    type: data.type as FacilityType,
    facilityCategory: data.facilityCategory as FacilityCategory | undefined,
    status: data.status as FacilityStatus,
    toConfidence: data.toConfidence as TOConfidenceLevel | undefined,
  }
}

export function useFacilityDetail(id: string | null) {
  const { data, isLoading, error, refetch } = useApi<ApiFacilityDetail>(
    id ? `/api/facilities/${id}` : null,
  )

  const facility = useMemo(
    () => (data ? toFacilityView(data) : null),
    [data],
  )

  return { facility, isLoading, error, refetch }
}
