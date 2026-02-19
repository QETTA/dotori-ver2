import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import prisma from '@/lib/db/prisma'

/**
 * Server-side data fetching functions
 * Used by React Server Components to fetch data before rendering
 * Wrapped in React cache() for deduplication within a single request
 */

const DB_FALLBACK_TIMEOUT_MS = 2500

async function withDbTimeout<T>(promise: Promise<T>, timeoutMs = DB_FALLBACK_TIMEOUT_MS): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer)
        reject(new Error('DB_TIMEOUT'))
      }, timeoutMs)
    }),
  ])
}

/* ═══════════════════════════════════════
 *  Facilities
 * ═══════════════════════════════════════ */

export const getFacilities = cache(
  async (params?: { type?: string; sort?: string; page?: number; pageSize?: number; q?: string }) => {
    const { type, sort = 'probability', page = 1, pageSize = 20, q } = params ?? {}

    try {
      const where: any = { isActive: true }
      if (type) where.type = type
      if (q)
        where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { address: { contains: q, mode: 'insensitive' } }]

      const [facilities, total] = await withDbTimeout(
        Promise.all([
          prisma.facility.findMany({
            where,
            include: {
              probabilityCache: { orderBy: { calculatedAt: 'desc' }, take: 1 },
              ageClasses: { take: 4 },
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { updatedAt: 'desc' },
          }),
          prisma.facility.count({ where }),
        ]),
      )

      const data = facilities.map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        address: f.address,
        lat: f.lat,
        lng: f.lng,
        capacity: f.capacity,
        currentEnroll: f.currentEnroll,
        probability: f.probabilityCache?.[0]?.probability ?? null,
        grade: f.probabilityCache?.[0]?.grade ?? null,
        ageGroups: f.ageClasses,
      }))

      if (sort === 'probability') data.sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0))

      return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }
    } catch {
      return { data: MOCK_FACILITIES, meta: { page: 1, pageSize: 6, total: 6, totalPages: 1 } }
    }
  },
)

/* ═══════════════════════════════════════
 *  Single Facility
 * ═══════════════════════════════════════ */

export const getFacility = cache(async (id: string) => {
  try {
    const facility = await withDbTimeout(
      prisma.facility.findUnique({
        where: { id },
        include: {
          probabilityCache: { orderBy: { calculatedAt: 'desc' }, take: 10 },
          ageClasses: true,
        },
      }),
    )
    return facility
  } catch {
    return MOCK_FACILITIES.find((f) => f.id === id) ?? null
  }
})

/* ═══════════════════════════════════════
 *  Alerts (for user)
 * ═══════════════════════════════════════ */

