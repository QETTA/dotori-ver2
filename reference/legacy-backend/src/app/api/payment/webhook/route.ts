import { createHmac } from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-errors'
import prisma from '@/lib/db/prisma'

/**
 * POST /api/payment/webhook
 * 토스페이먼츠 웹훅 (결제 상태 변경 알림)
 *
 * 웹훅 설정: 토스페이먼츠 개발자센터 → 웹훅 → URL 등록
 * https://yourdomain.com/api/payment/webhook
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  try {
    const body = await request.text()
    const signature = request.headers.get('toss-signature') ?? ''
    const secretKey = process.env.TOSS_SECRET_KEY ?? ''
    if (secretKey) {
      const expected = createHmac('sha256', secretKey).update(body).digest('base64')
      if (signature !== expected) {
        console.error('[webhook] Invalid signature')
        return Response.json(
          { success: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } },
          { status: 401 },
        )
      }
    }

    const parsed = JSON.parse(body) as { eventType?: string; data?: any }
    const { eventType, data } = parsed

    console.log('[Webhook]', eventType, data?.orderId)

    switch (eventType) {
      case 'PAYMENT_STATUS_CHANGED': {
        const { orderId, status, paymentKey } = data
        if (!orderId) break

        try {
          await prisma.payment.update({
            where: { orderId },
            data: {
              status: mapTossStatus(status),
              paymentKey,
              failReason: `webhook:${eventType}`,
            },
          })

          await (prisma as any).auditLog?.create?.({
            data: {
              type: 'payment',
              action: `웹훅: ${status}`,
              actor: 'toss_webhook',
              target: orderId,
              severity: status === 'CANCELED' ? 'warning' : 'info',
            },
          })
        } catch (dbErr) {
          console.error('[Webhook] DB update failed:', dbErr)
        }
        break
      }

      default:
        console.log('[Webhook] Unhandled event:', eventType)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    // Still return 200 to prevent retry storms
    return NextResponse.json({ success: false }, { status: 200 })
  }
})

function mapTossStatus(tossStatus: string): string {
  const map: Record<string, string> = {
    DONE: 'completed',
    CANCELED: 'refunded',
    PARTIAL_CANCELED: 'completed',
    ABORTED: 'failed',
    EXPIRED: 'failed',
    WAITING_FOR_DEPOSIT: 'pending',
  }
  return map[tossStatus] ?? 'pending'
}
