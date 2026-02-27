/**
 * Timing-safe CRON_SECRET verification with audit logging.
 *
 * Prevents timing attacks on Bearer token comparison.
 * All cron/admin routes that accept CRON_SECRET should use this module.
 */
import crypto from 'crypto'
import { log } from '@/lib/logger'

export function verifyCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const authorization = req.headers.get('authorization')
  if (!authorization) return false

  const prefix = 'Bearer '
  if (!authorization.startsWith(prefix)) return false

  const token = authorization.slice(prefix.length)

  // Pad to same length before comparison to avoid leaking length info
  const maxLen = Math.max(token.length, secret.length)
  const tokenPadded = token.padEnd(maxLen, '\0')
  const secretPadded = secret.padEnd(maxLen, '\0')

  const tokenBuffer = Buffer.from(tokenPadded, 'utf-8')
  const secretBuffer = Buffer.from(secretPadded, 'utf-8')

  // Length must also match (padding ensures timingSafeEqual won't throw)
  const valid = token.length === secret.length && crypto.timingSafeEqual(tokenBuffer, secretBuffer)

  // Audit log every cron invocation attempt
  const url = new URL(req.url)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  log.info('Cron auth attempt', {
    path: url.pathname,
    success: valid,
    ip,
    timestamp: new Date().toISOString(),
  })

  if (!valid) {
    log.warn('Cron auth FAILED', { path: url.pathname, ip })
  }

  return valid
}