export const getAlerts = cache(async (userId: string, type?: string) => {
  try {
    const where: any = { userId }
    if (type) where.type = type

    const alerts = await withDbTimeout(
      prisma.alert.findMany({
        where,
        include: { facility: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    )

    return alerts.map((a: any) => ({
      id: a.id,
      type: a.type,
      title: a.title || (a.type === 'to' ? 'TO 발생!' : '확률 변동'),
      body: a.body,
      facilityName: a.facility?.name,
      isRead: a.isRead,
      readAt: a.readAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    }))
  } catch {
    return MOCK_ALERTS
  }
})

/* ═══════════════════════════════════════
 *  Favorites
 * ═══════════════════════════════════════ */

export const getFavorites = cache(async (userId: string) => {
  try {
    return await prisma.favorite.findMany({
      where: { userId },
      include: { facility: { include: { probabilityCache: { orderBy: { calculatedAt: 'desc' }, take: 1 } } } },
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    return []
  }
})

/* ═══════════════════════════════════════
 *  Consults
 * ═══════════════════════════════════════ */

export const getConsults = cache(async (userId: string) => {
  try {
    return await prisma.consult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  } catch {
    return []
  }
})

/* ═══════════════════════════════════════
 *  Cached Stats (revalidates every 5 min)
 * ═══════════════════════════════════════ */

export const getStats = unstable_cache(
  async () => {
    try {
      const [users, facilities, alerts] = await Promise.all([
        prisma.user.count(),
        prisma.facility.count({ where: { isActive: true } }),
        prisma.tOEvent.count({ where: { occurredAt: { gte: new Date(Date.now() - 86400000) } } }),
      ])
      return { users, facilities, alertsToday: alerts }
    } catch {
      return { users: 1247, facilities: 12456, alertsToday: 89 }
    }
  },
  ['global-stats'],
  { revalidate: 300, tags: ['stats'] },
)

/* ═══════════════════════════════════════
 *  Mock Fallbacks
 * ═══════════════════════════════════════ */

const MOCK_FACILITIES = [
  {
    id: 'fac_1',
    name: '해맑은 어린이집',
    type: '국공립',
    address: '서울 강남구 역삼로 123',
    lat: 37.4985,
    lng: 127.028,
    capacity: 80,
    currentEnroll: 68,
    probability: 72,
    grade: 'B' as const,
    ageClasses: [],
    probabilityCache: [{ probability: 72, grade: 'B', ageGroup: '0세', factors: null, calculatedAt: new Date() }],
  },
  {
    id: 'fac_2',
    name: '무지개 어린이집',
    type: '민간',
    address: '서울 서초구 테헤란로 456',
    lat: 37.5065,
    lng: 127.034,
    capacity: 60,
    currentEnroll: 55,
    probability: 45,
    grade: 'C' as const,
    ageClasses: [],
    probabilityCache: [{ probability: 45, grade: 'C', ageGroup: '0세', factors: null, calculatedAt: new Date() }],
  },
  {
    id: 'fac_3',
    name: '햇살 어린이집',
    type: '국공립',
    address: '서울 송파구 올림픽로 666',
    lat: 37.515,
    lng: 127.105,
    capacity: 100,
    currentEnroll: 78,
    probability: 88,
    grade: 'A' as const,
    ageClasses: [],
    probabilityCache: [{ probability: 88, grade: 'A', ageGroup: '0세', factors: null, calculatedAt: new Date() }],
  },
  {
    id: 'fac_4',
    name: '꿈나무 어린이집',
    type: '국공립',
    address: '서울 마포구 월드컵로 444',
    lat: 37.556,
    lng: 126.908,
    capacity: 70,
    currentEnroll: 62,
    probability: 56,
    grade: 'C' as const,
    ageClasses: [],
    probabilityCache: [{ probability: 56, grade: 'C', ageGroup: '0세', factors: null, calculatedAt: new Date() }],
  },
  {
    id: 'fac_5',
    name: '별빛 어린이집',
    type: '민간',
    address: '서울 강남구 논현로 789',
    lat: 37.496,
    lng: 127.035,
    capacity: 45,
    currentEnroll: 38,
    probability: 67,
    grade: 'B' as const,
    ageClasses: [],
    probabilityCache: [{ probability: 67, grade: 'B', ageGroup: '0세', factors: null, calculatedAt: new Date() }],
  },
  {
    id: 'fac_6',
    name: '사랑 어린이집',
    type: '가정',
    address: '서울 강남구 도산대로 100',
    lat: 37.487,
    lng: 127.015,
    capacity: 15,
    currentEnroll: 14,
    probability: 31,
    grade: 'D' as const,
    ageClasses: [],
    probabilityCache: [{ probability: 31, grade: 'D', ageGroup: '0세', factors: null, calculatedAt: new Date() }],
  },
]

const MOCK_ALERTS = [
  {
    id: 'a1',
    type: 'to',
    title: 'TO 발생!',
    body: '해맑은 어린이집 0세반 1자리',
    facilityName: '해맑은 어린이집',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'a2',
    type: 'probability',
    title: '확률 변동',
    body: '확률 72%→78% 상승',
    facilityName: '해맑은 어린이집',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'a3',
    type: 'to',
    title: 'TO 발생!',
    body: '햇살 어린이집 1세반 2자리',
    facilityName: '햇살 어린이집',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
]
