import type { Prisma } from '@prisma/client'
import prisma from '@/lib/db/prisma'

interface AuditEntry {
  action: string
  entity: string
  entityId?: string
  userId?: string
  userName?: string
  metadata?: Prisma.InputJsonValue
  ip?: string
}

/** Fire-and-forget audit logger — never throws */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({ data: entry })
  } catch {
    // Swallow — audit logging must never break the caller
  }
}
