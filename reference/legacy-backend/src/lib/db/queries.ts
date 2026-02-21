import { calculateGrade, calculateProbability } from '@/lib/engine/probability'
import { detectAndAlertProbabilityChange } from '@/lib/engine/probability-alert'
import prisma from './prisma'

export { calculateGrade, calculateProbability }
export type { ProbabilityFactors, ProbabilityResult } from '@/lib/engine/probability'

/* ─── Facility Queries ─── */
export async function getFacilities(options: {
  city?: string
  district?: string
  type?: string
  lat?: number
  lng?: number
  radiusKm?: number
  page?: number
  pageSize?: number
}) {
  const { city, district, type, lat, lng, radiusKm = 3, page = 1, pageSize = 20 } = options

  const where: any = { isActive: true }
  if (city) where.city = city
  if (district) where.district = district
  if (type && type !== '전체') where.type = type

  // Geo filter (approximate bounding box)
  if (lat && lng) {
    const latDelta = radiusKm / 111
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180))
    where.lat = { gte: lat - latDelta, lte: lat + latDelta }
    where.lng = { gte: lng - lngDelta, lte: lng + lngDelta }
  }

  const [facilities, total] = await Promise.all([
    prisma.facility.findMany({
      where,
      include: { ageClasses: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
    }),
    prisma.facility.count({ where }),
  ])

  return { facilities, total, page, pageSize }
}

export async function getFacilityById(id: string) {
  return prisma.facility.findUnique({
    where: { id },
    include: {
      ageClasses: true,
      toHistory: { orderBy: { occurredAt: 'desc' }, take: 10 },
    },
  })
}

/* ─── Alert Queries ─── */
export async function getUserAlerts(
  userId: string,
  options?: {
    type?: string
    isRead?: boolean
    page?: number
    pageSize?: number
  },
) {
  const { type, isRead, page = 1, pageSize = 20 } = options || {}

  const where: any = { userId }
  if (type) where.type = type
  if (isRead !== undefined) where.isRead = isRead

  const [alerts, total, unreadCount] = await Promise.all([
    prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.alert.count({ where }),
    prisma.alert.count({ where: { userId, isRead: false } }),
  ])

  return { alerts, total, unreadCount, page, pageSize }
}

export async function markAlertRead(id: string, userId: string) {
  return prisma.alert.update({
    where: { id, userId },
    data: { isRead: true },
  })
}

export async function markAllAlertsRead(userId: string) {
  return prisma.alert.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
}

/* ─── Waitlist Queries ─── */
export async function getUserWaitlist(userId: string) {
  return prisma.waitlistEntry.findMany({
    where: { userId, status: 'waiting' },
    include: { facility: { include: { ageClasses: true } }, child: true },
    orderBy: { priority: 'asc' },
  })
}

export async function addToWaitlist(data: {
  userId: string
  childId: string
  facilityId: string
  ageGroup: string
  priority: number
}) {
  return prisma.waitlistEntry.create({ data })
}

/* ─── Favorite Queries ─── */
export async function getUserFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    include: { facility: { include: { ageClasses: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function toggleFavorite(userId: string, facilityId: string) {
  const existing = await prisma.favorite.findUnique({
    where: { userId_facilityId: { userId, facilityId } },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return { action: 'removed' as const }
  }

  await prisma.favorite.create({ data: { userId, facilityId } })
  return { action: 'added' as const }
}

/* ─── Consult Queries ─── */
export async function createConsult(userId: string, type: 'ai' | 'expert', facilityId?: string) {
  return prisma.consult.create({
    data: { userId, type, facilityId, status: 'in_progress' },
  })
}

export async function addConsultMessage(consultId: string, role: string, content: string, metadata?: any) {
  return prisma.consultMessage.create({
    data: { consultId, role, content, metadata },
  })
}

/* ─── Payment Queries ─── */
export async function createPayment(data: {
  userId: string
  plan: string
  amount: number
  method?: string
  orderId: string
}) {
  return prisma.payment.create({ data })
}

export async function completePayment(orderId: string, paymentKey: string) {
  const payment = await prisma.payment.update({
    where: { orderId },
    data: { status: 'completed', paymentKey, paidAt: new Date() },
  })

  // Upgrade user plan
  await prisma.user.update({
    where: { id: payment.userId },
    data: { plan: payment.plan },
  })

  return payment
}

/* ─── Probability Cache ─── */
export async function getCachedProbability(facilityId: string, ageGroup: string) {
  return prisma.probabilityCache.findUnique({
    where: { facilityId_ageGroup: { facilityId, ageGroup } },
  })
}

export async function setCachedProbability(facilityId: string, ageGroup: string, probability: number, factors?: any) {
  // Check existing value for change detection
  const existing = await prisma.probabilityCache.findUnique({
    where: { facilityId_ageGroup: { facilityId, ageGroup } },
    select: { id: true, probability: true },
  })

  const result = existing
    ? await prisma.probabilityCache.update({
        where: { id: existing.id },
        data: { probability, grade: calculateGrade(probability), factors, calculatedAt: new Date() },
      })
    : await prisma.probabilityCache.create({
        data: { facilityId, ageGroup, probability, grade: calculateGrade(probability), factors },
      })

  // Trigger alert if probability changed significantly
  if (existing) {
    detectAndAlertProbabilityChange(facilityId, ageGroup, existing.probability, probability).catch(() => {
      // Ignore alert errors — don't block cache update
    })
  }

  return result
}

/* ─── Admin Stats ─── */
export async function getAdminStats() {
  const [totalUsers, activeToday, totalFacilities, totalAlerts, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.session.count({ where: { expires: { gte: new Date() } } }),
    prisma.facility.count({ where: { isActive: true } }),
    prisma.alert.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
    prisma.payment.aggregate({
      where: { status: 'completed', paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      _sum: { amount: true },
    }),
  ])

  return {
    totalUsers,
    activeToday,
    totalFacilities,
    alertsToday: totalAlerts,
    monthlyRevenue: revenue._sum.amount || 0,
  }
}
