import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type VitalPayload = {
  name?: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB'
  value?: number
  rating?: 'good' | 'needs-improvement' | 'poor'
  page?: string
  timestamp?: number
}

function json(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init)
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  let body: VitalPayload | null = null
  try {
    body = (await req.json()) as VitalPayload
  } catch {
    return json({ success: false, error: 'JSON body가 필요합니다.' }, { status: 400 })
  }

  if (!body?.name || typeof body.value !== 'number' || !body.rating) {
    return json({ success: false, error: 'name/value/rating이 필요합니다.' }, { status: 400 })
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[web-vitals]', {
      name: body.name,
      value: body.value,
      rating: body.rating,
      page: body.page ?? '/',
      timestamp: body.timestamp ?? Date.now(),
    })
  }

  return json({ success: true })
})
