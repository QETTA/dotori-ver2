/**
 * Web Push (VAPID) — wrapper around web-push library
 * Requires: VAPID_PRIVATE_KEY, NEXT_PUBLIC_VAPID_KEY, VAPID_EMAIL env vars
 */
import prisma from '@/lib/db/prisma'

interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

let webPush: typeof import('web-push') | null = null

async function getWebPush() {
  if (webPush) return webPush
  webPush = await import('web-push')

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidEmail = process.env.VAPID_EMAIL ?? 'mailto:admin@dotori.ai'

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error('VAPID keys not configured (NEXT_PUBLIC_VAPID_KEY, VAPID_PRIVATE_KEY)')
  }

  webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
  return webPush
}

/**
 * Send push notification to a single subscription.
 * Returns true on success, false if subscription expired (auto-cleaned).
 */
export async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload,
): Promise<boolean> {
  try {
    const wp = await getWebPush()
    await wp.sendNotification(subscription, JSON.stringify(payload), { TTL: 86400 })
    return true
  } catch (err: any) {
    // 410 Gone or 404 — subscription expired
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      await prisma.deviceToken.deleteMany({ where: { endpoint: subscription.endpoint } }).catch(() => {})
      return false
    }
    console.error('[Push] sendNotification error:', err)
    return false
  }
}

/**
 * Send push notification to all devices of a user.
 * Automatically cleans up expired subscriptions.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const devices = await prisma.deviceToken.findMany({
    where: { userId },
    select: { endpoint: true, p256dh: true, auth: true },
  })

  if (devices.length === 0) return 0

  let sent = 0
  await Promise.allSettled(
    devices.map(async (device: { endpoint: string; p256dh: string; auth: string }) => {
      const ok = await sendPush(
        { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
        payload,
      )
      if (ok) sent++
    }),
  )

  return sent
}
