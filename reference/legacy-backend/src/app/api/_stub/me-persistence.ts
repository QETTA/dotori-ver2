import type { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api-guard'
import prisma from '@/lib/db/prisma'
import { DAYCARES } from './daycares'

export type PersistMode = 'db' | 'cookie'
export type FirstChoiceSnapshot = {
  daycareId: string
  age: number | null
  savedAt: string
  persisted: PersistMode
}
export type ToAlertSnapshot = {
  daycareId: string
  age: number
  enabled: boolean
  enabledAt: string
  persisted: PersistMode
}
export type WatchlistItemSnapshot = {
  daycareId: string
  name: string
  age?: number
  alertEnabled: boolean
  priority: number
}
export type WatchlistStateSnapshot = {
  primaryChoiceId: string | null
  watchlist: WatchlistItemSnapshot[]
  updatedAt: string
  persisted: PersistMode
}
export type ToAlertHistoryEntry = {
  daycareId: string
  age: number
  action: 'enable' | 'disable'
  requestId: string | null
  createdAt: string
  persisted: PersistMode
}
export type PersistenceDiagnostics = {
  userResolved: boolean
  mappingTableReady: boolean
  watchlistTableReady: boolean
  alertHistoryTableReady: boolean
  mappingCount: number
  userWatchlistExists: boolean
  activeToAlertsCount: number
  alertHistoryCount: number
  lastAlertHistoryAt: string | null
}

const MAPPING_TABLE = 'daycare_stub_map'
const WATCHLIST_STATE_TABLE = 'chat_watchlist_state'
const ALERT_HISTORY_TABLE = 'to_alert_history'
const globalMappingState = globalThis as unknown as {
  __ipsoMappingTableReady?: boolean
  __ipsoWatchlistTableReady?: boolean
  __ipsoAlertHistoryTableReady?: boolean
}
const prismaRaw = prisma as unknown as {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>
  $queryRawUnsafe: <T = unknown>(query: string, ...values: unknown[]) => Promise<T>
}

function jsonCookieOptions() {
  return {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax' as const,
    httpOnly: false,
  }
}

export function readJsonCookie<T>(request: NextRequest, name: string, fallback: T): T {
  try {
    const raw = request.cookies.get(name)?.value
    if (!raw) return fallback
    return JSON.parse(decodeURIComponent(raw)) as T
  } catch {
    return fallback
  }
}

export function writeJsonCookie<T>(response: NextResponse, name: string, value: T) {
  response.cookies.set(name, encodeURIComponent(JSON.stringify(value)), jsonCookieOptions())
}

export function findStubDaycare(daycareId: string) {
  return DAYCARES.find((item) => item.id === daycareId) ?? null
}

async function ensureMappingTable() {
  if (globalMappingState.__ipsoMappingTableReady) return
  try {
    await prismaRaw.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS ${MAPPING_TABLE} (
        daycare_id TEXT PRIMARY KEY,
        facility_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    )
    await prismaRaw.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS idx_${MAPPING_TABLE}_facility_id ON ${MAPPING_TABLE} (facility_id)`,
    )
    globalMappingState.__ipsoMappingTableReady = true
  } catch {
    globalMappingState.__ipsoMappingTableReady = false
  }
}

async function ensureWatchlistTable() {
  if (globalMappingState.__ipsoWatchlistTableReady) return
  try {
    await prismaRaw.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS ${WATCHLIST_STATE_TABLE} (
        user_id TEXT PRIMARY KEY,
        primary_daycare_id TEXT NULL,
        watchlist JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    )
    globalMappingState.__ipsoWatchlistTableReady = true
  } catch {
    globalMappingState.__ipsoWatchlistTableReady = false
  }
}

async function ensureAlertHistoryTable() {
  if (globalMappingState.__ipsoAlertHistoryTableReady) return
  try {
    await prismaRaw.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS ${ALERT_HISTORY_TABLE} (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        daycare_id TEXT NOT NULL,
        age INTEGER NOT NULL,
        action TEXT NOT NULL,
        request_id TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    )
    await prismaRaw.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS idx_${ALERT_HISTORY_TABLE}_user_time ON ${ALERT_HISTORY_TABLE} (user_id, created_at DESC)`,
    )
    globalMappingState.__ipsoAlertHistoryTableReady = true
  } catch {
    globalMappingState.__ipsoAlertHistoryTableReady = false
  }
}

