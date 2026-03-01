'use client'

import { motion } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'

import { DS_SURFACE } from '@/lib/design-system/page-tokens'
import { stagger } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Facility } from '@/types/dotori'

import {
  FacilityCapacitySection,
  type FacilityKeyStat,
} from './FacilityCapacitySection'
import { FacilityContactMapSections } from './FacilityContactSection'
import { FacilityOperatingSection } from './FacilityOperatingSection'

type FacilityDetailClientProps = {
  facility: Facility
}

async function copyToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  if (typeof document === 'undefined') return
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

export function FacilityDetailClient({ facility }: FacilityDetailClientProps) {
  const [copyingPhone, setCopyingPhone] = useState(false)
  const [copyingAddress, setCopyingAddress] = useState(false)

  const sectionDividerClassName =
    cn(
      DS_SURFACE.sunken,
      'border-b border-dotori-100 py-6 dark:border-dotori-800 last:border-b-0',
    )

  const kakaoMapUrl = useMemo(() => {
    if (facility.kakaoPlaceUrl) return facility.kakaoPlaceUrl
    return `https://map.kakao.com/link/search/${encodeURIComponent(facility.name)}`
  }, [facility.kakaoPlaceUrl, facility.name])

  const websiteUrl = useMemo(
    () => facility.website ?? facility.homepage ?? null,
    [facility.homepage, facility.website],
  )

  const occupancyRate = useMemo(() => {
    const total = facility.capacity.total
    if (total <= 0) return 0
    return Math.round((facility.capacity.current / total) * 100)
  }, [facility.capacity.current, facility.capacity.total])

  const keyStats = useMemo<FacilityKeyStat[]>(() => {
    const stats: FacilityKeyStat[] = []
    if (typeof facility.establishmentYear === 'number') {
      stats.push({ label: '설립연도', value: `${facility.establishmentYear}년` })
    }
    if (typeof facility.roomCount === 'number') {
      stats.push({ label: '반 수', value: `${facility.roomCount}개` })
    }
    if (typeof facility.teacherCount === 'number') {
      stats.push({ label: '교사 수', value: `${facility.teacherCount}명` })
    }
    return stats
  }, [facility.establishmentYear, facility.roomCount, facility.teacherCount])

  const handleCopyPhone = useCallback(async () => {
    if (!facility.phone) return
    setCopyingPhone(true)
    try {
      await copyToClipboard(facility.phone)
    } finally {
      window.setTimeout(() => setCopyingPhone(false), 700)
    }
  }, [facility.phone])

  const handleCopyAddress = useCallback(async () => {
    if (!facility.address) return
    setCopyingAddress(true)
    try {
      await copyToClipboard(facility.address)
    } finally {
      window.setTimeout(() => setCopyingAddress(false), 700)
    }
  }, [facility.address])

  const hasMapLocation = Number.isFinite(facility.lat) && Number.isFinite(facility.lng)

  return (
    <motion.div {...stagger.container}>
      <motion.div {...stagger.item} className={sectionDividerClassName}>
        <FacilityOperatingSection
          operatingHours={facility.operatingHours}
          establishmentYear={facility.establishmentYear}
          roomCount={facility.roomCount}
          teacherCount={facility.teacherCount}
        />
      </motion.div>

      <motion.div {...stagger.item} className={sectionDividerClassName}>
        <FacilityCapacitySection
          occupancyRate={occupancyRate}
          currentCapacity={facility.capacity.current}
          totalCapacity={facility.capacity.total}
          waitingCapacity={facility.capacity.waiting}
          keyStats={keyStats}
        />
      </motion.div>

      <motion.div {...stagger.item}>
        <FacilityContactMapSections
          phone={facility.phone}
          address={facility.address}
          kakaoMapUrl={kakaoMapUrl}
          websiteUrl={websiteUrl}
          copyablePhone={facility.phone}
          copyingPhone={copyingPhone}
          onCopyPhone={handleCopyPhone}
          copyableAddress={facility.address}
          copyingAddress={copyingAddress}
          onCopyAddress={handleCopyAddress}
          hasMapLocation={hasMapLocation}
          facilityId={facility.id}
          facilityName={facility.name}
          lat={facility.lat}
          lng={facility.lng}
          status={facility.status}
        />
      </motion.div>
    </motion.div>
  )
}
