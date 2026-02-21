import type { NextRequest } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import { closeListener, pushEvent, researchSessions } from '../_session-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const sessionId = request.nextUrl.searchParams.get('sessionId')?.trim()
  if (!sessionId) {
    return new Response(JSON.stringify({ success: false, error: 'SESSION_ID_REQUIRED' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const session = researchSessions.get(sessionId)
  if (!session) {
    return new Response(JSON.stringify({ success: false, error: 'SESSION_NOT_FOUND' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null
  let closeTimer: ReturnType<typeof setTimeout> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller
      session.listeners.add(controller)

      for (const step of session.steps) {
        pushEvent(controller, { type: 'stepAdded', step })
      }
      for (const evidence of session.evidences) {
        pushEvent(controller, { type: 'evidenceAdded', evidence })
      }

      if (session.status === 'done') {
        pushEvent(controller, { type: 'done' })
        closeListener(session, controller)
        streamController = null
        return
      }

      closeTimer = setTimeout(() => {
        if (!streamController) return
        closeListener(session, streamController)
        streamController = null
      }, 30_000)
    },
    cancel() {
      if (closeTimer) {
        clearTimeout(closeTimer)
      }
      if (streamController) {
        session.listeners.delete(streamController)
        streamController = null
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
})
