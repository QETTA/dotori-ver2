import { type NextRequest, NextResponse } from 'next/server'
import type { EvidenceItem, ResearchStep } from '../model'
import { withErrorHandling } from '@/lib/api-errors'
import { auth } from '@/lib/auth/config'
import { broadcastEvent, researchSessions } from '../_session-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(data: unknown, status = 200) {
  const response = NextResponse.json(data, { status })
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth()
  if (!session?.user?.email) {
    return json({ success: false, error: 'UNAUTHORIZED' }, 401)
  }

  let body: { sessionId?: string; text?: string; url?: string } | null = null
  try {
    body = (await request.json()) as { sessionId?: string; text?: string; url?: string }
  } catch {
    return json({ success: false, error: 'INVALID_JSON' }, 400)
  }

  const sessionId = String(body?.sessionId ?? '').trim()
  if (!sessionId) {
    return json({ success: false, error: 'SESSION_ID_REQUIRED' }, 400)
  }

  const target = researchSessions.get(sessionId)
  if (!target) {
    return json({ success: false, error: 'SESSION_NOT_FOUND' }, 404)
  }

  const evidence: EvidenceItem = {
    id: crypto.randomUUID(),
    sourceType: 'user_provided',
    trustLabel: '사용자 제공',
    url: body?.url ?? undefined,
    title: '사용자 제공 자료',
    snippet: body?.text ?? '',
    ts: new Date().toISOString(),
  }
  target.evidences.push(evidence)
  broadcastEvent(target, { type: 'evidenceAdded', evidence })

  const step: ResearchStep = {
    id: crypto.randomUUID(),
    type: 'extract',
    status: 'done',
    title: '사용자 제공 자료 반영',
    ts: new Date().toISOString(),
  }
  target.steps.push(step)
  broadcastEvent(target, { type: 'stepAdded', step })

  return json({ success: true })
})
