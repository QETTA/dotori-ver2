import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const DB_CONNECT_TIMEOUT_SEC = Number(process.env.DB_CONNECT_TIMEOUT_SEC ?? '3')
const DB_CONNECT_TIMEOUT_MS = Number(process.env.DB_CONNECT_TIMEOUT_MS ?? '3000')

function readRawDatasourceUrl() {
  const primary = process.env.DATABASE_URL?.trim()
  if (primary) return primary

  const mongoAlias = process.env.MONGODB_URI?.trim()
  if (mongoAlias) return mongoAlias

  return undefined
}

function resolveDatasourceUrl() {
  const raw = readRawDatasourceUrl()
  if (!raw) return undefined

  try {
    const url = new URL(raw)
    const protocol = url.protocol.toLowerCase()

    if (protocol.startsWith('postgres')) {
      if (!url.searchParams.has('connect_timeout')) {
        url.searchParams.set('connect_timeout', String(DB_CONNECT_TIMEOUT_SEC))
      }
      if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', String(DB_CONNECT_TIMEOUT_SEC))
      }
      return url.toString()
    }

    if (protocol.startsWith('mongodb')) {
      if (!url.searchParams.has('connectTimeoutMS')) {
        url.searchParams.set('connectTimeoutMS', String(DB_CONNECT_TIMEOUT_MS))
      }
      if (!url.searchParams.has('serverSelectionTimeoutMS')) {
        url.searchParams.set('serverSelectionTimeoutMS', String(DB_CONNECT_TIMEOUT_MS))
      }
      if (!url.searchParams.has('socketTimeoutMS')) {
        url.searchParams.set('socketTimeoutMS', String(Math.max(DB_CONNECT_TIMEOUT_MS * 2, 8000)))
      }
      return url.toString()
    }

    return raw
  } catch {
    return raw
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatasourceUrl(),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
