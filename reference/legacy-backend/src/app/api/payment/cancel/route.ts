import { NextResponse } from 'next/server'
import { ApiError, withErrorHandling } from '@/lib/api-errors'
import prisma from '@/lib/db/prisma'
import { cancelPayment, TossPaymentError } from '@/lib/payment'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * POST /api/payment/cancel
 * Body: { orderId, cancelReason, cancelAmount? }
 */
export const POST = withErrorHandling(async (request: Request) => {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'anonymous'
  const rateCheck = await checkRateLimit(clientIp, RATE_LIMITS.heavy)
  if (!rateCheck.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rateCheck.resetAt - Date.now()) / 1000))
    return Response.json(
      { success: false, error: { code: 'RATE_LIMIT', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' } },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  const { orderId, cancelReason, cancelAmount } = await request.json()

  if (!orderId || !cancelReason) {
    throw new ApiError(400, 'INVALID_PARAMS', '주문번호와 취소 사유를 입력해주세요.')
  }

  try {
    // Find payment record
    const payment = await prisma.payment.findUnique({ where: { orderId } })
    if (!payment) throw new ApiError(404, 'NOT_FOUND', '결제 내역을 찾을 수 없습니다.')
    if (payment.status !== 'completed') throw new ApiError(400, 'INVALID_STATUS', '취소할 수 없는 결제입니다.')

    // Get paymentKey from record
    const paymentKey = payment.paymentKey
    if (!paymentKey) throw new ApiError(500, 'MISSING_KEY', '결제 키를 찾을 수 없습니다.')

    // Cancel via Toss
    const result = await cancelPayment(paymentKey, cancelReason, cancelAmount)

    // Update DB
    await prisma.payment.update({
      where: { orderId },
      data: {
        status: cancelAmount && cancelAmount < payment.amount ? 'completed' : 'refunded',
        refundedAt: new Date(),
        failReason: cancelReason,
      },
    })

    // Downgrade user plan if full refund
    if (!cancelAmount || cancelAmount >= payment.amount) {
      await prisma.user.update({
        where: { id: payment.userId },
        data: { plan: 'free' },
      })
    }

    // Audit log (auditLog model not in schema yet)
    await (prisma as any).auditLog?.create?.({
      data: {
        type: 'payment',
        action: '결제 취소',
        actor: payment.userId,
        target: orderId,
        detail: `₩${(cancelAmount ?? payment.amount).toLocaleString()} - ${cancelReason}`,
        severity: 'warning',
      },
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof TossPaymentError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      )
    }
    throw error
  }
})
