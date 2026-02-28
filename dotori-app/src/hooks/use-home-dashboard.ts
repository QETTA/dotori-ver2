'use client'

import { useMemo } from 'react'
import { useApi } from './use-api'

interface ApiHomeFacility {
  id: string
  name: string
  type: string
  status: string
  address: string
  capacity?: {
    total: number
    current: number
    waiting: number
  }
}

interface ApiHomePost {
  id: string
  content: string
  category: string
  likes: number
  commentCount: number
  createdAt: string
}

interface ApiHomeData {
  user: {
    id: string
    nickname: string
    region: { sido: string; sigungu: string; dong?: string }
    onboardingCompleted: boolean
    interests: string[]
    children: unknown[]
    plan: string
    gpsVerified: boolean
  } | null
  nearbyFacilities: ApiHomeFacility[]
  interestFacilities: ApiHomeFacility[]
  hotPosts: ApiHomePost[]
  alertCount: number
  waitlistCount: number
  bestWaitlistPosition?: number
  waitlistFacilityName?: string
  documentCount?: number
  sources: Record<string, { name: string; updatedAt: string }>
  totalFacilities?: number
}

export type FunnelStep = 0 | 1 | 2 | 3

export interface HomeDashboard {
  nickname: string
  totalFacilities: number
  interestCount: number
  waitlistCount: number
  alertCount: number
  bestWaitlistPosition?: number
  waitlistFacilityName?: string
  nearbyFacilities: ApiHomeFacility[]
  hotPosts: ApiHomePost[]
  funnelStep: FunnelStep
}

export function computeFunnelStep(data: ApiHomeData): FunnelStep {
  const interests = data.user?.interests?.length ?? 0
  const waitlist = data.waitlistCount ?? 0
  const documents = data.documentCount ?? 0
  // Step 3: has documents in progress (signing phase)
  if (documents > 0 && waitlist > 0) return 3
  // Step 2: on waitlist
  if (waitlist > 0) return 2
  // Step 1: has interests but no waitlist
  if (interests > 0) return 1
  // Step 0: fresh user
  return 0
}

export function toDashboard(data: ApiHomeData): HomeDashboard {
  return {
    nickname: data.user?.nickname ?? '사용자',
    totalFacilities: data.totalFacilities ?? 20027,
    interestCount: data.user?.interests?.length ?? 0,
    waitlistCount: data.waitlistCount,
    alertCount: data.alertCount,
    bestWaitlistPosition: data.bestWaitlistPosition,
    waitlistFacilityName: data.waitlistFacilityName,
    nearbyFacilities: data.nearbyFacilities,
    hotPosts: data.hotPosts,
    funnelStep: computeFunnelStep(data),
  }
}

export function useHomeDashboard() {
  const { data, isLoading, error, refetch } = useApi<ApiHomeData>('/api/home')

  const dashboard = useMemo(
    () => (data ? toDashboard(data) : null),
    [data],
  )

  return { dashboard, isLoading, error, refetch }
}