async function getMappedFacilityId(daycareId: string): Promise<string | null> {
  await ensureMappingTable()
  try {
    const rows = await prismaRaw.$queryRawUnsafe<Array<{ facility_id: string }>>(
      `SELECT facility_id FROM ${MAPPING_TABLE} WHERE daycare_id = $1 LIMIT 1`,
      daycareId,
    )
    return rows[0]?.facility_id ?? null
  } catch {
    return null
  }
}

async function getMappedDaycareId(facilityId: string): Promise<string | null> {
  await ensureMappingTable()
  try {
    const rows = await prismaRaw.$queryRawUnsafe<Array<{ daycare_id: string }>>(
      `SELECT daycare_id FROM ${MAPPING_TABLE} WHERE facility_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      facilityId,
    )
    return rows[0]?.daycare_id ?? null
  } catch {
    return null
  }
}

async function upsertFacilityMapping(daycareId: string, facilityId: string) {
  await ensureMappingTable()
  try {
    await prismaRaw.$executeRawUnsafe(
      `INSERT INTO ${MAPPING_TABLE} (daycare_id, facility_id)
       VALUES ($1, $2)
       ON CONFLICT (daycare_id)
       DO UPDATE SET facility_id = EXCLUDED.facility_id, updated_at = NOW()`,
      daycareId,
      facilityId,
    )
  } catch {}
}

async function appendAlertHistory(payload: {
  userId: string
  daycareId: string
  age: number
  action: 'enable' | 'disable'
  requestId?: string | null
}) {
  await ensureAlertHistoryTable()
  try {
    await prismaRaw.$executeRawUnsafe(
      `INSERT INTO ${ALERT_HISTORY_TABLE} (user_id, daycare_id, age, action, request_id)
       VALUES ($1, $2, $3, $4, $5)`,
      payload.userId,
      payload.daycareId,
      payload.age,
      payload.action,
      payload.requestId ?? null,
    )
  } catch {}
}

function findStubDaycareByFacility(facility: { name: string; district: string; dong: string | null }) {
  return (
    DAYCARES.find(
      (item) =>
        item.name === facility.name &&
        item.district === facility.district &&
        (item.dong ?? null) === (facility.dong ?? null),
    ) ??
    DAYCARES.find((item) => item.name === facility.name && item.district === facility.district) ??
    null
  )
}

function parseAgeFromText(text: string | null | undefined): number | null {
  if (!text) return null
  const m = text.match(/([0-5])\s*세/)
  if (!m) return null
  const age = Number(m[1])
  return Number.isFinite(age) ? age : null
}

async function resolveDbUserId(request: NextRequest): Promise<string | null> {
  const authUser = await getAuthUser(request)
  if (!authUser?.email) return null

  try {
    const existing = await prisma.user.findUnique({
      where: { email: authUser.email },
      select: { id: true },
    })
    if (existing) return existing.id

    const created = await prisma.user.create({
      data: {
        email: authUser.email,
        name: authUser.name || authUser.email.split('@')[0] || '사용자',
        provider: 'email',
      },
      select: { id: true },
    })
    return created.id
  } catch {
    return null
  }
}

async function resolveFacilityId(daycareId: string): Promise<string | null> {
  const mapped = await getMappedFacilityId(daycareId)
  if (mapped) return mapped

  const stub = findStubDaycare(daycareId)
  if (!stub) return null

  try {
    const exact = await prisma.facility.findFirst({
      where: {
        name: stub.name,
        district: stub.district,
        ...(stub.dong ? { dong: stub.dong } : {}),
      },
      select: { id: true },
    })
    if (exact) {
      await upsertFacilityMapping(daycareId, exact.id)
      return exact.id
    }

    const byNameAndDistrict = await prisma.facility.findFirst({
      where: {
        name: stub.name,
        district: stub.district,
      },
      select: { id: true },
    })
    if (byNameAndDistrict?.id) {
      await upsertFacilityMapping(daycareId, byNameAndDistrict.id)
      return byNameAndDistrict.id
    }

    return null
  } catch {
    return null
  }
}

function normalizeWatchlistItems(
  watchlist: Array<{
    daycareId: string
    name?: string
    age?: number
    alertEnabled?: boolean
    priority?: number
  }>,
  primaryChoiceId: string | null,
): WatchlistItemSnapshot[] {
  const unique = new Map<string, WatchlistItemSnapshot>()
  for (const raw of watchlist) {
    const daycareId = String(raw.daycareId ?? '').trim()
    if (!daycareId || unique.has(daycareId)) continue
    unique.set(daycareId, {
      daycareId,
      name: raw.name?.trim() || findStubDaycare(daycareId)?.name || '후보 시설',
      age: Number.isFinite(raw.age) ? Number(raw.age) : undefined,
      alertEnabled: Boolean(raw.alertEnabled),
      priority: Number.isFinite(raw.priority) ? Number(raw.priority) : unique.size + 1,
    })
  }

  const base = Array.from(unique.values())
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)

  if (primaryChoiceId) {
    const idx = base.findIndex((item) => item.daycareId === primaryChoiceId)
    if (idx > 0) {
      const primary = base[idx]
      base.splice(idx, 1)
      base.unshift({ ...primary, priority: 1 })
    }
  }

  return base.map((item, index) => ({
    ...item,
    priority: index + 1,
  }))
}

export async function persistFirstChoice(request: NextRequest, daycareId: string): Promise<PersistMode> {
  const userId = await resolveDbUserId(request)
  if (!userId) return 'cookie'

  const facilityId = await resolveFacilityId(daycareId)
  if (!facilityId) return 'cookie'

  try {
    const existingFav = await prisma.favorite.findUnique({ where: { userId_facilityId: { userId, facilityId } } })
    if (!existingFav) await prisma.favorite.create({ data: { userId, facilityId } })
    return 'db'
  } catch {
    return 'cookie'
  }
}

export async function persistToAlert(
  request: NextRequest,
  payload: { daycareId: string; age: number },
): Promise<PersistMode> {
  const userId = await resolveDbUserId(request)
  if (!userId) return 'cookie'

  const facilityId = await resolveFacilityId(payload.daycareId)
  if (!facilityId) return 'cookie'

  try {
    const existingFav = await prisma.favorite.findUnique({ where: { userId_facilityId: { userId, facilityId } } })
    if (!existingFav) await prisma.favorite.create({ data: { userId, facilityId } })

    const body = `${payload.age}세 TO 알림이 활성화되었습니다.`
    const existing = await prisma.alert.findFirst({
      where: {
        userId,
        facilityId,
        type: 'to',
        isRead: false,
        body,
      },
      select: { id: true },
    })

    if (!existing) {
      await prisma.alert.create({
        data: {
          userId,
          facilityId,
          type: 'to',
          title: 'TO 알림 활성화',
          body,
          isRead: false,
        },
      })
    }

    await appendAlertHistory({
      userId,
      daycareId: payload.daycareId,
      age: payload.age,
      action: 'enable',
      requestId: request.headers.get('x-idempotency-key'),
    })

    return 'db'
  } catch {
    return 'cookie'
  }
}

export async function disableToAlert(
  request: NextRequest,
  payload: { daycareId: string; age: number },
): Promise<PersistMode> {
  const userId = await resolveDbUserId(request)
  if (!userId) return 'cookie'

  const facilityId = await resolveFacilityId(payload.daycareId)
  if (!facilityId) return 'cookie'

  try {
    await prisma.alert.updateMany({
      where: {
        userId,
        facilityId,
        type: 'to',
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })
    await appendAlertHistory({
      userId,
      daycareId: payload.daycareId,
      age: payload.age,
      action: 'disable',
      requestId: request.headers.get('x-idempotency-key'),
    })
    return 'db'
  } catch {
    return 'cookie'
  }
}

export async function loadFirstChoice(request: NextRequest): Promise<FirstChoiceSnapshot | null> {
  const cookie = readJsonCookie<FirstChoiceSnapshot | null>(request, 'ipso_first_choice', null)
  const userId = await resolveDbUserId(request)
  if (!userId) return cookie

  try {
    const latest = await prisma.favorite.findFirst({
      where: { userId },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            district: true,
            dong: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!latest?.facility) return cookie
    const mappedDaycareId = await getMappedDaycareId(latest.facility.id)
    const stub = mappedDaycareId ? findStubDaycare(mappedDaycareId) : findStubDaycareByFacility(latest.facility)
    if (!stub) return cookie
    if (!mappedDaycareId) {
      await upsertFacilityMapping(stub.id, latest.facility.id)
    }
    return {
      daycareId: stub.id,
      age: cookie?.daycareId === stub.id ? cookie.age : (cookie?.age ?? null),
      savedAt: latest.createdAt.toISOString(),
      persisted: 'db',
    }
  } catch {
    return cookie
  }
}

export async function loadToAlerts(request: NextRequest): Promise<ToAlertSnapshot[]> {
  const cookieItems = readJsonCookie<ToAlertSnapshot[]>(request, 'ipso_to_alerts', [])
  const userId = await resolveDbUserId(request)
  if (!userId) return cookieItems

  try {
    const rows = await prisma.alert.findMany({
      where: {
        userId,
        type: 'to',
        isRead: false,
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            district: true,
            dong: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const dbItems: ToAlertSnapshot[] = []
    for (const row of rows) {
      if (!row.facility) continue
      const mappedDaycareId = await getMappedDaycareId(row.facility.id)
      const stub = mappedDaycareId ? findStubDaycare(mappedDaycareId) : findStubDaycareByFacility(row.facility)
      if (!stub) continue
      if (!mappedDaycareId) {
        await upsertFacilityMapping(stub.id, row.facility.id)
      }
      const age = parseAgeFromText(row.body) ?? 0
      dbItems.push({
        daycareId: stub.id,
        age,
        enabled: true,
        enabledAt: row.createdAt.toISOString(),
        persisted: 'db',
      })
    }

    const merged = new Map<string, ToAlertSnapshot>()
    for (const item of [...dbItems, ...cookieItems]) {
      const key = `${item.daycareId}:${item.age}`
      if (!merged.has(key)) merged.set(key, item)
    }

    return Array.from(merged.values())
      .sort((a, b) => b.enabledAt.localeCompare(a.enabledAt))
      .slice(0, 3)
  } catch {
    return cookieItems
  }
}

export async function loadWatchlistState(request: NextRequest): Promise<WatchlistStateSnapshot | null> {
  const cookie = readJsonCookie<WatchlistStateSnapshot | null>(request, 'ipso_watchlist_state', null)
  const userId = await resolveDbUserId(request)
  if (!userId) return cookie

  await ensureWatchlistTable()
  try {
    const rows = await prismaRaw.$queryRawUnsafe<
      Array<{
        primary_daycare_id: string | null
        watchlist: unknown
        updated_at: Date
      }>
    >(
      `SELECT primary_daycare_id, watchlist, updated_at
       FROM ${WATCHLIST_STATE_TABLE}
       WHERE user_id = $1
       LIMIT 1`,
      userId,
    )
    const row = rows[0]
    if (!row) return cookie
    const list = Array.isArray(row.watchlist) ? row.watchlist : []
    return {
      primaryChoiceId: row.primary_daycare_id ?? null,
      watchlist: normalizeWatchlistItems(
        list as Array<{ daycareId: string; name?: string; age?: number; alertEnabled?: boolean; priority?: number }>,
        row.primary_daycare_id ?? null,
      ),
      updatedAt: row.updated_at.toISOString(),
      persisted: 'db',
    }
  } catch {
    return cookie
  }
}

export async function persistWatchlistState(
  request: NextRequest,
  payload: {
    primaryChoiceId: string | null
    watchlist: Array<{ daycareId: string; name?: string; age?: number; alertEnabled?: boolean; priority?: number }>
  },
): Promise<WatchlistStateSnapshot> {
  const normalized = normalizeWatchlistItems(payload.watchlist, payload.primaryChoiceId)
  const now = new Date().toISOString()
  const fallback: WatchlistStateSnapshot = {
    primaryChoiceId: payload.primaryChoiceId,
    watchlist: normalized,
    updatedAt: now,
    persisted: 'cookie',
  }

  const userId = await resolveDbUserId(request)
  if (!userId) return fallback

  await ensureWatchlistTable()
  try {
    await prismaRaw.$executeRawUnsafe(
      `INSERT INTO ${WATCHLIST_STATE_TABLE} (user_id, primary_daycare_id, watchlist, updated_at)
       VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         primary_daycare_id = EXCLUDED.primary_daycare_id,
         watchlist = EXCLUDED.watchlist,
         updated_at = NOW()`,
      userId,
      payload.primaryChoiceId,
      JSON.stringify(normalized),
    )

    const rows = await prismaRaw.$queryRawUnsafe<Array<{ updated_at: Date }>>(
      `SELECT updated_at FROM ${WATCHLIST_STATE_TABLE} WHERE user_id = $1 LIMIT 1`,
      userId,
    )

    return {
      primaryChoiceId: payload.primaryChoiceId,
      watchlist: normalized,
      updatedAt: rows[0]?.updated_at?.toISOString?.() ?? now,
      persisted: 'db',
    }
  } catch {
    return fallback
  }
}

export async function loadToAlertHistory(request: NextRequest, limit = 50): Promise<ToAlertHistoryEntry[]> {
  const userId = await resolveDbUserId(request)
  if (!userId) return []

  await ensureAlertHistoryTable()
  try {
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)))
    const rows = await prismaRaw.$queryRawUnsafe<
      Array<{
        daycare_id: string
        age: number
        action: string
        request_id: string | null
        created_at: Date
      }>
    >(
      `SELECT daycare_id, age, action, request_id, created_at
       FROM ${ALERT_HISTORY_TABLE}
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      userId,
      safeLimit,
    )

    return rows
      .filter((row) => row.action === 'enable' || row.action === 'disable')
      .map((row) => ({
        daycareId: row.daycare_id,
        age: row.age,
        action: row.action as 'enable' | 'disable',
        requestId: row.request_id ?? null,
        createdAt: row.created_at.toISOString(),
        persisted: 'db',
      }))
  } catch {
    return []
  }
}

