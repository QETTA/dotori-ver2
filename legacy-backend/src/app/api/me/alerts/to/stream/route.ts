import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const textEncoder = new TextEncoder()

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const session = await auth()
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ success: false, error: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const email = session.user.email

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let pingTimer: ReturnType<typeof setInterval> | null = null
  let closeTimer: ReturnType<typeof setTimeout> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let since = new Date()

      pollTimer = setInterval(async () => {
        try {
          const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
          })
          if (!user) return

          const events = await prisma.toAlertEvent.findMany({
            where: { detectedAt: { gt: since } },
            include: { daycare: { select: { name: true, district: true, dong: true } } },
            orderBy: { detectedAt: 'asc' },
            take: 50,
          })

          for (const evt of events) {
            const data = {
              id: evt.id,
              daycareId: evt.daycareId,
              age: evt.age,
              detectedAt: evt.detectedAt.toISOString(),
              message: evt.message,
              daycare: evt.daycare
                ? { name: evt.daycare.name, district: evt.daycare.district, dong: evt.daycare.dong }
                : undefined,
            }
            controller.enqueue(textEncoder.encode(`event: to_event\ndata: ${JSON.stringify(data)}\n\n`))
          }

          if (events.length > 0) {
            since = events[events.length - 1].detectedAt
          }
        } catch {
          // ignore poll errors
        }
      }, 5_000)

      pingTimer = setInterval(() => {
        try {
          controller.enqueue(textEncoder.encode(': ping\n\n'))
        } catch {
          // stream closed
        }
      }, 25_000)

      closeTimer = setTimeout(() => {
        cleanup()
        try {
          controller.close()
        } catch {
          // already closed
        }
      }, 60_000)
    },
    cancel() {
      cleanup()
    },
  })

  function cleanup() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = null
    }
    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = null
    }
  }

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
})
