import { logAudit } from '@/lib/audit'
import prisma from '@/lib/db/prisma'
import { pushNotification } from '@/lib/notifications'

/**
 * Process a new TOEvent: find interested users (via Favorite + WaitlistEntry)
 * and create Alert records + push SSE notifications.
 */
export async function processNewTOEvent(toEventId: string) {
  const toEvent = await prisma.tOEvent.findUnique({
    where: { id: toEventId },
    include: { facility: { select: { id: true, name: true } } },
  })
  if (!toEvent) return { alertsCreated: 0 }

  // Find users interested in this facility:
  // 1. Users who favorited this facility
  // 2. Users with active waitlist entries for this facility + ageGroup
  const [favorites, waitlistEntries] = await Promise.all([
    prisma.favorite.findMany({
      where: { facilityId: toEvent.facilityId },
      select: { userId: true },
    }),
    prisma.waitlistEntry.findMany({
      where: {
        facilityId: toEvent.facilityId,
        ageGroup: toEvent.ageGroup,
        status: 'waiting',
      },
      select: { userId: true },
    }),
  ])

  // Deduplicate user IDs
  const userIds = [...new Set([...favorites.map((f) => f.userId), ...waitlistEntries.map((w) => w.userId)])]

  if (userIds.length === 0) return { alertsCreated: 0 }

  const title = 'TO 발생!'
  const body = `${toEvent.facility.name} ${toEvent.ageGroup} ${toEvent.slots}자리 TO가 발생했습니다.`

  // Create alerts in batch
  await prisma.alert.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: 'to',
      title,
      body,
      facilityId: toEvent.facilityId,
      actionUrl: `/facility/${toEvent.facilityId}`,
    })),
  })

  // Push SSE + Web Push notifications to connected users
  for (const userId of userIds) {
    await pushNotification(userId, {
      type: 'to',
      title,
      body,
      facilityId: toEvent.facilityId,
      facilityName: toEvent.facility.name,
    })
  }

  // Send Web Push to offline users
  try {
    const { sendPushToUser } = await import('@/lib/push')
    await Promise.allSettled(
      userIds.map((userId) =>
        sendPushToUser(userId, {
          title,
          body,
          url: `/facility/${toEvent.facilityId}`,
        }),
      ),
    )
  } catch {
    /* web-push not configured — skip */
  }

  await logAudit({
    action: 'to_alert_fanout',
    entity: 'TOEvent',
    entityId: toEventId,
    metadata: { facilityId: toEvent.facilityId, alertsCreated: userIds.length, slots: toEvent.slots },
  })

  return { alertsCreated: userIds.length }
}
