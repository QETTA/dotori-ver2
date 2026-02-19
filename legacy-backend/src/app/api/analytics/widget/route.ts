import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type WidgetEventPayload = {
  name?: string
  payload?: Record<string, unknown>
  ts?: number
}

type WidgetEventRecord = {
  name: string
  payload: Record<string, unknown>
  ts: number
}

const globalStore = globalThis as unknown as {
  __ipsoWidgetEvents?: WidgetEventRecord[]
}

function json(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  let body: WidgetEventPayload | null = null
  try {
    body = (await req.json()) as WidgetEventPayload
  } catch {
    return json({ success: false, error: 'JSON body가 필요합니다.' }, { status: 400 })
  }

  const name = String(body?.name ?? '').trim()
  if (!name) {
    return json({ success: false, error: 'name이 필요합니다.' }, { status: 400 })
  }

  const events = globalStore.__ipsoWidgetEvents ?? []
  events.push({
    name,
    payload: body?.payload ?? {},
    ts: typeof body?.ts === 'number' ? body.ts : Date.now(),
  })
  globalStore.__ipsoWidgetEvents = events.slice(-500)

  if (process.env.NODE_ENV !== 'production') {
    console.info('[widget-event]', name, body?.payload ?? {})
  }

  return json({ success: true })
})

export const GET = withErrorHandling(async (req: NextRequest) => {
  const limitRaw = Number(req.nextUrl.searchParams.get('limit') ?? 50)
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, limitRaw)) : 50
  const events = globalStore.__ipsoWidgetEvents ?? []
  return json({
    success: true,
    items: events.slice(-limit).reverse(),
  })
})
