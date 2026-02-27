'use client'

import { DS_STATUS } from '@/lib/design-system/tokens'
import type { FacilityStatus } from '@/types/dotori'

interface ToBadgeProps {
  status: FacilityStatus
  vacancy?: number
  compact?: boolean
  className?: string
}

const ICON: Record<FacilityStatus, string> = {
  available: '\u{1F7E2}',
  waiting: '\u26A0\uFE0F',
  full: '\u{1F534}',
}

export function ToBadge({ status, vacancy, compact, className = '' }: ToBadgeProps) {
  const token = DS_STATUS[status]

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <span className={`h-2 w-2 rounded-full ${token.dot}`} />
        {vacancy != null && (
          <span className="text-caption font-medium tabular-nums">{vacancy}</span>
        )}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-caption font-semibold ${token.pill} ${className}`}
    >
      <span aria-hidden>{ICON[status]}</span>
      <span>{token.label}</span>
      {vacancy != null && (
        <span className="tabular-nums">({vacancy})</span>
      )}
    </span>
  )
}
