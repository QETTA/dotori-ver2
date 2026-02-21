const SESSION_COOKIE_NAMES = ['__Secure-next-auth.session-token', 'next-auth.session-token'] as const
const BLOCKED_SESSION_COOKIE_VALUES = new Set(['', 'codex-local-dev'])

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null
  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))

  if (!cookie) return null
  const value = cookie.slice(name.length + 1).trim()
  if (!value) return null

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function hasUsableSessionCookie(): boolean {
  for (const name of SESSION_COOKIE_NAMES) {
    const value = getCookieValue(name)
    if (!value) continue
    if (BLOCKED_SESSION_COOKIE_VALUES.has(value)) return false
    return true
  }
  return false
}
