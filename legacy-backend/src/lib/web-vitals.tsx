'use client'

import { useEffect } from 'react'

/**
 * Core Web Vitals monitoring
 * Tracks: LCP, FID, CLS, FCP, TTFB, INP
 * Reports to analytics endpoint
 */

type MetricName = 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB'

interface WebVitalMetric {
  name: MetricName
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
}

const THRESHOLDS: Record<MetricName, [number, number]> = {
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  FID: [100, 300],
  INP: [200, 500],
  LCP: [2500, 4000],
  TTFB: [800, 1800],
}

function getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const [good, poor] = THRESHOLDS[name]
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

function reportMetric(metric: WebVitalMetric) {
  // Console in development
  if (process.env.NODE_ENV === 'development') {
    const color =
      metric.rating === 'good'
        ? 'var(--palette-emerald-500)'
        : metric.rating === 'poor'
          ? 'var(--palette-red-500)'
          : 'var(--palette-amber-400)'
    console.log(
      `%c[WebVital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
      `color: ${color}; font-weight: bold;`,
    )
  }

  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.rating,
      non_interaction: true,
    })
  }

  // Send to custom endpoint
  if (process.env.NODE_ENV === 'production') {
    const url = '/api/analytics/vitals'
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      page: window.location.pathname,
      timestamp: Date.now(),
    })

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body)
    } else {
      fetch(url, { method: 'POST', body, keepalive: true }).catch(() => {})
    }
  }
}

/**
 * Hook to initialize Web Vitals monitoring
 * Usage: place <WebVitals /> in root layout
 */
export function WebVitals() {
  useEffect(() => {
    // Dynamic import to avoid increasing bundle
    import('web-vitals')
      .then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
        const handler = (metric: any) => {
          reportMetric({
            name: metric.name,
            value: metric.value,
            rating: getRating(metric.name, metric.value),
            delta: metric.delta,
            id: metric.id,
            navigationType: metric.navigationType,
          })
        }

        onCLS(handler)
        onFCP(handler)
        onINP(handler)
        onLCP(handler)
        onTTFB(handler)
      })
      .catch(() => {
        // web-vitals not installed, use Performance Observer fallback
        if (typeof PerformanceObserver !== 'undefined') {
          try {
            // LCP
            new PerformanceObserver((list) => {
              const entries = list.getEntries()
              const last = entries[entries.length - 1] as any
              if (last)
                reportMetric({
                  name: 'LCP',
                  value: last.startTime,
                  rating: getRating('LCP', last.startTime),
                  delta: 0,
                  id: 'lcp',
                  navigationType: 'navigate',
                })
            }).observe({ type: 'largest-contentful-paint', buffered: true })

            // FCP
            new PerformanceObserver((list) => {
              const entry = list.getEntries().find((e) => e.name === 'first-contentful-paint')
              if (entry)
                reportMetric({
                  name: 'FCP',
                  value: entry.startTime,
                  rating: getRating('FCP', entry.startTime),
                  delta: 0,
                  id: 'fcp',
                  navigationType: 'navigate',
                })
            }).observe({ type: 'paint', buffered: true })

            // CLS
            let clsValue = 0
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries() as any[]) {
                if (!entry.hadRecentInput) clsValue += entry.value
              }
              reportMetric({
                name: 'CLS',
                value: clsValue,
                rating: getRating('CLS', clsValue),
                delta: 0,
                id: 'cls',
                navigationType: 'navigate',
              })
            }).observe({ type: 'layout-shift', buffered: true })
          } catch {
            /* PerformanceObserver not supported */
          }
        }
      })
  }, [])

  return null
}

/* Window.gtag already declared in analytics.tsx */
