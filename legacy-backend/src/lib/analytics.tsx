'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

/* ─── Types ─── */
type EventName =
  | 'page_view'
  | 'facility_view'
  | 'facility_favorite'
  | 'facility_compare'
  | 'chat_message'
  | 'widget_event'
  | 'simulation_run'
  | 'alert_subscribe'
  | 'consult_start'
  | 'consult_payment'
  | 'plan_upgrade'
  | 'onboarding_complete'
  | 'search'
  | 'cta_click'

interface EventParams {
  [key: string]: string | number | boolean | undefined
}

/* ─── GA4 Script ─── */
declare global {
  // eslint-disable-next-line no-var
  var gtag: ((...args: unknown[]) => void) | undefined
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

/* ─── Core Functions ─── */
export function initAnalytics() {
  if (!GA_ID || typeof window === 'undefined') return

  window.dataLayer = window.dataLayer || []
  window.gtag = (...args: unknown[]) => {
    window.dataLayer.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, {
    page_path: window.location.pathname,
    send_page_view: false, // we handle this manually
  })
}

export function trackEvent(name: EventName, params?: EventParams) {
  if (!GA_ID || typeof window === 'undefined') return
  window.gtag('event', name, {
    ...params,
    timestamp: Date.now(),
  })
}

export function trackPageView(path: string) {
  if (!GA_ID || typeof window === 'undefined') return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: document.title,
  })
}

export function setUserProperties(props: Record<string, string | number>) {
  if (!GA_ID || typeof window === 'undefined') return
  window.gtag('set', 'user_properties', props)
}

/* ─── Consent ─── */
export function updateConsent(granted: boolean) {
  if (!GA_ID || typeof window === 'undefined') return
  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
  })
}

/* ─── Domain Events ─── */
export const analytics = {
  facilityView: (id: string, name: string, probability: number) =>
    trackEvent('facility_view', { facility_id: id, facility_name: name, probability }),

  facilityFavorite: (id: string, action: 'add' | 'remove') =>
    trackEvent('facility_favorite', { facility_id: id, action }),

  facilityCompare: (ids: string[]) =>
    trackEvent('facility_compare', { facility_ids: ids.join(','), count: ids.length }),

  chatMessage: (type: 'user' | 'ai') => trackEvent('chat_message', { message_type: type }),

  simulationRun: (strategies: number, delta: number) =>
    trackEvent('simulation_run', { strategy_count: strategies, probability_delta: delta }),

  alertSubscribe: (facilityId: string, channel: string) =>
    trackEvent('alert_subscribe', { facility_id: facilityId, channel }),

  consultStart: (type: 'ai' | 'expert') => trackEvent('consult_start', { consult_type: type }),

  consultPayment: (plan: string, amount: number) => trackEvent('consult_payment', { plan, amount }),

  planUpgrade: (from: string, to: string) => trackEvent('plan_upgrade', { from_plan: from, to_plan: to }),

  onboardingComplete: (steps: number) => trackEvent('onboarding_complete', { steps_completed: steps }),

  search: (query: string, results: number) => trackEvent('search', { search_query: query, result_count: results }),

  ctaClick: (location: string, label: string) => trackEvent('cta_click', { cta_location: location, cta_label: label }),
}

/* ─── Auto Page View Hook ─── */
export function usePageTracking() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '')
    trackPageView(url)
  }, [pathname, searchParams])
}

/* ─── GA Script Component ─── */
export function AnalyticsScript() {
  if (process.env.NEXT_PUBLIC_E2E_DISABLE_EXTERNAL_SDK === '1') return null
  if (!GA_ID) return null

  return (
    <AnalyticsHeadScripts gaId={GA_ID} />
  )
}

function AnalyticsHeadScripts({ gaId }: { gaId: string }) {
  useEffect(() => {
    if (document.getElementById('dotori-ga')) return

    const external = document.createElement('script')
    external.id = 'dotori-ga'
    external.async = true
    external.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.appendChild(external)

    if (!document.getElementById('dotori-ga-inline')) {
      const inline = document.createElement('script')
      inline.id = 'dotori-ga-inline'
      inline.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(...arguments)}gtag('js',new Date());gtag('consent','default',{analytics_storage:'denied'});gtag('config','${gaId}',{send_page_view:false});`
      document.head.appendChild(inline)
    }
  }, [gaId])

  return null
}
