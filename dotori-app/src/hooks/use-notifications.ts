'use client'

import { useMemo } from 'react'
import { useApi } from './use-api'
import { formatRelativeTime } from '@/lib/utils'

/** Matches the shape returned by GET /api/notifications (Alert-based) */
interface ApiAlert {
  id: string
  type: string
  facility: {
    _id: string
    name: string
    type: string
    status: string
    address: string
    capacity: { total: number; current: number; waiting: number }
  } | null
  channels: string[]
  triggeredAt: string
  createdAt: string
}

export interface NotificationView {
  id: string
  category: string
  title: string
  body: string
  time: string
  read: boolean
  facilityId?: string
}

const TYPE_LABELS: Record<string, string> = {
  vacancy: '빈자리',
  document: '서류',
  community: '커뮤니티',
  alert: '빈자리',
  waitlist: '대기',
}

function generateMessage(type: string, facilityName: string): { title: string; body: string } {
  switch (type) {
    case 'vacancy':
      return {
        title: `${facilityName} TO 발생`,
        body: `${facilityName}에 빈자리가 생겼어요. 빠르게 확인해보세요!`,
      }
    case 'document':
      return {
        title: `${facilityName} 서류 제출 필요`,
        body: `${facilityName} 관련 서류를 확인해주세요.`,
      }
    case 'waitlist':
      return {
        title: `${facilityName} 대기 순위 변동`,
        body: `${facilityName} 대기 순위가 변경되었어요.`,
      }
    default:
      return {
        title: `${facilityName} 알림`,
        body: `${facilityName}에서 새로운 소식이 있어요.`,
      }
  }
}

function toNotificationView(alert: ApiAlert): NotificationView {
  const facilityName = alert.facility?.name ?? '시설'
  const { title, body } = generateMessage(alert.type, facilityName)

  return {
    id: alert.id,
    category: TYPE_LABELS[alert.type] ?? alert.type,
    title,
    body,
    time: formatRelativeTime(alert.triggeredAt),
    read: false,
    facilityId: alert.facility?._id,
  }
}

export function useNotifications() {
  const { data, isLoading, error, refetch } = useApi<ApiAlert[]>('/api/notifications')

  const notifications = useMemo(() => (data ?? []).map(toNotificationView), [data])

  return { notifications, isLoading, error, refetch }
}
