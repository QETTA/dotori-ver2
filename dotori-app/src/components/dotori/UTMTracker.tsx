'use client'

import { useUTMTracking } from '@/hooks/use-utm-tracking'

/** Silent client component that captures UTM params on mount. */
export function UTMTracker() {
  useUTMTracking()
  return null
}
