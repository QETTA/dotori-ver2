import type { NextRequest } from 'next/server'
import { pollRedisQueue, subscribers } from '@/lib/notifications'
import { isRedisAvailable } from '@/lib/redis'

/**
 * GET /api/notifications/stream
 * Server-Sent Events for real-time notifications
 *
 * When Redis is available, also polls Redis list queue every 2s
 * to receive messages pushed by other server instances.
 */

export function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId') ?? 'anonymous'

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // Register subscriber for local in-memory delivery
      if (!subscribers.has(userId)) subscribers.set(userId, new Set())
      subscribers.get(userId)!.add(controller)

      // Send keepalive ping every 30s
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          clearInterval(ping)
        }
      }, 30_000)

      // Redis polling (2s interval) for cross-server messages
      let redisPoll: ReturnType<typeof setInterval> | null = null
      if (isRedisAvailable()) {
        redisPoll = setInterval(async () => {
          try {
            const msg = await pollRedisQueue(userId)
            if (msg) {
              controller.enqueue(encoder.encode(`data: ${msg}\n\n`))
            }
          } catch {
            /* Redis poll error — skip */
          }
        }, 2_000)
      }

      // Send welcome
      const welcome = JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })
      controller.enqueue(encoder.encode(`data: ${welcome}\n\n`))

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(ping)
        if (redisPoll) clearInterval(redisPoll)
        subscribers.get(userId)?.delete(controller)
        if (subscribers.get(userId)?.size === 0) subscribers.delete(userId)
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // nginx
    },
  })
}
