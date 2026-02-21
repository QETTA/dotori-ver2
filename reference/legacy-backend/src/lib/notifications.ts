/**
 * Server-Sent Events notification helpers
 * Supports Redis List queue for multi-server deployments.
 * Falls back to in-memory Map when Redis is unavailable.
 */
import { isRedisAvailable, redisLPush, redisRPop } from '@/lib/redis'

// In-memory subscriber map (single-server fallback)
export const subscribers = new Map<string, Set<ReadableStreamDefaultController>>()

interface NotificationPayload {
  type: string
  title: string
  body: string
  facilityId?: string
  facilityName?: string
}

function buildMessage(notification: NotificationPayload): string {
  return JSON.stringify({
    ...notification,
    id: `notif_${Date.now()}`,
    timestamp: new Date().toISOString(),
  })
}

/* ─── Deliver to local in-memory subscribers ─── */
export function deliverLocal(userId: string, data: string): number {
  const encoder = new TextEncoder()
  const controllers = subscribers.get(userId)
  if (!controllers) return 0

  let sent = 0
  for (const controller of controllers) {
    try {
      controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      sent++
    } catch {
      controllers.delete(controller)
    }
  }
  return sent
}

/* ─── Push notification to a user ─── */
export async function pushNotification(userId: string, notification: NotificationPayload): Promise<number> {
  const data = buildMessage(notification)

  // Always deliver locally for immediate SSE clients on this server
  const localSent = deliverLocal(userId, data)

  // Also push to Redis queue for other servers to pick up
  if (isRedisAvailable()) {
    try {
      await redisLPush(`notif:${userId}`, data)
    } catch (err) {
      console.error('[Notifications] Redis LPUSH error:', err)
    }
  }

  return localSent
}

/* ─── Poll Redis queue for messages (called from SSE stream route) ─── */
export async function pollRedisQueue(userId: string): Promise<string | null> {
  if (!isRedisAvailable()) return null
  try {
    return await redisRPop(`notif:${userId}`)
  } catch {
    return null
  }
}

/* ─── Broadcast to all subscribers ─── */
export async function broadcastNotification(notification: NotificationPayload): Promise<number> {
  let total = 0
  for (const [userId] of subscribers) {
    total += await pushNotification(userId, notification)
  }
  return total
}
