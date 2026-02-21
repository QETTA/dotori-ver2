/* Error monitoring abstraction layer
 * Swap implementation between Sentry, Bugsnag, or custom
 */

type Severity = 'fatal' | 'error' | 'warning' | 'info'

interface ErrorContext {
  tags?: Record<string, string>
  extra?: Record<string, unknown>
  user?: { id: string; email?: string; plan?: string }
  level?: Severity
}

interface Breadcrumb {
  category: string
  message: string
  level: Severity
  timestamp: number
}

const breadcrumbs: Breadcrumb[] = []
const MAX_BREADCRUMBS = 50

/* ─── Public API ─── */

export function initErrorMonitoring() {
  if (typeof window === 'undefined') return

  // Global error handler
  window.addEventListener('error', (event) => {
    captureException(event.error || new Error(event.message), {
      tags: { type: 'uncaught' },
      extra: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    })
  })

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureException(event.reason || new Error('Unhandled Promise Rejection'), {
      tags: { type: 'unhandled_rejection' },
    })
  })

  addBreadcrumb('monitoring', 'Error monitoring initialized', 'info')
}

export function captureException(error: Error | unknown, context?: ErrorContext) {
  const err = error instanceof Error ? error : new Error(String(error))

  if (process.env.NODE_ENV === 'development') {
    console.error('[ErrorMonitor]', err, context)
    return
  }

  // Production: send to error tracking service
  const payload = {
    message: err.message,
    stack: err.stack,
    level: context?.level || 'error',
    tags: context?.tags || {},
    extra: context?.extra || {},
    user: context?.user,
    breadcrumbs: [...breadcrumbs],
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  }

  // Send to your error reporting endpoint
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Silently fail — don't cause cascading errors
  })
}

export function captureMessage(message: string, level: Severity = 'info') {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ErrorMonitor:${level}]`, message)
    return
  }

  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, level, timestamp: Date.now() }),
  }).catch(() => {})
}

export function addBreadcrumb(category: string, message: string, level: Severity = 'info') {
  breadcrumbs.push({ category, message, level, timestamp: Date.now() })
  if (breadcrumbs.length > MAX_BREADCRUMBS) breadcrumbs.shift()
}

export function setUser(user: { id: string; email?: string; plan?: string } | null) {
  addBreadcrumb('auth', user ? `User set: ${user.id}` : 'User cleared', 'info')
}

/* ─── React Error Boundary Helper ─── */
export function reportComponentError(error: Error, componentStack: string) {
  captureException(error, {
    tags: { type: 'react_boundary' },
    extra: { componentStack },
    level: 'error',
  })
}

/* ─── API Error Helper ─── */
export function reportApiError(url: string, status: number, _body?: unknown) {
  captureMessage(`API Error: ${status} ${url}`, status >= 500 ? 'error' : 'warning')
  addBreadcrumb('api', `${status} ${url}`, status >= 500 ? 'error' : 'warning')
}

/* ─── Performance Helper ─── */
export function reportSlowOperation(name: string, durationMs: number, threshold = 3000) {
  if (durationMs > threshold) {
    captureMessage(`Slow operation: ${name} took ${durationMs}ms`, 'warning')
  }
}