export async function loadPersistenceDiagnostics(request: NextRequest): Promise<PersistenceDiagnostics> {
  const userId = await resolveDbUserId(request)
  await Promise.all([ensureMappingTable(), ensureWatchlistTable(), ensureAlertHistoryTable()])

  let mappingCount = 0
  try {
    const rows = await prismaRaw.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM ${MAPPING_TABLE}`,
    )
    mappingCount = rows[0]?.count ?? 0
  } catch {
    mappingCount = 0
  }

  let userWatchlistExists = false
  if (userId) {
    try {
      const rows = await prismaRaw.$queryRawUnsafe<Array<{ exists: boolean }>>(
        `SELECT EXISTS(SELECT 1 FROM ${WATCHLIST_STATE_TABLE} WHERE user_id = $1) AS exists`,
        userId,
      )
      userWatchlistExists = Boolean(rows[0]?.exists)
    } catch {
      userWatchlistExists = false
    }
  }

  let alertHistoryCount = 0
  let lastAlertHistoryAt: string | null = null
  if (userId) {
    try {
      const rows = await prismaRaw.$queryRawUnsafe<Array<{ count: number; last_at: Date | null }>>(
        `SELECT COUNT(*)::int AS count, MAX(created_at) AS last_at
         FROM ${ALERT_HISTORY_TABLE}
         WHERE user_id = $1`,
        userId,
      )
      alertHistoryCount = rows[0]?.count ?? 0
      lastAlertHistoryAt = rows[0]?.last_at ? rows[0].last_at.toISOString() : null
    } catch {
      alertHistoryCount = 0
      lastAlertHistoryAt = null
    }
  }

  let activeToAlertsCount = 0
  if (userId) {
    try {
      activeToAlertsCount = await prisma.alert.count({
        where: {
          userId,
          type: 'to',
          isRead: false,
        },
      })
    } catch {
      activeToAlertsCount = 0
    }
  }

  return {
    userResolved: Boolean(userId),
    mappingTableReady: Boolean(globalMappingState.__ipsoMappingTableReady),
    watchlistTableReady: Boolean(globalMappingState.__ipsoWatchlistTableReady),
    alertHistoryTableReady: Boolean(globalMappingState.__ipsoAlertHistoryTableReady),
    mappingCount,
    userWatchlistExists,
    activeToAlertsCount,
    alertHistoryCount,
    lastAlertHistoryAt,
  }
}
