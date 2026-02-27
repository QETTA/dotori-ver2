'use client'

import Link from 'next/link'
import { Badge } from '@/components/catalyst/badge'

interface FacilityTagLinkProps {
  facilityId: string
  facilityName: string
  className?: string
}

export function FacilityTagLink({ facilityId, facilityName, className = '' }: FacilityTagLinkProps) {
  return (
    <Link
      href={`/facility/${facilityId}`}
      className={`inline-block ${className}`}
    >
      <Badge color="dotori" className="cursor-pointer transition-opacity hover:opacity-80">
        {facilityName}
      </Badge>
    </Link>
  )
}
