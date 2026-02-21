import prisma from '@/lib/db/prisma'
import { pushNotification } from '@/lib/notifications'

const CHANGE_THRESHOLD = 5 // ±5% triggers alert
const COOLDOWN_MS = 30 * 60 * 1000
const MAX_MAP_SIZE = 10000
const lastSentMap = new Map<string, number>()

function cleanupCooldownMap() {
  if (lastSentMap.size <= MAX_MAP_SIZE) return
  const now = Date.now()
  for (const [key, timestamp] of lastSentMap) {
    if (now - timestamp > COOLDOWN_MS) {
      lastSentMap.delete(key)
    }
  }
}

/**
 * Detect probability changes and create alerts for interested users.
 * Call this after updating ProbabilityCache.
 */
export async function detectAndAlertProbabilityChange(
  facilityId: string,
  ageGroup: string,
  oldProbability: number,
  newProbability: number,
) {
  cleanupCooldownMap()

  const diff = newProbability - oldProbability
  if (Math.abs(diff) < CHANGE_THRESHOLD) return { alertsCreated: 0 }

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { name: true },
  })
  if (!facility) return { alertsCreated: 0 }

  // Find users interested: favorites + active waitlist
  const [favorites, waitlistEntries] = await Promise.all([
    prisma.favorite.findMany({
      where: { facilityId },
      select: { userId: true },
    }),
    prisma.waitlistEntry.findMany({
      where: { facilityId, ageGroup, status: 'waiting' },
      select: { userId: true },
    }),
  ])

  const userIds = [...new Set([...favorites.map((f) => f.userId), ...waitlistEntries.map((w) => w.userId)])]
  if (userIds.length === 0) return { alertsCreated: 0 }

  const direction = diff > 0 ? '상승' : '하락'
  const title = '확률 변동'
  const body = `${facility.name} ${ageGroup} 확률이 ${Math.round(oldProbability)}%→${Math.round(newProbability)}%로 ${direction}했습니다.`

  const now = Date.now()
  const targetUsers = userIds.filter((userId) => {
    const key = `${userId}:${facilityId}:${ageGroup}`
    const lastSent = lastSentMap.get(key)
    return !lastSent || now - lastSent > COOLDOWN_MS
  })
  if (targetUsers.length === 0) return { alertsCreated: 0 }

  await prisma.alert.createMany({
    data: targetUsers.map((userId) => ({
      userId,
      type: 'probability',
      title,
      body,
      facilityId,
      actionUrl: `/facility/${facilityId}`,
    })),
  })

  for (const userId of targetUsers) {
    lastSentMap.set(`${userId}:${facilityId}:${ageGroup}`, now)
    pushNotification(userId, {
      type: 'probability',
      title,
      body,
      facilityId,
      facilityName: facility.name,
    })
  }

  return { alertsCreated: targetUsers.length, direction, diff }
}
