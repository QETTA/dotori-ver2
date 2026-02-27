'use client'

import { useEffect } from 'react'
import { parseUTM, stripUTM } from '@/lib/utm'

/**
 * useUTMTracking — Captures UTM parameters from the current URL on mount.
 *
 * - Parses UTM params from the URL
 * - Stores them in sessionStorage for attribution
 * - Fires a GA4-compatible event via gtag (if available)
 * - Cleans UTM params from the URL bar (cosmetic, no navigation)
 */
export function useUTMTracking() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = parseUTM(window.location.search
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams())

    if (!params) return

    // Store in sessionStorage for attribution during session
    try {
      sessionStorage.setItem('dotori_utm', JSON.stringify(params))
    } catch {
      // sessionStorage unavailable (private browsing, etc.)
    }

    // Fire GA4 event if gtag is available
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'utm_captured', {
        utm_source: params.source,
        utm_medium: params.medium,
        utm_campaign: params.campaign,
        utm_content: params.content ?? '',
        utm_term: params.term ?? '',
      })
    }

    // Clean UTM from URL bar (cosmetic only, no reload)
    try {
      const clean = stripUTM(window.location.href)
      if (clean !== window.location.href) {
        window.history.replaceState(null, '', clean)
      }
    } catch {
      // URL parsing may fail in edge cases
    }
  }, [])
}

/**
 * Get stored UTM params from session (for attribution in API calls).
 */
export function getStoredUTM(): Record<string, string> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem('dotori_utm')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
