'use client'

import Link from 'next/link'
import { Badge } from '@/components/catalyst/badge'
import { DS_TEXT } from '@/lib/design-system/tokens'
import { cn } from '@/lib/utils'

interface FacilityTagLinkProps {
  facilityId: string
  facilityName: string
  className?: string
}

export function FacilityTagLink({ facilityId, facilityName, className = '' }: FacilityTagLinkProps) {
  return (
    <Link
      href={`/facility/${facilityId}`}
      className={cn('inline-block', DS_TEXT.secondary, className)}
    >
      <Badge color="dotori" className="cursor-pointer transition-opacity hover:opacity-80">
        {facilityName}
      </Badge>
    </Link>
  )
}
